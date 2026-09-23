# Plan Implementation: Dokumentasi Swagger API & Code Review Web Kasir

Dokumen ini berisi kriteria tugas dan panduan implementasi untuk menambahkan Dokumentasi Swagger API dan menyempurnakan informasi proyek pada backend Web Kasir.

---

## 1. Instalasi dan Setup Swagger (`src/index.ts`)
- [ ] **Install Plugin Swagger**:
  - Jalankan perintah instalasi: `bun add @elysiajs/swagger`
- [ ] **Konfigurasi Elysia**:
  - Import `swagger` dari `@elysiajs/swagger` di `src/index.ts`.
  - Pasang (use) plugin swagger pada instance aplikasi Elysia utama.
  - Konfigurasikan path agar UI Swagger dapat diakses di `/swagger`.
  - Tambahkan konfigurasi metadata dasar Swagger seperti `title` (misal: "Web Kasir API Documentation"), `description`, dan `version`.

---

## 2. Dokumentasi Endpoint API (Schema, Request, & Response)
Lengkapi dekorator schema pada seluruh endpoint agar muncul dengan rapi dan informatif di Swagger UI. Gunakan fungsionalitas `detail` pada object schema endpoint.

- [ ] **Endpoint Autentikasi (`src/routes/users.ts`)**:
  - Tambahkan deksripsi, tags (misal: `['Auth']`), dan tipe response untuk `POST /api/users/register`.
  - Tambahkan deksripsi, tags, dan tipe response untuk `POST /api/users/login`.
  - Tambahkan deksripsi, tags, dan informasi Authorization (Bearer token) untuk `GET /api/users/current`.
  - Tambahkan deksripsi, tags untuk `DELETE /api/users/logout`.

- [ ] **Endpoint Produk (`src/routes/products.ts`)**:
  - Tambahkan deskripsi, tags (`['Products']`), dan contoh request payload untuk `POST /api/products`.
  - Tambahkan deskripsi, tags, dan dokumentasi query params (`name`, `category`) untuk `GET /api/products`.
  - Tambahkan deskripsi, tags, dan params detail untuk `GET /api/products/:id`.
  - Tambahkan deskripsi, tags, dan payload contoh untuk update di `PUT /api/products/:id`.
  - Tambahkan deskripsi dan tags untuk penghapusan di `DELETE /api/products/:id`.

- [ ] **Endpoint Transaksi (`src/routes/transactions.ts`)**:
  - Tambahkan deskripsi lengkap, tags (`['Transactions']`), dan contoh payload kompleks (payAmount, items array) untuk `POST /api/transactions`.
  - Tambahkan deskripsi, tags, dan query parameter untuk filter `userId` di `GET /api/transactions`.
  - Tambahkan deskripsi, tags untuk mengambil detail nota di `GET /api/transactions/:id`.

---

## 3. Pembuatan Dokumentasi Proyek (`README.md`)
Buatkan file `README.md` baru di root direktori yang berisi panduan lengkap untuk developer lain:

- [ ] **Deskripsi dan Arsitektur Proyek**:
  - Penjelasan singkat tentang aplikasi Web Kasir.
  - Tech stack yang digunakan (Bun, Elysia.js, Drizzle ORM, MySQL).
- [ ] **Cara Setup Database MySQL**:
  - Persyaratan environment variables (kebutuhan `.env` seperti `DATABASE_URL`).
  - Perintah migrasi dan sinkronisasi skema (`bun run db:generate` dan `bun run db:push`).
- [ ] **Cara Menjalankan Server**:
  - Instalasi dependency awal (`bun install`).
  - Cara running di development mode (`bun dev` atau `bun run dev`).
  - Lokasi akses API (misal: `http://localhost:3000`) dan Swagger UI (`http://localhost:3000/swagger`).
- [ ] **Cara Menjalankan Unit Test**:
  - Perintah untuk mengeksekusi testing suite (`bun test`).
