import { db } from "../db";
import { transactions, transactionItems, products, users } from "../db/schema";
import { eq, or, desc, sql } from "drizzle-orm";

export interface CheckoutItemDTO {
  productId: number;
  quantity: number;
}

export interface CheckoutDTO {
  payAmount: string | number;
  items: CheckoutItemDTO[];
}

export interface TransactionFilters {
  userId?: number;
}

export class TransactionService {
  /**
   * Menghasilkan nomor invoice unik berformat INV-YYYYMMDD-XXXX
   */
  static generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampMillis = Date.now().toString().slice(-4);
    return `INV-${dateStr}-${timestampMillis}${randomSuffix}`;
  }

  /**
   * Memproses checkout belanjaan kasir dengan ACID Database Transaction
   */
  static async checkout(userId: number, data: CheckoutDTO) {
    if (!data.items || data.items.length === 0) {
      throw new Error("EMPTY_ITEMS");
    }

    const payAmountNum = Number(data.payAmount);
    if (isNaN(payAmountNum) || payAmountNum < 0) {
      throw new Error("INVALID_PAY_AMOUNT");
    }

    for (const item of data.items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error("INVALID_ITEM_QUANTITY");
      }
    }

    // Jalankan transaksi database
    return await db.transaction(async (tx) => {
      let calculatedTotal = 0;
      const itemsToProcess: Array<{
        product: typeof products.$inferSelect;
        quantity: number;
        subtotal: number;
      }> = [];

      // 1. Validasi keberadaan produk & kecukupan stok
      for (const item of data.items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND: Product ID ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Stok ${product.name} tidak cukup (Tersedia: ${product.stock}, Diminta: ${item.quantity})`
          );
        }

        const priceNum = Number(product.price);
        const subtotal = priceNum * item.quantity;
        calculatedTotal += subtotal;

        itemsToProcess.push({
          product,
          quantity: item.quantity,
          subtotal,
        });
      }

      // 2. Validasi jumlah bayar tidak boleh kurang dari total belanja
      if (payAmountNum < calculatedTotal) {
        throw new Error(
          `INSUFFICIENT_PAY_AMOUNT: Uang bayar (${payAmountNum}) kurang dari total tagihan (${calculatedTotal})`
        );
      }

      const changeAmount = payAmountNum - calculatedTotal;
      const invoiceNumber = this.generateInvoiceNumber();

      // 3. Simpan header transaksi
      const [insertedTx] = await tx.insert(transactions).values({
        invoiceNumber,
        userId,
        totalAmount: calculatedTotal.toFixed(2),
        payAmount: payAmountNum.toFixed(2),
        changeAmount: changeAmount.toFixed(2),
      });

      const transactionId = insertedTx.insertId;

      // 4. Simpan setiap item transaksi & potong stok produk
      const savedItems = [];
      for (const entry of itemsToProcess) {
        await tx.insert(transactionItems).values({
          transactionId,
          productId: entry.product.id,
          quantity: entry.quantity,
          price: Number(entry.product.price).toFixed(2),
          subtotal: entry.subtotal.toFixed(2),
        });

        // Kurangi stok barang
        await tx
          .update(products)
          .set({
            stock: entry.product.stock - entry.quantity,
          })
          .where(eq(products.id, entry.product.id));

        savedItems.push({
          productId: entry.product.id,
          name: entry.product.name,
          code: entry.product.code,
          price: Number(entry.product.price).toFixed(2),
          quantity: entry.quantity,
          subtotal: entry.subtotal.toFixed(2),
        });
      }

      return {
        id: transactionId,
        invoiceNumber,
        userId,
        totalAmount: calculatedTotal.toFixed(2),
        payAmount: payAmountNum.toFixed(2),
        changeAmount: changeAmount.toFixed(2),
        items: savedItems,
        createdAt: new Date(),
      };
    });
  }

  /**
   * Mengambil riwayat transaksi kasir
   */
  static async getTransactions(filters?: TransactionFilters) {
    let query = db
      .select({
        id: transactions.id,
        invoiceNumber: transactions.invoiceNumber,
        userId: transactions.userId,
        cashierName: users.name,
        totalAmount: transactions.totalAmount,
        payAmount: transactions.payAmount,
        changeAmount: transactions.changeAmount,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .orderBy(desc(transactions.createdAt));

    if (filters?.userId) {
      return await query.where(eq(transactions.userId, filters.userId));
    }

    return await query;
  }

  /**
   * Mengambil detail transaksi berdasarkan ID numerik atau Invoice Number beserta relasi itemnya
   */
  static async getTransactionDetails(identifier: string | number) {
    const isNumeric = typeof identifier === "number" || /^\d+$/.test(identifier.toString());

    let condition = isNumeric
      ? or(
          eq(transactions.id, Number(identifier)),
          eq(transactions.invoiceNumber, identifier.toString())
        )
      : eq(transactions.invoiceNumber, identifier.toString());

    const [txRecord] = await db
      .select({
        id: transactions.id,
        invoiceNumber: transactions.invoiceNumber,
        userId: transactions.userId,
        cashierName: users.name,
        totalAmount: transactions.totalAmount,
        payAmount: transactions.payAmount,
        changeAmount: transactions.changeAmount,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(condition)
      .limit(1);

    if (!txRecord) {
      return null;
    }

    // Ambil detail item dari transaksi
    const items = await db
      .select({
        id: transactionItems.id,
        productId: transactionItems.productId,
        productName: products.name,
        productCode: products.code,
        category: products.category,
        quantity: transactionItems.quantity,
        price: transactionItems.price,
        subtotal: transactionItems.subtotal,
      })
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .where(eq(transactionItems.transactionId, txRecord.id));

    return {
      ...txRecord,
      items,
    };
  }
}
