# Plan Implementation: Fitur Manajemen Produk & Stok Barang Web Kasir

Dokumen ini berisi kriteria tugas dan panduan implementasi untuk setup fitur Manajemen Produk & Stok Barang pada backend Web Kasir menggunakan **Bun**, **Elysia.js**, dan **Drizzle ORM** dengan database **MySQL**.

---

## 1. Pembaruan Skema Database (`src/db/schema.ts`)
- [ ] **Modifikasi Tabel `products`**:
  - Sesuaikan field agar memuat struktur data produk yang lebih lengkap.
  - Skema akhir yang diharapkan:
    - `id`: Int / Serial (Primary Key, Auto Increment)
    - `code`: VarChar (Unique, opsional untuk barcode/kode unik barang)
    - `name`: VarChar (Nama produk)
    - `category`: VarChar (Kategori produk, misal: 'Makanan', 'Minuman', 'Alat Tulis')
    - `price`: Decimal / BigInt (Harga jual produk)
    - `stock`: Int (Jumlah stok barang saat ini)
    - `createdAt`: Timestamp
    - `updatedAt`: Timestamp (Otomatis update saat data diubah, jika didukung oleh Drizzle/MySQL)
- [ ] Jalankan perintah `bun run db:generate` dan `bun run db:push` untuk menerapkan perubahan skema ke database MySQL.

---

## 2. Pembuatan Layer Service (`src/services/product.service.ts`)
- [ ] Buat class/module `ProductService` yang menangani logika bisnis CRUD produk:
  - `createProduct(data)`: Menyimpan data produk baru ke tabel `products`.
  - `getAllProducts(filters)`: Mengambil daftar produk, terapkan filter pencarian berdasarkan nama atau kategori menggunakan operasi `like` atau `eq` dari Drizzle.
  - `getProductByIdOrCode(identifier)`: Mengambil detail produk tunggal. Lakukan pencarian berdasar ID (angka) atau `code` (string).
  - `updateProduct(id, data)`: Mengubah detail produk atau menyesuaikan stok (tambah/kurang/set).
  - `deleteProduct(id)`: Menghapus produk dari database.

---

## 3. Implementasi REST API CRUD (`src/routes/products.ts`)
Buat modular route di Elysia.js untuk endpoint manajemen produk, integrasikan ke entry point server (`src/index.ts`), dan pastikan endpoint ini **diproteksi dengan Auth Guard** (memerlukan token session yang valid).

- [ ] **Middleware Autentikasi (Auth Guard)**:
  - Terapkan fungsi `derive` atau plugin middleware (sama seperti yang ada di `users.ts` atau buat file `auth.middleware.ts` terpisah agar bisa di-_reuse_) untuk mengecek token Auth di header request pada seluruh route `/api/products`.
  - Jika token tidak ada atau tidak valid, tolak dengan status 401 Unauthorized.

- [ ] **`POST /api/products` (Tambah Produk Baru)**:
  - Validasi body request: `name`, `price`, `stock` (default 0), `code` (opsional), `category` (opsional).
  - Panggil `ProductService.createProduct`.
  - Return 201 Created beserta data produk yang baru dibuat.

- [ ] **`GET /api/products` (Ambil Daftar Produk)**:
  - Dukung *query parameters* (misal: `?name=roti`, `?category=makanan`) untuk pencarian/filter.
  - Panggil `ProductService.getAllProducts` dengan pelemparan query parameters.
  - Return daftar produk.

- [ ] **`GET /api/products/:id` (Detail Produk)**:
  - Tangkap parameter `:id` (bisa berupa ID numerik atau kode barcode).
  - Panggil `ProductService.getProductByIdOrCode`.
  - Jika tidak ditemukan, return 404 Not Found.
  - Return data detail produk.

- [ ] **`PUT /api/products/:id` (Update Data / Stok Produk)**:
  - Tangkap parameter `:id`.
  - Validasi body request (opsional/partial): `name`, `price`, `stock`, `code`, `category`.
  - Panggil `ProductService.updateProduct`.
  - Jika ID tidak valid/tidak ditemukan, return 404.
  - Return data produk yang telah diupdate.

- [ ] **`DELETE /api/products/:id` (Hapus Produk)**:
  - Tangkap parameter `:id`.
  - Panggil `ProductService.deleteProduct`.
  - Jika ID tidak valid, return 404.
  - Return status keberhasilan penghapusan (200 OK / 204 No Content).

---

## 4. Pengujian Unit (Unit Test) (`tests/product.test.ts`)
- [ ] Buat file test `tests/product.test.ts`.
- [ ] Tulis test case menggunakan `bun test` untuk menguji:
  - Akses `GET /api/products` tanpa token harus mengembalikan 401 Unauthorized.
  - Endpoint `POST /api/products` menolak jika validasi gagal (misal harga negatif).
  - Simulasi *mock* atau pemanggilan `app.handle` dengan token valid (atau bypass proteksi dalam mode testing) untuk memastikan routing dan validasi request berjalan benar.
