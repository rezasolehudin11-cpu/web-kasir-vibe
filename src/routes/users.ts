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
        name: t.String({ minLength: 2 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        role: t.Optional(t.Union([t.Literal("admin"), t.Literal("kasir")])),
      }),
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
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )

  // Middleware / Handler untuk Current User & Logout
  .derive(async ({ headers, set }) => {
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
  .get("/current", ({ user, set }) => {
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
  })

  // DELETE /api/users/logout
  .delete("/logout", async ({ token, user, set }) => {
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
  });
