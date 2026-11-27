import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormAksi } from "@/components/form-aksi";
import { simpanJam, simpanPengaturan } from "./aksi";
import { TombolLokasi } from "./tombol-lokasi";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function HalamanPengaturan() {
  await wajibLogin(["ADMIN"]);
  const [p, jam] = await Promise.all([
    db.pengaturan.findUnique({ where: { id: 1 } }),
    db.jamPelajaran.findMany({ orderBy: { jamKe: "asc" } }),
  ]);
  const baris = [...jam, ...Array.from({ length: 2 }, (_, i) => ({ jamKe: jam.length + i + 1, mulai: "", selesai: "" }))];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-utama-700">← Beranda</Link>
        <h1 className="judul-halaman mt-1">Pengaturan</h1>
      </div>

      <section className="kartu">
        <h2 className="mb-3 font-semibold">Identitas dan absen guru</h2>
        <FormAksi aksi={simpanPengaturan} className="space-y-3">
          <label className="block text-sm">Nama madrasah *<input name="namaMadrasah" className="masukan" defaultValue={p?.namaMadrasah} required /></label>
          <label className="block text-sm">Alamat<input name="alamat" className="masukan" defaultValue={p?.alamat ?? ""} /></label>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-medium">Titik lokasi madrasah</p>
            <p className="mb-2 text-xs text-slate-600">Dipakai untuk mengukur jarak saat guru absen. Cara termudah: buka halaman ini dari HP saat berada di halaman madrasah, lalu klik tombol di bawah.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">Lintang (latitude)<input name="lat" className="masukan" inputMode="decimal" defaultValue={p?.lat ?? ""} placeholder="-4.0..." /></label>
              <label className="text-sm">Bujur (longitude)<input name="lng" className="masukan" inputMode="decimal" defaultValue={p?.lng ?? ""} placeholder="122.0..." /></label>
            </div>
            <div className="mt-2"><TombolLokasi /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Radius area madrasah (meter)<input name="radiusMeter" type="number" min={20} max={5000} className="masukan" defaultValue={p?.radiusMeter ?? 150} /></label>
            <label className="text-sm">Batas kirim data offline (jam)<input name="batasSinkronJam" type="number" min={1} max={240} className="masukan" defaultValue={p?.batasSinkronJam ?? 72} /></label>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="tolakLuarRadius" defaultChecked={p?.tolakLuarRadius} className="mt-1" />
            <span>Tolak absen hadir bila guru berada di luar radius. Jika tidak dicentang, absen tetap diterima tetapi ditandai &quot;di luar area&quot; untuk kepala madrasah.</span>
          </label>
        </FormAksi>
      </section>

      <section className="kartu">
        <h2 className="font-semibold">Jam pelajaran</h2>
        <p className="mb-3 text-sm text-slate-600">Kosongkan baris terakhir untuk mengurangi jumlah jam. Dua baris kosong disediakan untuk menambah jam.</p>
        <FormAksi aksi={simpanJam} className="space-y-2">
          <div className="grid grid-cols-[4rem_1fr_1fr] gap-2 text-sm font-medium text-slate-600"><span>Jam ke</span><span>Mulai</span><span>Selesai</span></div>
          {baris.map((j) => (
            <div key={j.jamKe} className="grid grid-cols-[4rem_1fr_1fr] items-center gap-2">
              <span className="text-sm">{j.jamKe}</span>
              <input name="mulai" type="time" className="masukan" defaultValue={j.mulai} aria-label={`Mulai jam ke-${j.jamKe}`} />
              <input name="selesai" type="time" className="masukan" defaultValue={j.selesai} aria-label={`Selesai jam ke-${j.jamKe}`} />
            </div>
          ))}
        </FormAksi>
      </section>
    </div>
  );
}
