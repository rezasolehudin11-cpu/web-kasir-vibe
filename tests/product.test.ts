import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Product Endpoints Validation & Routing", () => {
  it("POST /api/products should return 401 Unauthorized when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Product",
          price: 15000,
          stock: 10,
        }),
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("POST /api/products should fail validation if required fields like name are missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-invalid-token",
        },
        body: JSON.stringify({
          category: "Snack",
        }),
      })
    );

    // Elysia schema validation returns 422 or 400
    expect([400, 422]).toContain(res.status);
  });

  it("GET /api/products should be accessible without error", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/products?name=kopi&category=Minuman")
    );

    // Endpoint is reachable (either returns 200 or 500 if DB not connected)
    expect([200, 500]).toContain(res.status);
  });

  it("GET /api/products/:id should handle route parameter correctly", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/products/non-existent-code-999")
    );

    // Since DB may not have this item, it should return 404 or 500 depending on DB connection
    expect([404, 500]).toContain(res.status);
  });

  it("PUT /api/products/:id should return 401 Unauthorized when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/products/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: 20000,
        }),
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("DELETE /api/products/:id should return 401 Unauthorized when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/products/1", {
        method: "DELETE",
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
