import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { hitungStatus, semuaJadwalTanggal } from "./data-guru";
import { dariDbDate, keDbDate, nomorHari, tambahHari } from "./waktu";

/** Riwayat jurnal seorang guru (30 hari) */
export async function riwayatGuru(guruId: string, hariIni: string) {
  const daftar = await db.pertemuan.findMany({
    where: { guruId, tanggal: { gte: keDbDate(tambahHari(hariIni, -30)) } },
    include: {
      kelas: { select: { nama: true } }, mapel: { select: { nama: true } },
      absensi: { select: { status: true } }, diperiksaOleh: { select: { nama: true } },
    },
    orderBy: [{ tanggal: "desc" }, { jamMulai: "asc" }],
  });
  return daftar.map((p) => ({
    id: p.id, tanggal: dariDbDate(p.tanggal), jamMulai: p.jamMulai, jamSelesai: p.jamSelesai,
    jadwalId: p.jadwalId, kelas: p.kelas.nama, mapel: p.mapel.nama, pengganti: p.pengganti,
    materi: p.materi, kd: p.kd, catatan: p.catatan, rekap: hitungStatus(p.absensi.map((a) => a.status)),
    diperiksa: !!p.diperiksaPada, diperiksaOleh: p.diperiksaOleh?.nama ?? null, catatanKepala: p.catatanKepala,
  }));
}

/** Data kelas untuk wali kelas: jadwal hari itu dan status per siswa per jadwal */
export async function dataWali(kelasId: string, tanggal: string) {
  const [jadwal, siswa, absensi] = await Promise.all([
    semuaJadwalTanggal(tanggal, { kelasId }),
    db.siswa.findMany({ where: { kelasId, aktif: true }, select: { id: true, nama: true, nis: true }, orderBy: { nama: "asc" } }),
    db.absensiSiswa.findMany({
      where: { pertemuan: { kelasId, tanggal: keDbDate(tanggal) } },
      select: { siswaId: true, status: true, pertemuan: { select: { jadwalId: true } } },
    }),
  ]);
  const status: Record<string, Record<string, string>> = {};
  for (const a of absensi) {
    if (!a.pertemuan.jadwalId) continue;
    (status[a.siswaId] ??= {})[a.pertemuan.jadwalId] = a.status;
  }
  return { jadwal, siswa, status };
}

/** Daftar jurnal pada satu tanggal (kepala madrasah) */
export async function daftarJurnal(tanggal: string, filter: Prisma.PertemuanWhereInput = {}) {
  const daftar = await db.pertemuan.findMany({
    where: { tanggal: keDbDate(tanggal), ...filter },
    include: {
      kelas: { select: { nama: true } }, mapel: { select: { nama: true } }, guru: { select: { nama: true } },
      jadwal: { select: { guru: { select: { nama: true } } } }, diperiksaOleh: { select: { nama: true } },
      absensi: { select: { status: true, keterangan: true, siswa: { select: { nama: true } } } },
    },
    orderBy: [{ jamMulai: "asc" }, { kelas: { nama: "asc" } }],
  });
  return daftar.map((p) => ({
    id: p.id, jamMulai: p.jamMulai, jamSelesai: p.jamSelesai, kelas: p.kelas.nama, mapel: p.mapel.nama,
    guru: p.guru.nama, menggantikan: p.pengganti ? p.jadwal?.guru.nama ?? null : null,
    materi: p.materi, kd: p.kd, catatan: p.catatan, rekap: hitungStatus(p.absensi.map((a) => a.status)),
    tidakHadir: p.absensi.filter((a) => a.status !== "H").map((a) => ({ nama: a.siswa.nama, status: a.status, keterangan: a.keterangan })),
    diperiksa: !!p.diperiksaPada, diperiksaOleh: p.diperiksaOleh?.nama ?? null, catatanKepala: p.catatanKepala,
  }));
}

/** Kehadiran semua guru pada satu tanggal */
export async function kehadiranGuru(tanggal: string) {
  const [pengguna, absen, jadwal, pertemuan] = await Promise.all([
    db.pengguna.findMany({ where: { aktif: true }, select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
    db.absensiGuru.findMany({ where: { tanggal: keDbDate(tanggal) } }),
    db.jadwal.groupBy({ by: ["guruId"], where: { hari: nomorHari(tanggal) }, _count: true }),
    db.pertemuan.groupBy({ by: ["guruId"], where: { tanggal: keDbDate(tanggal) }, _count: true }),
  ]);
  const pa = new Map(absen.map((a) => [a.penggunaId, a]));
  const pj = new Map(jadwal.map((j) => [j.guruId, j._count]));
  const pp = new Map(pertemuan.map((p) => [p.guruId, p._count]));
  return pengguna.map((g) => {
    const a = pa.get(g.id);
    return {
      id: g.id, nama: g.nama,
      absen: a ? {
        id: a.id, status: a.status, waktuMasuk: a.waktuMasuk.toISOString(), jarakMeter: a.jarakMeter,
        dalamRadius: a.dalamRadius, keterangan: a.keterangan, adaFoto: !!a.fotoPath, lat: a.lat, lng: a.lng,
      } : null,
      jadwal: pj.get(g.id) ?? 0, jurnal: pp.get(g.id) ?? 0,
    };
  });
}
