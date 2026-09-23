# Web Kasir API

> Backend REST API untuk sistem Point of Sale (POS) kasir modern. Dibangun di atas runtime **Bun** dengan framework **Elysia.js**, ORM **Drizzle**, dan database **MySQL**.

---

## 🚀 Tech Stack

| Teknologi | Versi | Peran |
|---|---|---|
| [Bun](https://bun.sh) | ≥ 1.4 | JavaScript runtime & package manager |
| [Elysia.js](https://elysiajs.com) | ^1.4 | Web framework (routing, validation, middleware) |
| [Drizzle ORM](https://orm.drizzle.team) | ^0.45 | Database ORM & schema management |
| [MySQL](https://www.mysql.com) | 8+ | Database relasional utama |
| [mysql2](https://github.com/sidorares/node-mysql2) | ^3.24 | MySQL driver untuk Node.js/Bun |
| [@elysiajs/swagger](https://elysiajs.com/plugins/swagger) | ^1.3 | OpenAPI / Swagger UI otomatis |
| [@elysiajs/cors](https://elysiajs.com/plugins/cors) | ^1.4 | Cross-Origin Resource Sharing |

---

## 📁 Struktur Folder

```
web-kasir-vibe/
├── src/
│   ├── db/
│   │   ├── index.ts          # Koneksi database Drizzle + MySQL
│   │   └── schema.ts         # Definisi schema tabel (users, sessions, products, transactions)
│   ├── routes/
│   │   ├── users.ts          # Endpoint Auth: register, login, current, logout
│   │   ├── products.ts       # Endpoint CRUD produk & stok
│   │   └── transactions.ts   # Endpoint checkout & riwayat transaksi
│   ├── services/
│   │   ├── auth.service.ts   # Logika bisnis autentikasi & session management
│   │   ├── product.service.ts # Logika bisnis manajemen produk
│   │   └── transaction.service.ts # Logika bisnis checkout (ACID DB transaction)
│   └── index.ts              # Entry point aplikasi + konfigurasi Swagger
├── tests/
│   ├── auth.test.ts          # Unit test endpoint autentikasi
│   ├── product.test.ts       # Unit test endpoint produk
│   └── transaction.test.ts   # Unit test endpoint transaksi
├── drizzle/                  # Generated SQL migration files
├── drizzle.config.ts         # Konfigurasi Drizzle Kit
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Setup & Instalasi

### 1. Prasyarat

Pastikan Anda sudah menginstall:
- **[Bun](https://bun.sh/docs/installation)** (≥ 1.4): `curl -fsSL https://bun.sh/install | bash`
- **MySQL Server** (≥ 8.0) yang sedang berjalan secara lokal atau di server

### 2. Clone & Install Dependensi

```bash
git clone https://github.com/rezasolehudin11-cpu/web-kasir-vibe.git
cd web-kasir-vibe
bun install
```

### 3. Konfigurasi Environment Variable

Buat file `.env` di root direktori proyek:

```bash
cp .env.example .env
```

Kemudian edit file `.env` sesuai konfigurasi database Anda:

```env
# Koneksi Database MySQL
DATABASE_URL="mysql://root:password@localhost:3306/web_kasir"
```

> **Catatan**: Ganti `root`, `password`, dan `web_kasir` sesuai kredensial MySQL dan nama database Anda. Pastikan database `web_kasir` sudah dibuat terlebih dahulu dengan perintah:
> ```sql
> CREATE DATABASE web_kasir;
> ```

### 4. Setup Skema Database

Jalankan perintah berikut untuk membuat atau memperbarui tabel-tabel di database MySQL berdasarkan schema yang ada di `src/db/schema.ts`:

```bash
# Generate SQL migration files (opsional, untuk melihat perubahan)
bun run db:generate

# Push/apply schema langsung ke database
bun run db:push
```

---

## 🏃 Menjalankan Server

### Development Mode (dengan hot-reload)

```bash
bun run dev
```

Server akan berjalan di `http://localhost:3000`. Terminal akan menampilkan:

```
🦊 Elysia is running at localhost:3000
📖 Swagger UI tersedia di http://localhost:3000/swagger
```

### Production Mode

```bash
bun run start
```

---

## 📖 Dokumentasi API (Swagger UI)

Setelah server berjalan, buka browser dan akses:

```
http://localhost:3000/swagger
```

Swagger UI akan menampilkan seluruh endpoint API secara interaktif, lengkap dengan:
- Deskripsi setiap endpoint
- Contoh request body dan query parameter
- Schema validasi input
- Kode response yang mungkin dikembalikan

---

## 🔌 Endpoint API

### Auth (`/api/users`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/users/register` | Registrasi kasir/admin baru | ❌ |
| `POST` | `/api/users/login` | Login, mendapatkan Bearer token | ❌ |
| `GET` | `/api/users/current` | Cek data user yang sedang login | ✅ |
| `DELETE` | `/api/users/logout` | Hapus session (logout) | ✅ |

### Products (`/api/products`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/products` | Tambah produk baru | ✅ |
| `GET` | `/api/products` | Daftar semua produk (bisa filter) | ❌ |
| `GET` | `/api/products/:id` | Detail produk by ID atau barcode | ❌ |
| `PUT` | `/api/products/:id` | Update data atau stok produk | ✅ |
| `DELETE` | `/api/products/:id` | Hapus produk | ✅ |

### Transactions (`/api/transactions`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/transactions` | Proses checkout belanjaan | ✅ |
| `GET` | `/api/transactions` | Riwayat transaksi kasir | ✅ |
| `GET` | `/api/transactions/:id` | Detail nota/invoice transaksi | ✅ |

> **Auth ✅** = Memerlukan header `Authorization: Bearer <token>`

---

## 🧪 Menjalankan Unit Test

```bash
bun test
```

Semua test suite akan dijalankan sekaligus:

```
tests/auth.test.ts
tests/product.test.ts
tests/transaction.test.ts
```

Contoh output sukses:

```
 20 pass
 0 fail
 32 expect() calls
Ran 20 tests across 3 files.
```

---

## 🗄️ Schema Database

### Tabel `users`
Menyimpan data akun kasir dan admin.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT (PK, AI) | Primary Key |
| `name` | VARCHAR(255) | Nama lengkap |
| `email` | VARCHAR(191) | Email unik |
| `password_hash` | VARCHAR(255) | Password yang sudah di-hash |
| `role` | ENUM('admin','kasir') | Role akses |
| `created_at` | TIMESTAMP | Waktu dibuat |

### Tabel `sessions`
Menyimpan session token login aktif.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT (PK, AI) | Primary Key |
| `token` | VARCHAR(255) | Token session unik |
| `user_id` | INT (FK) | Referensi ke `users.id` |
| `expires_at` | TIMESTAMP | Waktu kadaluarsa token |
| `created_at` | TIMESTAMP | Waktu dibuat |

### Tabel `products`
Menyimpan data barang dagangan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT (PK, AI) | Primary Key |
| `code` | VARCHAR(100) | Kode/barcode unik (opsional) |
| `name` | VARCHAR(255) | Nama produk |
| `category` | VARCHAR(100) | Kategori produk |
| `price` | DECIMAL(12,2) | Harga satuan |
| `stock` | INT | Jumlah stok tersedia |
| `created_at` | TIMESTAMP | Waktu dibuat |
| `updated_at` | TIMESTAMP | Waktu terakhir diperbarui |

### Tabel `transactions`
Header transaksi/nota belanja.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT (PK, AI) | Primary Key |
| `invoice_number` | VARCHAR(100) | Nomor invoice unik (`INV-...`) |
| `user_id` | INT (FK) | Kasir yang memproses |
| `total_amount` | DECIMAL(12,2) | Total nilai belanjaan |
| `pay_amount` | DECIMAL(12,2) | Uang yang dibayarkan pelanggan |
| `change_amount` | DECIMAL(12,2) | Kembalian untuk pelanggan |
| `created_at` | TIMESTAMP | Waktu transaksi |

### Tabel `transaction_items`
Detail item per transaksi.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INT (PK, AI) | Primary Key |
| `transaction_id` | INT (FK) | Referensi ke `transactions.id` |
| `product_id` | INT (FK) | Referensi ke `products.id` |
| `quantity` | INT | Jumlah unit dibeli |
| `price` | DECIMAL(12,2) | Harga satuan saat transaksi |
| `subtotal` | DECIMAL(12,2) | Subtotal item (`price × quantity`) |

---

## 📝 Contoh Penggunaan API

### 1. Login dan Dapatkan Token

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kasir@toko.com","password":"secret123"}'
```

### 2. Tambah Produk (dengan token)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"code":"SKU-001","name":"Kopi Susu","category":"Minuman","price":15000,"stock":100}'
```

### 3. Proses Checkout

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "payAmount": 50000,
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 3, "quantity": 1}
    ]
  }'
```

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan pembelajaran dan pengembangan sistem kasir sederhana.
