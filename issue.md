# Plan Implementation: Fitur Autentikasi Web Kasir

Dokumen ini berisi kriteria tugas dan panduan implementasi untuk setup fitur autentikasi pada backend Web Kasir menggunakan **Bun**, **Elysia.js**, dan **Drizzle ORM** dengan database **MySQL**.

---

## 1. Pembaruan Skema Database (`src/db/schema.ts`)
- [ ] **Modifikasi Tabel `users`**:
  - Sesuaikan field agar memuat `email` (sebagai ganti atau tambahan dari `username`).
  - Ubah nama field `password` menjadi `password_hash` untuk kejelasan.
  - Skema akhir yang diharapkan:
    - `id`: Int / Serial (Primary Key, Auto Increment)
    - `name`: VarChar
    - `email`: VarChar (Unique)
    - `password_hash`: VarChar
    - `role`: Enum ('admin', 'kasir')
    - `createdAt`: Timestamp
- [ ] **Buat Tabel Baru `sessions`**:
  - `id`: Int / Serial (Primary Key, Auto Increment)
  - `token`: VarChar (Unique, untuk menyimpan session token)
  - `userId`: Foreign Key ke `users.id`
  - `expiresAt`: Timestamp (Kapan token ini kedaluwarsa)
  - `createdAt`: Timestamp
- [ ] Jalankan perintah `bun run db:generate` dan `bun run db:push` untuk menerapkan perubahan skema ke database MySQL.

---

## 2. Dependensi Autentikasi & Keamanan
- [ ] Gunakan API bawaan Bun untuk hashing password, yaitu `Bun.password.hash()` dan `Bun.password.verify()`, sehingga tidak memerlukan library `bcrypt` eksternal. (Atau gunakan `bcrypt` jika preferensi khusus).
- [ ] (Opsional) Buat utilitas khusus untuk men-generate random string session token, misal menggunakan `crypto.randomBytes` atau fungsi sejenis.

---

## 3. Implementasi REST API Auth (`src/routes/users.ts` atau `src/routes/auth.ts`)
Buat modular route di Elysia.js untuk endpoint autentikasi dan integrasikan ke entry point server (`src/index.ts`).

- [ ] **`POST /api/users/register` (Registrasi User Baru)**:
  - Validasi body request: `name`, `email`, `password`, `role` (opsional, default 'kasir').
  - Hash `password` menggunakan `Bun.password.hash()`.
  - Simpan data user baru ke tabel `users` beserta `password_hash`-nya.
  - Return respon status 201 dengan informasi user (kecuali password) atau pesan sukses.

- [ ] **`POST /api/users/login` (Proses Login & Buat Session)**:
  - Validasi body request: `email`, `password`.
  - Cari user di tabel `users` berdasarkan `email`. Jika tidak ada, return error 401 Unauthorized.
  - Verifikasi password dengan `Bun.password.verify(password, user.password_hash)`. Jika salah, return error 401.
  - Jika berhasil, generate random string yang aman untuk session `token`.
  - Simpan token tersebut ke tabel `sessions` dengan `userId` yang sesuai, dan set `expiresAt` (misal 24 jam atau 7 hari dari sekarang).
  - Return respon berisi `token` (dan mungkin info user dasar). *Opsional: Set token dalam HTTP-Only Cookie*.

- [ ] **Middleware Autentikasi (Auth Guard)**:
  - Buat plugin/middleware Elysia untuk memproteksi endpoint yang membutuhkan login.
  - Middleware harus membaca session token dari *Header* (misal: `Authorization: Bearer <token>`) atau *Cookie*.
  - Cek tabel `sessions` untuk mencocokkan token. Jika token valid dan belum *expired* (`expiresAt` > sekarang), ambil `userId` dan cari data user-nya.
  - Lempar context `user` ke endpoint selanjutnya. Jika tidak valid, throw 401 Unauthorized.

- [ ] **`GET /api/users/current` (Ambil Data User Login)**:
  - Terapkan middleware Autentikasi.
  - Return data user (id, name, email, role) dari context `user` yang dilempar oleh middleware.

- [ ] **`DELETE /api/users/logout` (Hapus Session)**:
  - Terapkan middleware Autentikasi.
  - Hapus atau invalidasi record di tabel `sessions` berdasarkan `token` yang digunakan saat ini.
  - Return pesan berhasil logout.

---

## 4. Verifikasi & Pengujian
- [ ] Flow Registrasi: Register berhasil dan password di-hash dalam database.
- [ ] Flow Login: Login gagal dengan kredensial salah, dan login berhasil mereturn token serta menyimpannya ke tabel `sessions`.
- [ ] Proteksi Endpoint: Mencoba akses `/api/users/current` tanpa token gagal, dengan token valid berhasil.
- [ ] Flow Logout: Logout menghapus token dari database, sehingga token tersebut tidak bisa dipakai lagi untuk akses `/api/users/current`.
