"use client";

import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import {
  Store,
  LogOut,
  User,
  Shield,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Package,
  Layers,
  ArrowUpRight,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Navigation */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Store className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Web Kasir POS
                </h1>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Tahap 1 • Setup & Auth Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-200">
                    {user?.name || "Kasir"}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-teal-400" />
                    {user?.role || "kasir"}
                  </p>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sesi Aktif Terautentikasi</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                  Selamat Datang, {user?.name || "Kasir"}! 👋
                </h2>
                <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
                  Anda login sebagai{" "}
                  <span className="text-emerald-400 font-semibold uppercase tracking-wider">
                    {user?.role}
                  </span>{" "}
                  dengan email <span className="text-slate-300">{user?.email}</span>. Siap melayani transaksi kasir hari ini.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="block text-[11px] text-slate-400 uppercase font-semibold">
                    Status Server
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online (Port 3000)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Placeholder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  Total Transaksi
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100 mt-2">Rp 0</p>
              <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Hari ini
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  Item Terjual
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100 mt-2">0 pcs</p>
              <span className="text-[11px] text-slate-500 mt-1">Stok terhubung</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  Produk Terdaftar
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100 mt-2">Siap</p>
              <span className="text-[11px] text-slate-500 mt-1">Katalog backend</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  Kasir Aktif
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100 mt-2">1 Shift</p>
              <span className="text-[11px] text-slate-500 mt-1">Sesi berjalan</span>
            </div>
          </div>

          {/* Next Steps / Features Preview */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span>Roadmap Modul Kasir Selanjutnya</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <p className="text-xs font-semibold text-emerald-400 mb-1">
                  1. POS / Kasir Checkout
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Keranjang belanja interaktif, barcode scanner, hitung kembalian, dan cetak invoice.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <p className="text-xs font-semibold text-teal-400 mb-1">
                  2. Manajemen Produk
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tambah, edit, hapus produk, filter kategori, dan pantau stok minimum secara realtime.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <p className="text-xs font-semibold text-cyan-400 mb-1">
                  3. Laporan & Riwayat
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rekapitulasi penjualan harian/bulanan, export data, dan audit transaksi kasir.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
