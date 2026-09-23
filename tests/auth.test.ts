import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Auth Endpoints Validation & Routing", () => {
  it("GET /api/health should return ok status", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("POST /api/users/register should fail validation if required fields are missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
        }),
      })
    );

    // Elysia schema validation failure returns 422 or 400
    expect([400, 422]).toContain(res.status);
  });

  it("POST /api/users/login should fail validation if invalid email format is passed", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "123",
        }),
      })
    );

    expect([400, 422]).toContain(res.status);
  });

  it("GET /api/users/current should return 401 when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("DELETE /api/users/logout should return 401 when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
