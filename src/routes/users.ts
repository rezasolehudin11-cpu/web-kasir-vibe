import { Elysia, t } from "elysia";
import { AuthService } from "../services/auth.service";

export const authRoutes = new Elysia({ prefix: "/api/users" })
  // POST /api/users/register
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await AuthService.register(body);
        set.status = 201;
        return {
          success: true,
          message: "User registered successfully",
          data: user,
        };
      } catch (err: any) {
        if (err.message === "EMAIL_ALREADY_EXISTS") {
          set.status = 400;
          return {
            success: false,
            message: "Email is already registered",
          };
        }
        set.status = 500;
        return {
          success: false,
          message: err.message || "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, examples: ["Budi Santoso"] }),
        email: t.String({ format: "email", examples: ["budi@kasir.com"] }),
        password: t.String({ minLength: 6, examples: ["secret123"] }),
        role: t.Optional(
          t.Union([t.Literal("admin"), t.Literal("kasir")], {
            examples: ["kasir"],
          })
        ),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Registrasi User Baru",
        description:
          "Mendaftarkan kasir atau admin baru ke dalam sistem. Password akan di-hash secara otomatis menggunakan Bun password hasher. Default role adalah `kasir`.",
        responses: {
          "201": {
            description: "Registrasi berhasil, user berhasil dibuat",
          },
          "400": {
            description: "Email sudah terdaftar atau validasi input gagal",
          },
        },
      },
    }
  )

  // POST /api/users/login
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const session = await AuthService.login(body);
        return {
          success: true,
          message: "Login successful",
          data: session,
        };
      } catch (err: any) {
        if (err.message === "INVALID_CREDENTIALS") {
          set.status = 401;
          return {
            success: false,
            message: "Invalid email or password",
          };
        }
        set.status = 500;
        return {
          success: false,
          message: err.message || "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", examples: ["budi@kasir.com"] }),
        password: t.String({ minLength: 1, examples: ["secret123"] }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login User",
        description:
          "Verifikasi email dan password, lalu membuat session token baru. Token yang dikembalikan digunakan sebagai Bearer token untuk mengakses endpoint yang diproteksi.",
        responses: {
          "200": {
            description: "Login berhasil, session token dikembalikan",
          },
          "401": {
            description: "Email atau password salah",
          },
        },
      },
    }
  )

  // Middleware derive auth guard
  .derive(async ({ headers }) => {
    const authHeader = headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return { user: null, token: null };
    }

    const user = await AuthService.validateSession(token);
    return { user, token };
  })

  // GET /api/users/current
  .get(
    "/current",
    ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized or session expired",
        };
      }

      return {
        success: true,
        data: user,
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Data User Saat Ini",
        description:
          "Mengambil data profil user yang sedang login berdasarkan Bearer token yang dikirim di header Authorization.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Data user berhasil dikembalikan",
          },
          "401": {
            description: "Token tidak valid atau sesi sudah kadaluarsa",
          },
        },
      },
    }
  )

  // DELETE /api/users/logout
  .delete(
    "/logout",
    async ({ token, user, set }) => {
      if (!token || !user) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized or session expired",
        };
      }

      await AuthService.logout(token);
      return {
        success: true,
        message: "Logged out successfully",
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Logout User",
        description:
          "Menghapus session token dari database, sehingga token tidak lagi dapat digunakan untuk mengakses API.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Logout berhasil, session token dihapus",
          },
          "401": {
            description: "Token tidak valid atau sesi sudah kadaluarsa",
          },
        },
      },
    }
  );
