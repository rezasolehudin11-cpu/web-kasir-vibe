import { describe, expect, it } from "bun:test";
import { app } from "../src/index";
import { TransactionService } from "../src/services/transaction.service";

describe("Transaction Service Unit Logic", () => {
  it("generateInvoiceNumber should return invoice formatted with INV prefix and date", () => {
    const invoice = TransactionService.generateInvoiceNumber();
    expect(invoice).toBeString();
    expect(invoice.startsWith("INV-")).toBe(true);
    expect(invoice.length).toBeGreaterThan(10);
  });

  it("checkout should reject when items array is empty", async () => {
    try {
      await TransactionService.checkout(1, {
        payAmount: 50000,
        items: [],
      });
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      expect(err.message).toBe("EMPTY_ITEMS");
    }
  });

  it("checkout should reject when payAmount is invalid or negative", async () => {
    try {
      await TransactionService.checkout(1, {
        payAmount: -1000,
        items: [{ productId: 1, quantity: 1 }],
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toBe("INVALID_PAY_AMOUNT");
    }
  });

  it("checkout should reject when item quantity is zero or negative", async () => {
    try {
      await TransactionService.checkout(1, {
        payAmount: 50000,
        items: [{ productId: 1, quantity: 0 }],
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toBe("INVALID_ITEM_QUANTITY");
    }
  });
});

describe("Transaction Endpoints Routing & Validation", () => {
  it("POST /api/transactions should return 401 Unauthorized when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payAmount: 100000,
          items: [
            {
              productId: 1,
              quantity: 2,
            },
          ],
        }),
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("Unauthorized");
  });

  it("POST /api/transactions should fail validation if payload format is incorrect or empty items", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token-test",
        },
        body: JSON.stringify({
          payAmount: 10000,
          items: [], // empty array should fail schema minItems: 1
        }),
      })
    );

    // Elysia schema validation returns 422 or 400
    expect([400, 422]).toContain(res.status);
  });

  it("POST /api/transactions should fail validation if required fields like payAmount are missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token-test",
        },
        body: JSON.stringify({
          items: [{ productId: 1, quantity: 1 }],
        }),
      })
    );

    expect([400, 422]).toContain(res.status);
  });

  it("GET /api/transactions should return 401 Unauthorized when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/transactions", {
        method: "GET",
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("GET /api/transactions/:id should return 401 Unauthorized when no token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/transactions/INV-20260923-0001", {
        method: "GET",
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
