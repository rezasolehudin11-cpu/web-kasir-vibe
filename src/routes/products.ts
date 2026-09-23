import { Elysia, t } from "elysia";
import { ProductService } from "../services/product.service";
import { AuthService } from "../services/auth.service";

export const productRoutes = new Elysia({ prefix: "/api/products" })
  // Middleware Auth Guard
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

  // POST /api/products
  .post(
    "/",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized: Please log in to create products",
        };
      }

      try {
        const product = await ProductService.createProduct(body);
        set.status = 201;
        return {
          success: true,
          message: "Product created successfully",
          data: product,
        };
      } catch (err: any) {
        if (err.message === "PRODUCT_CODE_EXISTS") {
          set.status = 400;
          return {
            success: false,
            message: "Product code/barcode already exists",
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
        code: t.Optional(t.String({ examples: ["SKU-001"] })),
        name: t.String({ minLength: 1, examples: ["Kopi Susu Gula Aren"] }),
        category: t.Optional(t.String({ examples: ["Minuman"] })),
        price: t.Union([t.Number({ minimum: 0 }), t.String()], {
          examples: [15000],
        }),
        stock: t.Optional(t.Number({ minimum: 0, examples: [100] })),
      }),
      detail: {
        tags: ["Products"],
        summary: "Tambah Produk Baru",
        description:
          "Membuat produk baru dengan informasi nama, kategori, harga, dan stok awal. Memerlukan autentikasi. Kode barcode (field `code`) bersifat opsional namun harus unik jika diisi.",
        security: [{ BearerAuth: [] }],
        responses: {
          "201": {
            description: "Produk berhasil dibuat",
          },
          "400": {
            description: "Kode/barcode produk sudah ada atau validasi gagal",
          },
          "401": {
            description: "Tidak terautentikasi",
          },
        },
      },
    }
  )

  // GET /api/products
  .get(
    "/",
    async ({ query }) => {
      const filters = {
        name: query.name,
        category: query.category,
      };

      const productList = await ProductService.getAllProducts(filters);
      return {
        success: true,
        data: productList,
      };
    },
    {
      query: t.Object({
        name: t.Optional(
          t.String({ description: "Filter produk berdasarkan nama (partial match)" })
        ),
        category: t.Optional(
          t.String({ description: "Filter produk berdasarkan kategori (exact match)" })
        ),
      }),
      detail: {
        tags: ["Products"],
        summary: "Daftar Semua Produk",
        description:
          "Mengambil seluruh daftar produk yang tersedia. Mendukung filter pencarian berdasarkan `name` (partial match) dan `category` (exact match) melalui query parameter.",
        responses: {
          "200": {
            description: "Daftar produk berhasil dikembalikan",
          },
        },
      },
    }
  )

  // GET /api/products/:id
  .get("/:id", async ({ params: { id }, set }) => {
    const product = await ProductService.getProductByIdOrCode(id);

    if (!product) {
      set.status = 404;
      return {
        success: false,
        message: "Product not found",
      };
    }

    return {
      success: true,
      data: product,
    };
  }, {
    detail: {
      tags: ["Products"],
      summary: "Detail Produk",
      description:
        "Mengambil detail satu produk berdasarkan ID numerik atau kode barcode produk.",
      responses: {
        "200": {
          description: "Data produk ditemukan dan dikembalikan",
        },
        "404": {
          description: "Produk tidak ditemukan",
        },
      },
    },
  })

  // PUT /api/products/:id
  .put(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Unauthorized: Please log in to update products",
        };
      }

      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        set.status = 400;
        return {
          success: false,
          message: "Invalid product ID",
        };
      }

      try {
        const updated = await ProductService.updateProduct(numericId, body);
        if (!updated) {
          set.status = 404;
          return {
            success: false,
            message: "Product not found",
          };
        }

        return {
          success: true,
          message: "Product updated successfully",
          data: updated,
        };
      } catch (err: any) {
        if (err.message === "PRODUCT_CODE_EXISTS") {
          set.status = 400;
          return {
            success: false,
            message: "Product code/barcode already exists",
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
        code: t.Optional(t.String({ examples: ["SKU-001-NEW"] })),
        name: t.Optional(t.String({ minLength: 1, examples: ["Kopi Hitam"] })),
        category: t.Optional(t.String({ examples: ["Minuman"] })),
        price: t.Optional(
          t.Union([t.Number({ minimum: 0 }), t.String()], { examples: [18000] })
        ),
        stock: t.Optional(t.Number({ minimum: 0, examples: [50] })),
      }),
      detail: {
        tags: ["Products"],
        summary: "Update Data Produk",
        description:
          "Memperbarui informasi produk (nama, kode, kategori, harga) atau jumlah stok barang. Semua field bersifat opsional, hanya field yang dikirim yang akan diperbarui. Memerlukan autentikasi.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Produk berhasil diperbarui",
          },
          "400": {
            description: "ID tidak valid atau kode produk sudah ada",
          },
          "401": {
            description: "Tidak terautentikasi",
          },
          "404": {
            description: "Produk tidak ditemukan",
          },
        },
      },
    }
  )

  // DELETE /api/products/:id
  .delete("/:id", async ({ params: { id }, user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        message: "Unauthorized: Please log in to delete products",
      };
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      set.status = 400;
      return {
        success: false,
        message: "Invalid product ID",
      };
    }

    const deleted = await ProductService.deleteProduct(numericId);
    if (!deleted) {
      set.status = 404;
      return {
        success: false,
        message: "Product not found",
      };
    }

    return {
      success: true,
      message: "Product deleted successfully",
    };
  }, {
    detail: {
      tags: ["Products"],
      summary: "Hapus Produk",
      description:
        "Menghapus produk secara permanen dari database berdasarkan ID numerik. Memerlukan autentikasi.",
      security: [{ BearerAuth: [] }],
      responses: {
        "200": {
          description: "Produk berhasil dihapus",
        },
        "400": {
          description: "ID produk tidak valid",
        },
        "401": {
          description: "Tidak terautentikasi",
        },
        "404": {
          description: "Produk tidak ditemukan",
        },
      },
    },
  });
