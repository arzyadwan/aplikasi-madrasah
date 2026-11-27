import { wajibLogin, pimpinanAtauTU } from "@/lib/auth";
import { db } from "@/lib/db";
import { NavAplikasi, type ItemNav } from "@/components/nav-aplikasi";
import { StatusSinkron } from "@/components/status-sinkron";
import { TombolKeluar } from "@/components/tombol-keluar";
import { keluar } from "../login/aksi";

const NAMA_PERAN = { ADMIN: "Operator / TU", KEPALA: "Kepala Madrasah", GURU: "Guru" } as const;

export default async function LayoutAplikasi({ children }: LayoutProps<"/">) {
  const u = await wajibLogin();
  const pengaturan = await db.pengaturan.findUnique({ where: { id: 1 }, select: { namaMadrasah: true } });

  const item: ItemNav[] = [];
  if (u.peran === "KEPALA") item.push({ href: "/kepala", label: "Pantauan" });
  if (u.peran === "ADMIN") item.push({ href: "/admin", label: "Beranda" });
  if (u.peran === "GURU" || u.mengajar) item.push({ href: "/guru", label: "Hari Ini" });
  item.push({ href: "/guru/absen", label: "Absen Saya" });
  if (u.peran === "GURU" || u.mengajar) item.push({ href: "/guru/riwayat", label: "Riwayat" });
  if (u.kelasWali.length > 0) item.push({ href: "/wali", label: "Kelas Saya" });
  if (pimpinanAtauTU(u)) {
    if (u.peran === "ADMIN") item.push({ href: "/kepala", label: "Pantauan" });
    item.push({ href: "/kepala/jurnal", label: "Jurnal" });
    item.push({ href: "/kepala/guru", label: "Kehadiran Guru" });
    item.push({ href: "/laporan", label: "Laporan" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-utama-700 text-white shadow">
        <div className="mx-auto max-w-6xl px-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{pengaturan?.namaMadrasah ?? "Aplikasi Madrasah"}</p>
              <p className="truncate text-xs text-utama-100">
                {u.nama} · {NAMA_PERAN[u.peran]}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusSinkron />
              <a href="/akun" className="rounded-lg px-2 py-1 text-xs text-utama-100 hover:bg-white/10">Akun</a>
              <TombolKeluar aksi={keluar} />
            </div>
          </div>
          <div className="pt-2 pb-2">
            <NavAplikasi item={item} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
