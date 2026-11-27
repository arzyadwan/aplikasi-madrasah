import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { wajibLogin } from "@/lib/auth";
import { pantauanHarian } from "@/lib/data-pantauan";
import { formatTanggal, tanggalLokal, validTanggal } from "@/lib/waktu";
import { PilihTanggal } from "@/components/pilih-tanggal";

export const metadata: Metadata = { title: "Pantauan" };

function Angka({ judul, nilai, sub, warna = "text-slate-900" }: { judul: string; nilai: string; sub?: string; warna?: string }) {
  return (
    <div className="kartu">
      <p className="text-sm text-slate-500">{judul}</p>
      <p className={`text-2xl font-bold ${warna}`}>{nilai}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default async function HalamanPantauan({ searchParams }: PageProps<"/kepala">) {
  await wajibLogin(["KEPALA", "ADMIN"]);
  const sp = await searchParams;
  const hariIni = tanggalLokal();
  const tanggal = validTanggal(sp.tanggal) ? sp.tanggal : hariIni;
  const p = await pantauanHarian(tanggal);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="judul-halaman">Pantauan harian</h1>
          <p className="text-sm text-slate-500">{formatTanggal(tanggal)}</p>
        </div>
        <Suspense><PilihTanggal nilai={tanggal} maks={hariIni} /></Suspense>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Angka judul="Guru sudah absen" nilai={`${p.guru.sudahAbsen}/${p.guru.total}`}
          sub={`${p.guru.hadir} hadir${p.guru.luarRadius ? ` · ${p.guru.luarRadius} di luar area` : ""}`} />
        <Angka judul="Jurnal terisi" nilai={`${p.jadwal.terisi}/${p.jadwal.total}`}
          sub={p.jadwal.total ? `${Math.round((p.jadwal.terisi / p.jadwal.total) * 100)}% jadwal` : "tidak ada jadwal"} />
        <Angka judul="Kehadiran siswa" nilai={p.siswa.persenHadir == null ? "–" : `${p.siswa.persenHadir}%`} sub="dari jam pelajaran yang sudah diabsen" />
        <Angka judul="Jurnal belum diperiksa" nilai={String(p.jadwal.belumDiperiksa)} warna={p.jadwal.belumDiperiksa ? "text-amber-600" : "text-slate-900"}
          sub="hari ini" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="kartu">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Guru belum absen ({p.belumAbsen.length})</h2>
            <Link href={`/kepala/guru?tanggal=${tanggal}`} className="text-sm font-semibold text-utama-700">Detail</Link>
          </div>
          {p.belumAbsen.length === 0 ? (
            <p className="text-sm text-slate-500">Semua guru sudah absen.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {p.belumAbsen.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-1.5">
                  <span>{g.nama}</span>
                  {g.berjadwal && <span className="lencana bg-amber-100 text-amber-800">ada jadwal</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="kartu">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Jurnal belum diisi ({p.belumJurnal.length})</h2>
            <Link href={`/kepala/jurnal?tanggal=${tanggal}`} className="text-sm font-semibold text-utama-700">Lihat jurnal</Link>
          </div>
          {p.belumJurnal.length === 0 ? (
            <p className="text-sm text-slate-500">Semua jadwal sudah diisi.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {p.belumJurnal.map((j) => (
                <li key={j.id} className="flex items-start justify-between gap-2 py-1.5">
                  <span>
                    <span className="font-medium">{j.guru.nama}</span>
                    <span className="block text-xs text-slate-500">{j.kelas.nama} · {j.mapel.nama} · jam {j.jamMulai}–{j.jamSelesai}</span>
                  </span>
                  {j.lewat ? <span className="lencana shrink-0 bg-red-100 text-red-700">terlambat</span>
                    : <span className="lencana shrink-0 bg-slate-100 text-slate-600">belum waktunya</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="kartu overflow-x-auto p-0">
        <h2 className="px-4 pt-4 font-semibold">Kehadiran siswa per kelas</h2>
        <p className="px-4 pb-2 text-xs text-slate-500">Dihitung per jam pelajaran yang sudah diabsen</p>
        <table className="tabel">
          <thead><tr><th>Kelas</th><th>Jurnal</th><th>H</th><th>S</th><th>I</th><th>A</th><th>Tidak hadir</th></tr></thead>
          <tbody>
            {p.perKelas.map((k) => (
              <tr key={k.id}>
                <td className="font-medium">{k.nama}<span className="block text-xs text-slate-500">{k.jumlahSiswa} siswa</span></td>
                <td>{k.terisi}/{k.jadwal}</td>
                <td>{k.rekap.H}</td><td>{k.rekap.S}</td><td>{k.rekap.I}</td>
                <td className={k.rekap.A ? "font-semibold text-red-700" : ""}>{k.rekap.A}</td>
                <td className="text-xs">{k.tidakHadir.map((s) => `${s.nama}: ${s.status.join(", ")}`).join("; ") || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
