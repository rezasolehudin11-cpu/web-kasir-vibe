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

  // POST /api/transactions
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
        payAmount: t.Union([t.Number({ minimum: 0 }), t.String()], {
          description: "Jumlah uang yang dibayarkan pelanggan",
          examples: [100000],
        }),
        items: t.Array(
          t.Object({
            productId: t.Number({
              minimum: 1,
              description: "ID produk yang dibeli",
              examples: [1],
            }),
            quantity: t.Number({
              minimum: 1,
              description: "Jumlah unit produk yang dibeli",
              examples: [2],
            }),
          }),
          {
            minItems: 1,
            description: "Daftar produk yang dibeli dalam satu transaksi",
          }
        ),
      }),
      detail: {
        tags: ["Transactions"],
        summary: "Proses Checkout Belanjaan",
        description:
          "Memproses transaksi checkout kasir. Sistem akan memvalidasi stok setiap produk, menghitung total belanja dari harga aktual di database (bukan dari frontend), memvalidasi kecukupan uang bayar, menghasilkan nomor invoice struk unik, memotong stok produk, dan menyimpan semua data dalam satu database transaction (ACID) untuk menjamin konsistensi data.",
        security: [{ BearerAuth: [] }],
        responses: {
          "201": {
            description:
              "Transaksi berhasil, data invoice dan kembalian dikembalikan",
          },
          "400": {
            description:
              "Stok produk tidak mencukupi, uang bayar kurang, atau data produk tidak ditemukan",
          },
          "401": {
            description: "Tidak terautentikasi (kasir belum login)",
          },
        },
      },
    }
  )

  // GET /api/transactions
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
        userId: t.Optional(
          t.String({
            description: "Filter riwayat transaksi berdasarkan ID kasir",
          })
        ),
      }),
      detail: {
        tags: ["Transactions"],
        summary: "Riwayat Transaksi",
        description:
          "Mengambil daftar seluruh riwayat transaksi kasir, diurutkan dari yang terbaru. Dapat difilter berdasarkan `userId` kasir tertentu melalui query parameter.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Daftar riwayat transaksi berhasil dikembalikan",
          },
          "401": {
            description: "Tidak terautentikasi",
          },
        },
      },
    }
  )

  // GET /api/transactions/:id
  .get(
    "/:id",
    async ({ params: { id }, user, set }) => {
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
    },
    {
      detail: {
        tags: ["Transactions"],
        summary: "Detail Nota / Invoice Transaksi",
        description:
          "Mengambil detail lengkap satu transaksi beserta daftar item yang dibeli. Parameter `:id` dapat berupa ID numerik transaksi atau nomor invoice (contoh: `INV-20260923-12345`).",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description:
              "Detail transaksi beserta item-itemnya berhasil dikembalikan",
          },
          "401": {
            description: "Tidak terautentikasi",
          },
          "404": {
            description: "Transaksi tidak ditemukan",
          },
        },
      },
    }
  );
