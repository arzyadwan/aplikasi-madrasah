import type { Metadata } from "next";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { hitungStatus } from "@/lib/data-guru";
import { formatTanggal, keDbDate, tanggalLokal, validTanggal } from "@/lib/waktu";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { batalPeriksa, tandaiDiperiksa } from "./aksi";

export const metadata: Metadata = { title: "Jurnal Mengajar" };

export default async function HalamanJurnal({ searchParams }: PageProps<"/kepala/jurnal">) {
  const u = await wajibLogin(["KEPALA", "ADMIN"]);
  const sp = await searchParams;
  const hariIni = tanggalLokal();
  const tanggal = validTanggal(sp.tanggal) ? sp.tanggal : hariIni;
  const kelasId = typeof sp.kelas === "string" ? sp.kelas : "";
  const guruId = typeof sp.guru === "string" ? sp.guru : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const where: Prisma.PertemuanWhereInput = { tanggal: keDbDate(tanggal) };
  if (kelasId) where.kelasId = kelasId;
  if (guruId) where.guruId = guruId;
  if (status === "belum") where.diperiksaPada = null;
  if (status === "sudah") where.diperiksaPada = { not: null };

  const [daftar, kelas, guru] = await Promise.all([
    db.pertemuan.findMany({
      where,
      include: {
        kelas: { select: { nama: true } },
        mapel: { select: { nama: true } },
        guru: { select: { nama: true } },
        jadwal: { select: { guru: { select: { nama: true } } } },
        diperiksaOleh: { select: { nama: true } },
        absensi: { select: { status: true, keterangan: true, siswa: { select: { nama: true } } } },
      },
      orderBy: [{ jamMulai: "asc" }, { kelas: { nama: "asc" } }],
    }),
    db.kelas.findMany({ select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
    db.pengguna.findMany({ where: { peran: { in: ["GURU", "KEPALA"] } }, select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
  ]);
  const kepala = u.peran === "KEPALA";
  const belum = daftar.filter((p) => !p.diperiksaPada);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="judul-halaman">Jurnal mengajar</h1>
          <p className="text-sm text-slate-500">{formatTanggal(tanggal)} · {daftar.length} jurnal, {belum.length} belum diperiksa</p>
        </div>
        <Suspense><PilihTanggal nilai={tanggal} maks={hariIni} /></Suspense>
      </div>

      <form className="kartu grid gap-2 sm:grid-cols-4">
        <input type="hidden" name="tanggal" value={tanggal} />
        <select name="kelas" defaultValue={kelasId} className="masukan">
          <option value="">Semua kelas</option>
          {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        <select name="guru" defaultValue={guruId} className="masukan">
          <option value="">Semua guru</option>
          {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
        </select>
        <select name="status" defaultValue={status} className="masukan">
          <option value="">Semua status</option>
          <option value="belum">Belum diperiksa</option>
          <option value="sudah">Sudah diperiksa</option>
        </select>
        <button className="tombol-garis">Terapkan</button>
      </form>

      {kepala && belum.length > 1 && (
        <form action={tandaiDiperiksa}>
          {belum.map((p) => <input key={p.id} type="hidden" name="id" value={p.id} />)}
          <button className="tombol">Tandai semua ({belum.length}) sudah diperiksa</button>
        </form>
      )}

      {daftar.length === 0 && <p className="kartu text-sm text-slate-500">Tidak ada jurnal untuk filter ini.</p>}
      <ul className="space-y-3">
        {daftar.map((p) => {
          const r = hitungStatus(p.absensi.map((a) => a.status));
          const tidakHadir = p.absensi.filter((a) => a.status !== "H");
          return (
            <li key={p.id} className="kartu">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">Jam ke-{p.jamMulai}–{p.jamSelesai} · Kelas {p.kelas.nama}</p>
                  <p className="font-semibold">{p.mapel.nama}</p>
                  <p className="text-sm text-slate-600">
                    {p.guru.nama}
                    {p.pengganti && p.jadwal ? ` (menggantikan ${p.jadwal.guru.nama})` : ""}
                  </p>
                </div>
                {p.diperiksaPada ? (
                  <span className="lencana bg-utama-100 text-utama-700">Diperiksa {p.diperiksaOleh?.nama ? `oleh ${p.diperiksaOleh.nama}` : ""}</span>
                ) : (
                  <span className="lencana bg-amber-100 text-amber-800">Belum diperiksa</span>
                )}
              </div>
              <dl className="mt-2 space-y-1 text-sm">
                <div><dt className="inline text-slate-500">Materi: </dt><dd className="inline">{p.materi}</dd></div>
                {p.kd && <div><dt className="inline text-slate-500">KD/tujuan: </dt><dd className="inline">{p.kd}</dd></div>}
                {p.catatan && <div><dt className="inline text-slate-500">Catatan: </dt><dd className="inline">{p.catatan}</dd></div>}
                <div><dt className="inline text-slate-500">Kehadiran: </dt><dd className="inline">H {r.H} · S {r.S} · I {r.I} · A {r.A}</dd></div>
                {tidakHadir.length > 0 && (
                  <div className="text-xs text-slate-600">
                    {tidakHadir.map((a) => `${a.siswa.nama} (${a.status}${a.keterangan ? `: ${a.keterangan}` : ""})`).join(", ")}
                  </div>
                )}
              </dl>
              {p.catatanKepala && <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">Catatan kepala: {p.catatanKepala}</p>}
              {kepala && (
                p.diperiksaPada ? (
                  <form action={batalPeriksa} className="mt-2">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-xs text-slate-500 underline">Batalkan tanda diperiksa</button>
                  </form>
                ) : (
                  <form action={tandaiDiperiksa} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="catatan" className="masukan" placeholder="Catatan untuk guru (opsional)" />
                    <button className="tombol shrink-0">Sudah diperiksa</button>
                  </form>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
