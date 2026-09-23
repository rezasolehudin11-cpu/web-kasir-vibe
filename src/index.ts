import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/users";
import { productRoutes } from "./routes/products";
import { transactionRoutes } from "./routes/transactions";

export const app = new Elysia()
  .use(cors())
  .get("/", () => ({ message: "Web Kasir API is running" }))
  .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(productRoutes)
  .use(transactionRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(3000);
  console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
}

export type App = typeof app;
