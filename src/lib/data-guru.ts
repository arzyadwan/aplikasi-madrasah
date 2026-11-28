import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { materiTerakhir } from "./data-tambahan";
import { dariDbDate, formatTanggal, keDbDate, nomorHari } from "./waktu";
import type { DataHariIni, ItemJadwal } from "./tipe";

const includeJadwal = (tanggal: string) =>
  ({
    kelas: {
      select: {
        id: true,
        nama: true,
        siswa: { where: { aktif: true }, select: { id: true, nama: true, nis: true, jk: true }, orderBy: { nama: "asc" } },
      },
    },
    mapel: { select: { id: true, nama: true } },
    guru: { select: { id: true, nama: true } },
    pertemuan: {
      where: { tanggal: keDbDate(tanggal) },
      include: { guru: { select: { nama: true } }, absensi: true },
    },
  }) satisfies Prisma.JadwalInclude;

type JadwalLengkap = Prisma.JadwalGetPayload<{ include: ReturnType<typeof includeJadwal> }>;

export async function petaJam(): Promise<Map<number, { mulai: string; selesai: string }>> {
  const jam = await db.jamPelajaran.findMany();
  return new Map(jam.map((j) => [j.jamKe, { mulai: j.mulai, selesai: j.selesai }]));
}

export function teksWaktu(peta: Map<number, { mulai: string; selesai: string }>, a: number, b: number) {
  const m = peta.get(a)?.mulai;
  const s = peta.get(b)?.selesai;
  return m && s ? `${m}–${s}` : "";
}

function keItem(j: JadwalLengkap, penggunaId: string, peta: Map<number, { mulai: string; selesai: string }>): ItemJadwal {
  const p = j.pertemuan[0];
  return {
    id: j.id,
    hari: j.hari,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    waktu: teksWaktu(peta, j.jamMulai, j.jamSelesai),
    kelas: { id: j.kelas.id, nama: j.kelas.nama },
    mapel: j.mapel,
    guru: j.guru,
    milikSaya: j.guruId === penggunaId,
    siswa: j.kelas.siswa,
    pertemuan: p
      ? {
          id: p.id,
          idKlien: p.idKlien,
          materi: p.materi,
          kd: p.kd,
          catatan: p.catatan,
          namaGuru: p.guru.nama,
          guruId: p.guruId,
          pengganti: p.pengganti,
          diperiksa: !!p.diperiksaPada,
          absensi: Object.fromEntries(p.absensi.map((a) => [a.siswaId, { status: a.status, keterangan: a.keterangan }])),
        }
      : null,
  };
}

/** Jadwal mengajar guru pada tanggal tertentu (beserta daftar siswa dan isian yang sudah ada) */
export async function dataHariIni(penggunaId: string, tanggal: string, tambahanJadwalId?: string): Promise<DataHariIni> {
  const hari = nomorHari(tanggal);
  const peta = await petaJam();
  const where: Prisma.JadwalWhereInput = tambahanJadwalId
    ? { hari, OR: [{ guruId: penggunaId }, { id: tambahanJadwalId }] }
    : { hari, guruId: penggunaId };
  const jadwal = await db.jadwal.findMany({
    where,
    include: includeJadwal(tanggal),
    orderBy: [{ jamMulai: "asc" }],
  });
  const lalu = await materiTerakhir(jadwal.map((j) => ({ kelasId: j.kelasId, mapelId: j.mapelId })), tanggal);
  return {
    tanggal,
    tanggalTeks: formatTanggal(tanggal),
    penggunaId,
    jadwal: jadwal.map((j) => ({ ...keItem(j, penggunaId, peta), materiLalu: lalu.get(`${j.kelasId}|${j.mapelId}`) ?? null })),
  };
}

/** Semua jadwal pada tanggal tertentu, untuk guru pengganti / wali kelas */
export async function semuaJadwalTanggal(tanggal: string, filter: Prisma.JadwalWhereInput = {}) {
  const peta = await petaJam();
  const jadwal = await db.jadwal.findMany({
    where: { hari: nomorHari(tanggal), ...filter },
    include: {
      kelas: { select: { id: true, nama: true } },
      mapel: { select: { id: true, nama: true } },
      guru: { select: { id: true, nama: true } },
      pertemuan: {
        where: { tanggal: keDbDate(tanggal) },
        select: { id: true, guru: { select: { nama: true } }, pengganti: true, diperiksaPada: true,
          absensi: { select: { status: true } } },
      },
    },
    orderBy: [{ jamMulai: "asc" }, { kelas: { nama: "asc" } }],
  });
  return jadwal.map((j) => ({
    id: j.id,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    waktu: teksWaktu(peta, j.jamMulai, j.jamSelesai),
    kelas: j.kelas,
    mapel: j.mapel,
    guru: j.guru,
    pertemuan: j.pertemuan[0]
      ? {
          id: j.pertemuan[0].id,
          namaGuru: j.pertemuan[0].guru.nama,
          pengganti: j.pertemuan[0].pengganti,
          diperiksa: !!j.pertemuan[0].diperiksaPada,
          rekap: hitungStatus(j.pertemuan[0].absensi.map((a) => a.status)),
        }
      : null,
  }));
}

export function hitungStatus(list: string[]) {
  const r = { H: 0, S: 0, I: 0, A: 0 };
  for (const s of list) if (s in r) r[s as keyof typeof r]++;
  return r;
}

export { dariDbDate };
