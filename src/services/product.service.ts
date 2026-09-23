import { db } from "../db";
import { products } from "../db/schema";
import { eq, or, like, sql } from "drizzle-orm";

export interface CreateProductDTO {
  code?: string;
  name: string;
  category?: string;
  price: string | number;
  stock?: number;
}

export interface UpdateProductDTO {
  code?: string;
  name?: string;
  category?: string;
  price?: string | number;
  stock?: number;
}

export interface ProductFilters {
  name?: string;
  category?: string;
}

export class ProductService {
  static async createProduct(data: CreateProductDTO) {
    if (data.code) {
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.code, data.code))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("PRODUCT_CODE_EXISTS");
      }
    }

    const priceString = typeof data.price === "number" ? data.price.toFixed(2) : data.price;

    const [insertResult] = await db.insert(products).values({
      code: data.code || null,
      name: data.name,
      category: data.category || null,
      price: priceString,
      stock: data.stock ?? 0,
    });

    const insertedId = insertResult.insertId;

    const [newProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, insertedId))
      .limit(1);

    return newProduct;
  }

  static async getAllProducts(filters?: ProductFilters) {
    let conditions = [];

    if (filters?.name) {
      conditions.push(like(products.name, `%${filters.name}%`));
    }

    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }

    if (conditions.length > 0) {
      let query = db.select().from(products);
      if (conditions.length === 1) {
        return await query.where(conditions[0]);
      } else {
        return await query.where(sql`${conditions[0]} AND ${conditions[1]}`);
      }
    }

    return await db.select().from(products);
  }

  static async getProductByIdOrCode(identifier: string) {
    const isNumeric = /^\d+$/.test(identifier);

    if (isNumeric) {
      const numericId = parseInt(identifier, 10);
      const [productById] = await db
        .select()
        .from(products)
        .where(or(eq(products.id, numericId), eq(products.code, identifier)))
        .limit(1);

      return productById || null;
    }

    const [productByCode] = await db
      .select()
      .from(products)
      .where(eq(products.code, identifier))
      .limit(1);

    return productByCode || null;
  }

  static async updateProduct(id: number, data: UpdateProductDTO) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      return null;
    }

    if (data.code && data.code !== existing.code) {
      const [duplicate] = await db
        .select()
        .from(products)
        .where(eq(products.code, data.code))
        .limit(1);

      if (duplicate) {
        throw new Error("PRODUCT_CODE_EXISTS");
      }
    }

    const updateValues: Record<string, any> = {};
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.code !== undefined) updateValues.code = data.code;
    if (data.category !== undefined) updateValues.category = data.category;
    if (data.price !== undefined) {
      updateValues.price = typeof data.price === "number" ? data.price.toFixed(2) : data.price;
    }
    if (data.stock !== undefined) updateValues.stock = data.stock;

    if (Object.keys(updateValues).length === 0) {
      return existing;
    }

    await db.update(products).set(updateValues).where(eq(products.id, id));

    const [updatedProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return updatedProduct;
  }

  static async deleteProduct(id: number) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      return false;
    }

    await db.delete(products).where(eq(products.id, id));
    return true;
  }
}
