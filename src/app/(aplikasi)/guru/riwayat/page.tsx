import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { hitungStatus } from "@/lib/data-guru";
import { dariDbDate, formatTanggal, keDbDate, tambahHari, tanggalLokal } from "@/lib/waktu";

export const metadata: Metadata = { title: "Riwayat" };

export default async function HalamanRiwayat() {
  const u = await wajibLogin();
  const hariIni = tanggalLokal();
  const daftar = await db.pertemuan.findMany({
    where: { guruId: u.id, tanggal: { gte: keDbDate(tambahHari(hariIni, -30)) } },
    include: {
      kelas: { select: { nama: true } },
      mapel: { select: { nama: true } },
      absensi: { select: { status: true } },
      diperiksaOleh: { select: { nama: true } },
    },
    orderBy: [{ tanggal: "desc" }, { jamMulai: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="judul-halaman">Riwayat jurnal</h1>
        <p className="text-sm text-slate-500">30 hari terakhir · {daftar.length} pertemuan</p>
      </div>
      {daftar.length === 0 && <p className="kartu text-sm text-slate-500">Belum ada jurnal.</p>}
      <ul className="space-y-2">
        {daftar.map((p) => {
          const r = hitungStatus(p.absensi.map((a) => a.status));
          const tgl = dariDbDate(p.tanggal);
          return (
            <li key={p.id} className="kartu">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">{formatTanggal(tgl)} · jam ke-{p.jamMulai}–{p.jamSelesai}</p>
                  <p className="font-semibold">{p.mapel.nama} · {p.kelas.nama}{p.pengganti ? " (pengganti)" : ""}</p>
                </div>
                {p.diperiksaPada ? (
                  <span className="lencana bg-utama-100 text-utama-700">Diperiksa</span>
                ) : (
                  <span className="lencana bg-slate-100 text-slate-600">Belum diperiksa</span>
                )}
              </div>
              <p className="mt-1 text-sm">{p.materi}</p>
              {p.kd && <p className="text-xs text-slate-500">KD: {p.kd}</p>}
              <p className="mt-1 text-xs text-slate-500">H {r.H} · S {r.S} · I {r.I} · A {r.A}</p>
              {p.catatanKepala && (
                <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
                  Catatan {p.diperiksaOleh?.nama ?? "kepala madrasah"}: {p.catatanKepala}
                </p>
              )}
              {tgl === hariIni && !p.diperiksaPada && p.jadwalId && (
                <Link href={`/guru/isi?jadwal=${p.jadwalId}`} className="mt-2 inline-block text-sm font-semibold text-utama-700">Ubah</Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
