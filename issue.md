# Plan Implementation: Fitur Transaksi & Checkout Web Kasir

Dokumen ini berisi kriteria tugas dan panduan implementasi untuk fitur Transaksi & Checkout pada backend Web Kasir menggunakan **Bun**, **Elysia.js**, dan **Drizzle ORM** dengan database **MySQL**.

---

## 1. Pembaruan Skema Database (`src/db/schema.ts`)
- [x] **Modifikasi Tabel `transactions`**:
  - `id`: Int / Serial (Primary Key, Auto Increment)
  - `invoiceNumber`: VarChar (Unique, untuk referensi nomor nota struk)
  - `userId`: Int (Foreign Key ke `users.id` - kasir yang bertugas)
  - `totalAmount`: Decimal / BigInt (Total belanjaan)
  - `payAmount`: Decimal / BigInt (Uang yang dibayarkan pelanggan)
  - `changeAmount`: Decimal / BigInt (Uang kembalian)
  - `createdAt`: Timestamp
- [x] **Modifikasi Tabel `transaction_items`**:
  - `id`: Int / Serial (Primary Key, Auto Increment)
  - `transactionId`: Int (Foreign Key ke `transactions.id`)
  - `productId`: Int (Foreign Key ke `products.id`)
  - `quantity`: Int (Jumlah barang dibeli)
  - `price`: Decimal / BigInt (Harga barang satuan pada saat transaksi)
  - `subtotal`: Decimal / BigInt (`quantity` x `price`)
- [x] Jalankan perintah `bun run db:generate` dan `bun run db:push` untuk menerapkan perubahan skema ke database MySQL.

---

## 2. Pembuatan Layer Service (`src/services/transaction.service.ts`)
- [x] Buat class/module `TransactionService` untuk meng-handle logika bisnis transaksi:
  - `checkout(userId, payload)`:
    - Gunakan **Database Transaction** (`db.transaction(async (tx) => { ... })`) Drizzle ORM untuk menjamin atomicity.
    - Cek ketersediaan setiap produk dari database (apakah stoknya mencukupi dari `quantity` yang dibeli).
    - Lakukan kalkulasi ulang total di sisi server (jangan hanya percaya `totalAmount` dari frontend) = `Sum(quantity * db_price)`.
    - Validasi `payAmount >= totalAmount`.
    - Hitung `changeAmount = payAmount - totalAmount`.
    - Simpan data header ke tabel `transactions` dengan men-generate `invoiceNumber` yang unik (misal: `INV-20260923-001`).
    - Simpan masing-masing item ke tabel `transaction_items`.
    - Potong stok tiap produk pada tabel `products` (`stock = stock - quantity`).
  - `getTransactions(filters)`:
    - Ambil daftar riwayat transaksi, opsional dengan filter tanggal atau userId kasir.
  - `getTransactionDetails(identifier)`:
    - Ambil detail satu transaksi beserta relasi item yang dibeli berdasarkan ID numerik atau `invoiceNumber`.

---

## 3. Implementasi REST API (`src/routes/transactions.ts`)
Buat modular route di Elysia.js untuk endpoint transaksi. Integrasikan ke `src/index.ts` dan **wajib gunakan Auth Guard** untuk semua route di bawah ini.

- [x] **`POST /api/transactions` (Proses Checkout)**:
  - Diproteksi Auth Guard (hanya user login yang bisa melakukan).
  - Validasi body request menggunakan schema Elysia:
    - `payAmount`: Number/String.
    - `items`: Array dari object `{ productId, quantity }`.
  - Ambil `userId` dari token session yang sedang login.
  - Panggil `TransactionService.checkout(userId, body)`.
  - Return respon status 201 dengan informasi nota/invoice transaksi yang sukses beserta kembalian.
  - Jika stok kurang atau uang kurang, return 400 Bad Request.

- [x] **`GET /api/transactions` (Daftar Riwayat Transaksi)**:
  - Diproteksi Auth Guard.
  - Panggil `TransactionService.getTransactions()`.
  - Return daftar riwayat transaksi kasir.

- [x] **`GET /api/transactions/:id` (Detail Transaksi / Nota)**:
  - Diproteksi Auth Guard.
  - Tangkap parameter `:id` (bisa ID atau `invoiceNumber`).
  - Return detail transaksi beserta item-itemnya. Jika tidak ada, return 404 Not Found.

---

## 4. Pengujian Unit (Unit Test) (`tests/transaction.test.ts`)
- [x] Buat file test `tests/transaction.test.ts`.
- [x] Tulis test case menggunakan `bun test`:
  - `POST /api/transactions` tanpa token harus mereturn 401 Unauthorized.
  - Payload checkout dengan format salah ditolak oleh validasi Elysia.
  - Jika `payAmount` lebih kecil dari `totalAmount`, harus me-return 400 Bad Request atau throw validasi dari service.
  - Simulasi checkout sukses mengembalikan `invoiceNumber` dan status 201 (opsional: dapat dimock service-nya atau menggunakan test db).
