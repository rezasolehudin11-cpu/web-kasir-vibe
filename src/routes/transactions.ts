import { Elysia, t } from "elysia";
import { TransactionService } from "../services/transaction.service";
import { AuthService } from "../services/auth.service";

export const transactionRoutes = new Elysia({ prefix: "/api/transactions" })
  // Middleware Auth Guard untuk memvalidasi token sesi kasir/admin
  .derive(async ({ headers }) => {
    const authHeader = headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return { user: null };
    }

    const user = await AuthService.validateSession(token);
    return { user };
  })

  // POST /api/transactions (Proses Checkout Belanjaan)
  .post(
    "/",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized: Please log in to process transactions",
        };
      }

      try {
        const transaction = await TransactionService.checkout(user.id, body);
        set.status = 201;
        return {
          success: true,
          message: "Transaction completed successfully",
          data: transaction,
        };
      } catch (err: any) {
        const msg = err.message || "";
        if (
          msg.startsWith("INSUFFICIENT_STOCK") ||
          msg.startsWith("INSUFFICIENT_PAY_AMOUNT") ||
          msg.startsWith("PRODUCT_NOT_FOUND") ||
          msg.startsWith("EMPTY_ITEMS") ||
          msg.startsWith("INVALID_ITEM_QUANTITY") ||
          msg.startsWith("INVALID_PAY_AMOUNT")
        ) {
          set.status = 400;
          return {
            success: false,
            message: msg,
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
        payAmount: t.Union([t.Number({ minimum: 0 }), t.String()]),
        items: t.Array(
          t.Object({
            productId: t.Number({ minimum: 1 }),
            quantity: t.Number({ minimum: 1 }),
          }),
          { minItems: 1 }
        ),
      }),
    }
  )

  // GET /api/transactions (Riwayat Transaksi)
  .get(
    "/",
    async ({ user, query, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized: Please log in to view transactions",
        };
      }

      try {
        const filters = {
          userId: query.userId ? parseInt(query.userId, 10) : undefined,
        };

        const list = await TransactionService.getTransactions(filters);
        return {
          success: true,
          data: list,
        };
      } catch (err: any) {
        set.status = 500;
        return {
          success: false,
          message: err.message || "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        userId: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/transactions/:id (Detail Nota / Invoice Transaksi)
  .get("/:id", async ({ params: { id }, user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        message: "Unauthorized: Please log in to view transaction details",
      };
    }

    try {
      const transaction = await TransactionService.getTransactionDetails(id);

      if (!transaction) {
        set.status = 404;
        return {
          success: false,
          message: "Transaction not found",
        };
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (err: any) {
      set.status = 500;
      return {
        success: false,
        message: err.message || "Internal server error",
      };
    }
  });
