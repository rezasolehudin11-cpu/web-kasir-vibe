import { Elysia, t } from "elysia";
import { ProductService } from "../services/product.service";
import { AuthService } from "../services/auth.service";

export const productRoutes = new Elysia({ prefix: "/api/products" })
  // Middleware Auth Guard untuk memvalidasi token sesi
  .derive(async ({ headers, set }) => {
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

  // POST /api/products (Tambah Produk Baru - Butuh Login)
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
        code: t.Optional(t.String()),
        name: t.String({ minLength: 1 }),
        category: t.Optional(t.String()),
        price: t.Union([t.Number({ minimum: 0 }), t.String()]),
        stock: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )

  // GET /api/products (Ambil Semua Produk & Filter Pencarian)
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
        name: t.Optional(t.String()),
        category: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/products/:id (Detail Produk Berdasarkan ID atau Barcode)
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
  })

  // PUT /api/products/:id (Update Data / Stok Produk)
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
        code: t.Optional(t.String()),
        name: t.Optional(t.String({ minLength: 1 })),
        category: t.Optional(t.String()),
        price: t.Optional(t.Union([t.Number({ minimum: 0 }), t.String()])),
        stock: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )

  // DELETE /api/products/:id (Hapus Produk)
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
  });
