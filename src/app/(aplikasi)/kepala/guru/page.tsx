import type { Metadata } from "next";
import { Suspense } from "react";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTanggal, keDbDate, nomorHari, tanggalLokal, validTanggal, ZONA } from "@/lib/waktu";
import { LABEL_STATUS_GURU } from "@/lib/tipe";
import { PilihTanggal } from "@/components/pilih-tanggal";

export const metadata: Metadata = { title: "Kehadiran Guru" };

export default async function HalamanKehadiranGuru({ searchParams }: PageProps<"/kepala/guru">) {
  await wajibLogin(["KEPALA", "ADMIN"]);
  const sp = await searchParams;
  const hariIni = tanggalLokal();
  const tanggal = validTanggal(sp.tanggal) ? sp.tanggal : hariIni;

  const [pengguna, absen, jadwal, pertemuan] = await Promise.all([
    db.pengguna.findMany({ where: { aktif: true }, select: { id: true, nama: true, peran: true }, orderBy: { nama: "asc" } }),
    db.absensiGuru.findMany({ where: { tanggal: keDbDate(tanggal) } }),
    db.jadwal.groupBy({ by: ["guruId"], where: { hari: nomorHari(tanggal) }, _count: true }),
    db.pertemuan.groupBy({ by: ["guruId"], where: { tanggal: keDbDate(tanggal) }, _count: true }),
  ]);
  const petaAbsen = new Map(absen.map((a) => [a.penggunaId, a]));
  const petaJadwal = new Map(jadwal.map((j) => [j.guruId, j._count]));
  const petaJurnal = new Map(pertemuan.map((p) => [p.guruId, p._count]));
  const jam = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit" }).format(d);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="judul-halaman">Kehadiran guru</h1>
          <p className="text-sm text-slate-500">{formatTanggal(tanggal)} · {absen.length} dari {pengguna.length} sudah absen</p>
        </div>
        <Suspense><PilihTanggal nilai={tanggal} maks={hariIni} /></Suspense>
      </div>
      <div className="kartu overflow-x-auto p-0">
        <table className="tabel">
          <thead>
            <tr><th>Nama</th><th>Status</th><th>Jam</th><th>Lokasi</th><th>Jurnal</th><th>Foto</th></tr>
          </thead>
          <tbody>
            {pengguna.map((g) => {
              const a = petaAbsen.get(g.id);
              const j = petaJadwal.get(g.id) ?? 0;
              return (
                <tr key={g.id}>
                  <td className="font-medium">{g.nama}</td>
                  <td>
                    {a ? (
                      <span className={`lencana ${a.status === "HADIR" ? "bg-utama-100 text-utama-700" : "bg-sky-100 text-sky-800"}`}>
                        {LABEL_STATUS_GURU[a.status]}
                      </span>
                    ) : <span className="lencana bg-red-100 text-red-700">Belum absen</span>}
                    {a?.keterangan && <span className="block text-xs text-slate-500">{a.keterangan}</span>}
                  </td>
                  <td className="whitespace-nowrap">{a ? jam(a.waktuMasuk) : "–"}{a?.diisiDiPerangkat && a.dibuatPada.getTime() - a.diisiDiPerangkat.getTime() > 10 * 60000 ? <span className="block text-xs text-slate-500">dikirim {jam(a.dibuatPada)} (offline)</span> : null}</td>
                  <td className="whitespace-nowrap text-xs">
                    {a?.jarakMeter != null ? (
                      <span className={a.dalamRadius === false ? "font-semibold text-red-700" : ""}>
                        ±{a.jarakMeter} m{a.dalamRadius === false ? " (luar area)" : ""}
                      </span>
                    ) : a?.lat != null ? "tercatat" : "–"}
                    {a?.lat != null && (
                      <a className="block text-utama-700 underline" target="_blank" rel="noreferrer"
                        href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}>peta</a>
                    )}
                  </td>
                  <td>{j ? `${petaJurnal.get(g.id) ?? 0}/${j}` : "–"}</td>
                  <td>
                    {a?.fotoPath ? (
                      <a href={`/api/foto/${a.id}`} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/foto/${a.id}`} alt={`Foto ${g.nama}`} className="h-12 w-12 rounded object-cover" loading="lazy" />
                      </a>
                    ) : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Kolom Jurnal: jumlah jurnal diisi dibanding jadwal mengajar pada hari itu.</p>
    </div>
  );
}
