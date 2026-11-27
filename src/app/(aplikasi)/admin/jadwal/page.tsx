import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { NAMA_HARI } from "@/lib/waktu";
import { FormAksi } from "@/components/form-aksi";
import { hapusJadwal, tambahJadwal } from "./aksi";

export const metadata: Metadata = { title: "Jadwal Pelajaran" };

export default async function HalamanJadwal({ searchParams }: PageProps<"/admin/jadwal">) {
  await wajibLogin(["ADMIN"]);
  const sp = await searchParams;
  const [kelas, mapel, guru, jam] = await Promise.all([
    db.kelas.findMany({ select: { id: true, nama: true }, orderBy: [{ tingkat: "asc" }, { nama: "asc" }] }),
    db.mapel.findMany({ select: { id: true, nama: true }, orderBy: [{ urutan: "asc" }, { nama: "asc" }] }),
    db.pengguna.findMany({ where: { aktif: true, peran: { in: ["GURU", "KEPALA"] } }, select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
    db.jamPelajaran.findMany({ orderBy: { jamKe: "asc" } }),
  ]);
  const terpilih = kelas.find((k) => k.id === sp.kelas) ?? kelas[0];
  const jadwal = terpilih
    ? await db.jadwal.findMany({
        where: { kelasId: terpilih.id },
        include: { mapel: { select: { nama: true } }, guru: { select: { nama: true } } },
        orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
      })
    : [];
  const hari = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-utama-700">← Beranda</Link>
        <h1 className="judul-halaman mt-1">Jadwal pelajaran</h1>
        <p className="text-sm text-slate-500">Jadwal tetap per kelas. Guru melihat jadwalnya sendiri setiap hari.</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {kelas.map((k) => (
          <Link key={k.id} href={`/admin/jadwal?kelas=${k.id}`} className={k.id === terpilih?.id ? "tombol px-3 py-1.5" : "tombol-garis px-3 py-1.5"}>{k.nama}</Link>
        ))}
      </div>

      {terpilih && (
        <>
          <section className="kartu">
            <h2 className="mb-3 font-semibold">Tambah jadwal kelas {terpilih.nama}</h2>
            {jam.length === 0 && <p className="mb-2 text-sm text-amber-700">Atur jam pelajaran dulu di menu Pengaturan.</p>}
            <FormAksi aksi={tambahJadwal} tombol="Tambah" className="grid gap-3 sm:grid-cols-6">
              <input type="hidden" name="kelasId" value={terpilih.id} />
              <label className="text-sm">Hari
                <select name="hari" className="masukan">{hari.map((h) => <option key={h} value={h}>{NAMA_HARI[h]}</option>)}</select>
              </label>
              <label className="text-sm">Jam mulai
                <select name="jamMulai" className="masukan">{jam.map((j) => <option key={j.jamKe} value={j.jamKe}>{j.jamKe} ({j.mulai})</option>)}</select>
              </label>
              <label className="text-sm">Jam selesai
                <select name="jamSelesai" className="masukan" defaultValue={jam[1]?.jamKe}>{jam.map((j) => <option key={j.jamKe} value={j.jamKe}>{j.jamKe} ({j.selesai})</option>)}</select>
              </label>
              <label className="text-sm sm:col-span-1">Mapel
                <select name="mapelId" className="masukan">{mapel.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}</select>
              </label>
              <label className="text-sm sm:col-span-2">Guru
                <select name="guruId" className="masukan">{guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}</select>
              </label>
              <div className="sm:col-span-6" />
            </FormAksi>
          </section>

          <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {hari.map((h) => {
              const isi = jadwal.filter((j) => j.hari === h);
              return (
                <div key={h} className="kartu p-0">
                  <h3 className="border-b border-slate-100 px-4 py-2 font-semibold">{NAMA_HARI[h]}</h3>
                  {isi.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Kosong</p>}
                  <ul className="divide-y divide-slate-100">
                    {isi.map((j) => (
                      <li key={j.id} className="flex items-start justify-between gap-2 px-4 py-2 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">
                            Jam {j.jamMulai}–{j.jamSelesai} · {jam.find((x) => x.jamKe === j.jamMulai)?.mulai}–{jam.find((x) => x.jamKe === j.jamSelesai)?.selesai}
                          </p>
                          <p className="font-medium">{j.mapel.nama}</p>
                          <p className="text-slate-600">{j.guru.nama}</p>
                        </div>
                        <FormAksi aksi={hapusJadwal} tombol="Hapus" gayaTombol="text-xs text-red-700 underline"
                          konfirmasi={`Hapus ${j.mapel.nama} ${NAMA_HARI[h]} jam ${j.jamMulai}–${j.jamSelesai}?`} className="flex flex-col items-end gap-1">
                          <input type="hidden" name="id" value={j.id} />
                        </FormAksi>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
