import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { semuaJadwalTanggal } from "@/lib/data-guru";
import { formatTanggal, tanggalLokal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Guru Pengganti" };

export default async function HalamanPengganti() {
  const u = await wajibLogin(["GURU", "KEPALA"]);
  const tanggal = tanggalLokal();
  const jadwal = (await semuaJadwalTanggal(tanggal)).filter((j) => j.guru.id !== u.id);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/guru" className="text-sm text-utama-700">← Kembali</Link>
        <h1 className="judul-halaman mt-1">Guru pengganti</h1>
        <p className="text-sm text-slate-500">{formatTanggal(tanggal)} · pilih jadwal yang Anda gantikan</p>
      </div>
      {jadwal.length === 0 && <p className="kartu text-sm text-slate-500">Tidak ada jadwal lain hari ini.</p>}
      <div className="kartu overflow-x-auto p-0">
        <table className="tabel">
          <thead>
            <tr><th>Jam</th><th>Kelas</th><th>Mapel</th><th>Guru</th><th></th></tr>
          </thead>
          <tbody>
            {jadwal.map((j) => (
              <tr key={j.id}>
                <td className="whitespace-nowrap">{j.jamMulai}–{j.jamSelesai}<br /><span className="text-xs text-slate-500">{j.waktu}</span></td>
                <td>{j.kelas.nama}</td>
                <td>{j.mapel.nama}</td>
                <td>{j.guru.nama}</td>
                <td className="text-right">
                  {j.pertemuan ? (
                    <span className="lencana bg-utama-100 text-utama-700">Diisi {j.pertemuan.namaGuru}</span>
                  ) : (
                    <Link href={`/guru/isi?jadwal=${j.id}`} className="tombol-garis whitespace-nowrap px-3 py-1.5">Gantikan</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
