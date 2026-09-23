# Plan Implementation: Backend Setup Web Kasir Sederhana

Dokumen ini berisi kriteria tugas dan panduan implementasi high-level untuk setup backend Web Kasir Sederhana menggunakan **Bun**, **Elysia.js**, **Drizzle ORM**, dan **MySQL**.

---

## 1. Setup Project & Dependensi Dasar
- [ ] Inisialisasi project Bun di direktori backend (atau root sesuai struktur repository).
- [ ] Install dependensi utama:
  - `elysia` (Framework Web Backend)
  - `@elysiajs/cors` (Middleware CORS jika diperlukan)
  - `drizzle-orm` (ORM Database)
  - `mysql2` (Driver MySQL)
- [ ] Install dependensi development:
  - `drizzle-kit` (Migration & Schema Management Tool)
  - `@types/bun` (TypeScript definitions untuk Bun)
- [ ] Buat file konfigurasi `.env` dan `.env.example` yang memuat variabel koneksi database:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` / `DATABASE_URL`.

---

## 2. Setup Database & Drizzle ORM
- [ ] Buat file konfigurasi Drizzle (`drizzle.config.ts`) untuk mengatur driver MySQL, lokasi file skema, dan output migrasi.
- [ ] Buat file modul koneksi database (`src/db/index.ts`) menggunakan `mysql2` pool dan instance `drizzle`.
- [ ] Buat script npm / bun di `package.json` untuk perintah Drizzle Kit:
  - `db:generate` (Generate migrasi SQL)
  - `db:push` (Push perubahan skema langsung ke DB)
  - `db:studio` (Menjalankan GUI Drizzle Studio)

---

## 3. Skema Dasar Database (`src/db/schema.ts`)
Buat definisi tabel MySQL menggunakan Drizzle ORM:
- [ ] **Tabel `users`**:
  - `id`: Int / Serial (Primary Key, Auto Increment)
  - `name`: VarChar
  - `username`: VarChar (Unique)
  - `password`: VarChar (Hashed)
  - `role`: Enum ('admin', 'kasir')
  - `createdAt`: Timestamp
- [ ] **Tabel `products`**:
  - `id`: Int / Serial (Primary Key, Auto Increment)
  - `name`: VarChar
  - `price`: Decimal / BigInt
  - `stock`: Int
  - `createdAt`: Timestamp
- [ ] **Tabel `transactions`**:
  - `id`: Int / Serial (Primary Key, Auto Increment)
  - `userId`: Foreign Key ke `users.id`
  - `totalAmount`: Decimal / BigInt
  - `createdAt`: Timestamp
- [ ] **Tabel `transaction_items`**:
  - `id`: Int / Serial (Primary Key)
  - `transactionId`: Foreign Key ke `transactions.id`
  - `productId`: Foreign Key ke `products.id`
  - `quantity`: Int
  - `price`: Decimal / BigInt (Harga saat transaksi)

---

## 4. Setup Server Elysia & Endpoint Dasar
- [ ] Buat entry point server Elysia (`src/index.ts`).
- [ ] Tambahkan middleware umum (misal: JSON body parser, CORS).
- [ ] Buat routing modular untuk API:
  - **Health Check / Index**:
    - `GET /api/health`: Return status server dan koneksi DB.
  - **Products Endpoint (`src/routes/products.ts`)**:
    - `GET /api/products`: Ambil semua daftar produk.
    - `POST /api/products`: Tambah produk baru.
    - `PUT /api/products/:id`: Update data/stok produk.
    - `DELETE /api/products/:id`: Hapus produk.
  - **Transactions Endpoint (`src/routes/transactions.ts`)**:
    - `POST /api/transactions`: Buat transaksi kasir baru (menyimpan header transaksi dan item detail, serta mengupdate stok produk).
    - `GET /api/transactions`: Ambil riwayat transaksi.

---

## 5. Verifikasi & Pengujian High-Level
- [ ] Server dapat dijalankan dengan perintah `bun run dev` tanpa error.
- [ ] Perintah `drizzle-kit push` berhasil menghubungkan dan membuat tabel pada database MySQL.
- [ ] Semua endpoint dasar merespons dengan HTTP Status Code yang sesuai (200, 201, 400, 404, 500).
