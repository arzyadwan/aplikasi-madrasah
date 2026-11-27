import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { semuaJadwalTanggal } from "@/lib/data-guru";
import { akhirBulan, awalBulan, formatTanggal, keDbDate, tanggalLokal, validTanggal } from "@/lib/waktu";
import { PilihTanggal } from "@/components/pilih-tanggal";

export const metadata: Metadata = { title: "Kelas Saya" };

const WARNA: Record<string, string> = {
  H: "text-utama-700", S: "bg-sky-100 text-sky-800", I: "bg-amber-100 text-amber-800", A: "bg-red-100 text-red-700",
};

export default async function HalamanWali({ searchParams }: PageProps<"/wali">) {
  const u = await wajibLogin();
  const sp = await searchParams;
  if (u.kelasWali.length === 0) {
    return <p className="kartu text-sm text-slate-500">Anda belum ditetapkan sebagai wali kelas.</p>;
  }
  const kelas = u.kelasWali.find((k) => k.id === sp.kelas) ?? u.kelasWali[0];
  const hariIni = tanggalLokal();
  const tanggal = validTanggal(sp.tanggal) ? sp.tanggal : hariIni;

  const [jadwal, siswa, absensi] = await Promise.all([
    semuaJadwalTanggal(tanggal, { kelasId: kelas.id }),
    db.siswa.findMany({ where: { kelasId: kelas.id, aktif: true }, select: { id: true, nama: true, nis: true }, orderBy: { nama: "asc" } }),
    db.absensiSiswa.findMany({
      where: { pertemuan: { kelasId: kelas.id, tanggal: keDbDate(tanggal) } },
      select: { siswaId: true, status: true, pertemuan: { select: { jadwalId: true } } },
    }),
  ]);
  const peta = new Map(absensi.map((a) => [`${a.siswaId}|${a.pertemuan.jadwalId}`, a.status]));
  const tautanRekap = `/api/laporan?jenis=siswa&kelas=${kelas.id}&dari=${awalBulan(tanggal)}&sampai=${akhirBulan(tanggal)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="judul-halaman">Kelas {kelas.nama}</h1>
          <p className="text-sm text-slate-500">{formatTanggal(tanggal)} · {siswa.length} siswa</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {u.kelasWali.length > 1 && (
            <div className="flex gap-1">
              {u.kelasWali.map((k) => (
                <Link key={k.id} href={`/wali?kelas=${k.id}&tanggal=${tanggal}`}
                  className={k.id === kelas.id ? "tombol px-3 py-2" : "tombol-garis px-3 py-2"}>{k.nama}</Link>
              ))}
            </div>
          )}
          <Suspense><PilihTanggal nilai={tanggal} maks={hariIni} /></Suspense>
        </div>
      </div>

      <section className="kartu overflow-x-auto p-0">
        <h2 className="px-4 pt-4 pb-2 font-semibold">Jadwal dan jurnal</h2>
        <table className="tabel">
          <thead><tr><th>Jam</th><th>Mapel</th><th>Guru</th><th>Status</th></tr></thead>
          <tbody>
            {jadwal.map((j) => (
              <tr key={j.id}>
                <td className="whitespace-nowrap">{j.jamMulai}–{j.jamSelesai}<span className="block text-xs text-slate-500">{j.waktu}</span></td>
                <td>{j.mapel.nama}</td>
                <td>{j.guru.nama}</td>
                <td>
                  {j.pertemuan ? (
                    <span className="text-xs">
                      Diisi {j.pertemuan.namaGuru}{j.pertemuan.pengganti ? " (pengganti)" : ""}<br />
                      H {j.pertemuan.rekap.H} · S {j.pertemuan.rekap.S} · I {j.pertemuan.rekap.I} · A {j.pertemuan.rekap.A}
                    </span>
                  ) : tanggal === hariIni ? (
                    <Link href={`/guru/isi?jadwal=${j.id}`} className="text-sm font-semibold text-utama-700">Belum diisi · isi sebagai wali kelas</Link>
                  ) : <span className="lencana bg-red-100 text-red-700">Tidak diisi</span>}
                </td>
              </tr>
            ))}
            {jadwal.length === 0 && <tr><td colSpan={4} className="text-slate-500">Tidak ada jadwal.</td></tr>}
          </tbody>
        </table>
      </section>

      {jadwal.length > 0 && (
        <section className="kartu overflow-x-auto p-0">
          <h2 className="px-4 pt-4 pb-2 font-semibold">Kehadiran per jam pelajaran</h2>
          <table className="tabel">
            <thead>
              <tr>
                <th>Siswa</th>
                {jadwal.map((j) => <th key={j.id} className="text-center" title={j.mapel.nama}>Jam {j.jamMulai}</th>)}
              </tr>
            </thead>
            <tbody>
              {siswa.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap">{s.nama}</td>
                  {jadwal.map((j) => {
                    const st = peta.get(`${s.id}|${j.id}`);
                    return <td key={j.id} className="text-center"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${st ? WARNA[st] : "text-slate-300"}`}>{st ?? "·"}</span></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="kartu flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Rekap bulanan kelas {kelas.nama}</p>
          <p className="text-sm text-slate-500">File Excel: jumlah hadir, sakit, izin, dan alpa setiap siswa.</p>
        </div>
        <a href={tautanRekap} className="tombol-garis">Unduh Excel</a>
      </div>
    </div>
  );
}
