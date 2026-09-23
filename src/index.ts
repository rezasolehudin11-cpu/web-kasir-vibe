import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/users";
import { productRoutes } from "./routes/products";
import { transactionRoutes } from "./routes/transactions";

export const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Web Kasir API Documentation",
          description:
            "REST API untuk sistem Point of Sale (POS) Web Kasir. Dibangun menggunakan Bun, Elysia.js, Drizzle ORM, dan MySQL. Mendukung autentikasi berbasis session token, manajemen produk & stok, serta proses transaksi checkout kasir.",
          version: "1.0.0",
          contact: {
            name: "Web Kasir Team",
          },
        },
        tags: [
          {
            name: "General",
            description: "Endpoint umum untuk health check dan status server",
          },
          {
            name: "Auth",
            description:
              "Endpoint autentikasi: registrasi, login, sesi aktif, dan logout kasir/admin",
          },
          {
            name: "Products",
            description:
              "Endpoint CRUD manajemen produk dan stok barang dagangan",
          },
          {
            name: "Transactions",
            description:
              "Endpoint proses checkout kasir, riwayat, dan detail nota/invoice transaksi",
          },
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "Token session yang didapatkan setelah login. Format: `Bearer <token>`",
            },
          },
        },
      },
    })
  )
  .get("/", () => ({ message: "Web Kasir API is running" }), {
    detail: {
      tags: ["General"],
      summary: "Root endpoint",
      description: "Endpoint root untuk mengecek apakah server berjalan.",
    },
  })
  .get(
    "/api/health",
    () => ({ status: "ok", timestamp: new Date().toISOString() }),
    {
      detail: {
        tags: ["General"],
        summary: "Health Check",
        description: "Mengecek status kesehatan server API.",
        responses: {
          "200": {
            description: "Server dalam kondisi baik",
          },
        },
      },
    }
  )
  .use(authRoutes)
  .use(productRoutes)
  .use(transactionRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(3000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
  console.log(`📖 Swagger UI tersedia di http://localhost:3000/swagger`);
}

export type App = typeof app;
