# Plan Implementation: Frontend Web Kasir — Tahap 1: Setup Proyek Next.js & Halaman Login

Dokumen ini berisi kriteria tugas dan panduan implementasi untuk membangun frontend aplikasi Web Kasir menggunakan **Next.js (App Router)**, **TypeScript**, dan **Tailwind CSS**. Tahap pertama ini berfokus pada setup proyek, autentikasi, dan halaman login kasir.

---

## 1. Setup Proyek Next.js (`frontend/`)

- [ ] **Inisialisasi Proyek Next.js** di dalam folder `frontend/`:
  - Gunakan `npx create-next-app@latest ./frontend` dengan opsi:
    - App Router: **Ya**
    - TypeScript: **Ya**
    - Tailwind CSS: **Ya**
    - ESLint: **Ya**
    - `src/` directory: **Ya**
  - Pastikan proyek dapat dijalankan dengan `npm run dev` di folder `frontend/`.

- [ ] **Install Dependensi UI Pendukung**:
  - `lucide-react` — Library ikon modern dan ringan.
  - `axios` — HTTP client untuk komunikasi dengan backend API.
  - `clsx` dan `tailwind-merge` — Utility untuk menggabungkan dan mengelola Tailwind CSS class secara kondisional.
  - Perintah: `npm install lucide-react axios clsx tailwind-merge`

- [ ] **Konfigurasi Tailwind & Global Styles**:
  - Sesuaikan `tailwind.config.ts` jika diperlukan (tambahkan custom color palette tema kasir).
  - Pastikan `src/app/globals.css` sudah mengimpor directive Tailwind (`@tailwind base; @tailwind components; @tailwind utilities;`).
  - Tambahkan font modern (misal: Inter atau Outfit) dari Google Fonts melalui `next/font`.

---

## 2. HTTP Client Helper (`src/lib/api.ts`)

- [ ] **Buat file `src/lib/api.ts`** berisi instance Axios yang sudah terkonfigurasi:
  - `baseURL`: `http://localhost:3000` (URL backend Elysia.js).
  - Default headers: `Content-Type: application/json`.
  - Interceptor request: Otomatis menyisipkan header `Authorization: Bearer <token>` dari storage/cookie jika token tersedia.
  - Interceptor response (opsional): Handle error 401 secara global (redirect ke `/login` jika sesi habis).

---

## 3. Auth Context / Store (`src/context/AuthContext.tsx`)

- [ ] **Buat Auth Context menggunakan React Context API**:
  - State yang dikelola:
    - `user`: Data user yang sedang login (id, name, email, role) atau `null`.
    - `token`: String session token atau `null`.
    - `isAuthenticated`: Boolean, `true` jika user sudah login.
    - `isLoading`: Boolean, `true` saat sedang memvalidasi sesi.
  - Fungsi yang disediakan:
    - `login(email, password)`: Memanggil `POST /api/users/login`, menyimpan token ke localStorage/cookie, meng-set state user.
    - `logout()`: Memanggil `DELETE /api/users/logout`, menghapus token dari storage, reset state user.
    - `checkAuth()`: Memanggil `GET /api/users/current` untuk memvalidasi token yang tersimpan saat aplikasi pertama kali dimuat.
  - Token disimpan di **localStorage** (atau `js-cookie` untuk cookie-based).
  - `AuthProvider` membungkus seluruh aplikasi di `src/app/layout.tsx`.

---

## 4. Halaman Login (`src/app/login/page.tsx`)

- [ ] **Buat halaman `/login`** dengan desain UI kasir modern, responsif, dan clean:
  - Layout: Centered card di tengah layar dengan background gradient atau pattern menarik.
  - Judul/branding: Nama aplikasi "Web Kasir" atau logo.
  - Form input:
    - Field **Email** dengan ikon (lucide-react `Mail` icon) dan placeholder.
    - Field **Password** dengan ikon (lucide-react `Lock` icon), placeholder, dan toggle show/hide password.
  - Tombol **Login** dengan efek hover dan loading state (spinner saat proses login).
  - Tampilkan pesan error jika login gagal (email/password salah).
  - Gunakan warna dan tipografi premium (hindari tampilan generik/polos).

- [ ] **Integrasi dengan API Backend**:
  - Saat form di-submit, panggil `AuthContext.login(email, password)` yang di balik layar memanggil `POST /api/users/login`.
  - Jika berhasil: Simpan token, redirect ke `/dashboard` menggunakan `useRouter().push('/dashboard')`.
  - Jika gagal: Tampilkan pesan error di bawah form tanpa reload halaman.

- [ ] **Validasi Form Client-Side**:
  - Email wajib diisi dan format valid.
  - Password wajib diisi (minimal 1 karakter).
  - Disable tombol login saat field kosong atau sedang loading.

---

## 5. Halaman Dashboard Placeholder (`src/app/dashboard/page.tsx`)

- [ ] **Buat halaman `/dashboard`** sebagai placeholder awal:
  - Tampilkan pesan sambutan: "Selamat datang, {nama user}!" dengan informasi role.
  - Tampilkan tombol **Logout** yang memanggil `AuthContext.logout()` dan redirect ke `/login`.
  - Layout sederhana namun rapi (sidebar placeholder atau top navigation bar).

- [ ] **Auth Guard / Route Protection**:
  - Buat komponen wrapper atau middleware yang mengecek `isAuthenticated` dari `AuthContext`.
  - Jika user belum login (tidak ada token valid), otomatis redirect ke `/login`.
  - Tampilkan loading spinner/skeleton saat sedang memvalidasi sesi (`isLoading = true`).

---

## 6. Konfigurasi CORS & Proxy (Opsional)

- [ ] **Pastikan backend Elysia.js mengizinkan CORS** dari `http://localhost:3000` (frontend Next.js biasanya di port 3000, backend mungkin perlu pindah port atau setup proxy).
  - Opsi A: Ubah port backend Elysia ke `3001` dan set `baseURL` di `api.ts` ke `http://localhost:3001`.
  - Opsi B: Gunakan `next.config.ts` rewrites sebagai proxy ke backend.
  - Pastikan plugin `@elysiajs/cors` di backend sudah aktif dan mengizinkan origin frontend.
