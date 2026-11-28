import "server-only";
import { db } from "./db";
import { dariDbDate, hariSekolah, keDbDate, tambahHari } from "./waktu";

/** Persentase siswa hadir dari semua absensi pada satu tanggal (null bila belum ada data). */
export async function persenHadirTanggal(tanggal: string, kelasId?: string): Promise<number | null> {
  const where = { pertemuan: { tanggal: keDbDate(tanggal), ...(kelasId ? { kelasId } : {}) } };
  const [total, hadir] = await Promise.all([
    db.absensiSiswa.count({ where }),
    db.absensiSiswa.count({ where: { ...where, status: "H" } }),
  ]);
  return total ? Math.round((hadir / total) * 100) : null;
}

/** Kehadiran satu kelas pada hari sekolah terakhir sampai `tanggal` (paling lama dulu). */
export async function kehadiranSepekan(kelasId: string, tanggal: string, jumlah = 6) {
  const hari: string[] = [];
  for (let t = tanggal; hari.length < jumlah; t = tambahHari(t, -1)) if (hariSekolah(t)) hari.unshift(t);
  const data = await db.absensiSiswa.findMany({
    where: { pertemuan: { kelasId, tanggal: { gte: keDbDate(hari[0]), lte: keDbDate(tanggal) } } },
    select: { status: true, pertemuan: { select: { tanggal: true } } },
  });
  const peta = new Map<string, { total: number; hadir: number }>();
  for (const a of data) {
    const t = dariDbDate(a.pertemuan.tanggal);
    const x = peta.get(t) ?? { total: 0, hadir: 0 };
    x.total++;
    if (a.status === "H") x.hadir++;
    peta.set(t, x);
  }
  return hari.map((t) => {
    const x = peta.get(t);
    return { tanggal: t, persen: x?.total ? Math.round((x.hadir / x.total) * 100) : null };
  });
}

/** Materi pertemuan terakhir sebelum `tanggal` untuk tiap pasangan kelas+mapel. Kunci: "kelasId|mapelId". */
export async function materiTerakhir(pasangan: { kelasId: string; mapelId: string }[], tanggal: string) {
  const hasil = new Map<string, { tanggal: string; materi: string }>();
  if (pasangan.length === 0) return hasil;
  const daftar = await db.pertemuan.findMany({
    where: {
      tanggal: { lt: keDbDate(tanggal), gte: keDbDate(tambahHari(tanggal, -60)) },
      OR: pasangan.map((p) => ({ kelasId: p.kelasId, mapelId: p.mapelId })),
    },
    select: { kelasId: true, mapelId: true, tanggal: true, materi: true },
    orderBy: [{ tanggal: "desc" }, { jamMulai: "desc" }],
  });
  for (const p of daftar) {
    const kunci = `${p.kelasId}|${p.mapelId}`;
    if (!hasil.has(kunci)) hasil.set(kunci, { tanggal: dariDbDate(p.tanggal), materi: p.materi });
  }
  return hasil;
}

/** NIP dan mapel yang diajar (dari jadwal tetap) untuk halaman Akun. */
export async function profilGuru(penggunaId: string) {
  const [u, jadwal] = await Promise.all([
    db.pengguna.findUnique({ where: { id: penggunaId }, select: { nip: true } }),
    db.jadwal.findMany({ where: { guruId: penggunaId }, select: { mapel: { select: { nama: true, urutan: true } } } }),
  ]);
  const mapel = [...new Map(jadwal.map((j) => [j.mapel.nama, j.mapel.urutan])).entries()]
    .sort((a, b) => a[1] - b[1]).map(([nama]) => nama);
  return { nip: u?.nip ?? null, mapel };
}
