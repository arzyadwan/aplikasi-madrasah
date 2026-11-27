import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Beranda Operator" };

export default async function BerandaAdmin() {
  await wajibLogin(["ADMIN"]);
  const [guru, siswa, kelas, mapel, jadwal, jam, pengaturan, kelasTanpaWali] = await Promise.all([
    db.pengguna.count({ where: { aktif: true, peran: { in: ["GURU", "KEPALA"] } } }),
    db.siswa.count({ where: { aktif: true } }),
    db.kelas.count(),
    db.mapel.count(),
    db.jadwal.count(),
    db.jamPelajaran.count(),
    db.pengaturan.findUnique({ where: { id: 1 } }),
    db.kelas.count({ where: { waliKelasId: null } }),
  ]);

  const tugas = [
    { selesai: pengaturan?.lat != null, teks: "Atur titik lokasi madrasah untuk absen GPS guru", href: "/admin/pengaturan" },
    { selesai: jam > 0, teks: "Atur jam pelajaran", href: "/admin/pengaturan" },
    { selesai: guru > 1, teks: "Tambahkan akun guru", href: "/admin/pengguna" },
    { selesai: kelasTanpaWali === 0 && kelas > 0, teks: "Tetapkan wali kelas untuk setiap kelas", href: "/admin/kelas" },
    { selesai: siswa > 0, teks: "Masukkan data siswa", href: "/admin/siswa" },
    { selesai: jadwal > 0, teks: "Isi jadwal pelajaran", href: "/admin/jadwal" },
  ];

  const menu = [
    { href: "/admin/pengguna", judul: "Guru & pengguna", isi: `${guru} guru aktif`, ket: "Akun login, peran, reset kata sandi" },
    { href: "/admin/siswa", judul: "Siswa", isi: `${siswa} siswa aktif`, ket: "Tambah, impor dari Excel, pindah kelas" },
    { href: "/admin/kelas", judul: "Kelas", isi: `${kelas} kelas`, ket: "Nama kelas dan wali kelas" },
    { href: "/admin/mapel", judul: "Mata pelajaran", isi: `${mapel} mapel`, ket: "Daftar mata pelajaran" },
    { href: "/admin/jadwal", judul: "Jadwal pelajaran", isi: `${jadwal} jadwal`, ket: "Jadwal per kelas, Senin–Sabtu" },
    { href: "/admin/pengaturan", judul: "Pengaturan", isi: pengaturan?.namaMadrasah ?? "-", ket: "Identitas, lokasi GPS, jam pelajaran" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="judul-halaman">Beranda operator</h1>
      {tugas.some((t) => !t.selesai) && (
        <section className="kartu border-amber-300 bg-amber-50">
          <h2 className="mb-2 font-semibold">Persiapan aplikasi</h2>
          <ul className="space-y-1 text-sm">
            {tugas.map((t) => (
              <li key={t.teks} className="flex items-center gap-2">
                <span className={t.selesai ? "text-utama-600" : "text-amber-600"}>{t.selesai ? "✓" : "○"}</span>
                {t.selesai ? <span className="text-slate-500 line-through">{t.teks}</span> : <Link href={t.href} className="underline">{t.teks}</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className="kartu transition hover:border-utama-500">
            <p className="font-semibold text-slate-900">{m.judul}</p>
            <p className="text-sm text-utama-700">{m.isi}</p>
            <p className="text-xs text-slate-500">{m.ket}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
