import "server-only";
import { db } from "./db";
import { semuaJadwalTanggal } from "./data-guru";
import { jamLokal, keDbDate, tanggalLokal } from "./waktu";

/** Ringkasan satu hari untuk kepala madrasah (kuesioner 7.2 dan 7.3) */
export async function pantauanHarian(tanggal: string) {
  const [guru, absenGuru, jadwal, jam, absensiSiswa, kelas] = await Promise.all([
    db.pengguna.findMany({
      where: { aktif: true, peran: { in: ["GURU", "KEPALA"] } },
      select: { id: true, nama: true, peran: true },
      orderBy: { nama: "asc" },
    }),
    db.absensiGuru.findMany({ where: { tanggal: keDbDate(tanggal) } }),
    semuaJadwalTanggal(tanggal),
    db.jamPelajaran.findMany(),
    db.absensiSiswa.findMany({
      where: { pertemuan: { tanggal: keDbDate(tanggal) } },
      select: {
        status: true,
        keterangan: true,
        siswa: { select: { id: true, nama: true } },
        pertemuan: { select: { kelasId: true, jamMulai: true, mapel: { select: { nama: true } } } },
      },
    }),
    db.kelas.findMany({ select: { id: true, nama: true, _count: { select: { siswa: { where: { aktif: true } } } } }, orderBy: { nama: "asc" } }),
  ]);

  const petaAbsen = new Map(absenGuru.map((a) => [a.penggunaId, a]));
  const guruBerjadwal = new Set(jadwal.map((j) => j.guru.id));
  const belumAbsen = guru
    .filter((g) => !petaAbsen.has(g.id))
    .map((g) => ({ ...g, berjadwal: guruBerjadwal.has(g.id) }))
    .sort((a, b) => Number(b.berjadwal) - Number(a.berjadwal));

  // Jam pelajaran yang sudah selesai (untuk menandai jurnal yang terlambat)
  const sekarang = tanggal === tanggalLokal() ? jamLokal() : tanggal < tanggalLokal() ? "99:99" : "00:00";
  const selesaiJam = new Map(jam.map((j) => [j.jamKe, j.selesai]));
  const belumJurnal = jadwal
    .filter((j) => !j.pertemuan)
    .map((j) => ({ ...j, lewat: (selesaiJam.get(j.jamSelesai) ?? "99:99") <= sekarang }));

  const perKelas = kelas.map((k) => {
    const data = absensiSiswa.filter((a) => a.pertemuan.kelasId === k.id);
    const r = { H: 0, S: 0, I: 0, A: 0 };
    data.forEach((a) => r[a.status]++);
    const tidakHadir = new Map<string, { nama: string; status: string[] }>();
    data.filter((a) => a.status !== "H").forEach((a) => {
      const x = tidakHadir.get(a.siswa.id) ?? { nama: a.siswa.nama, status: [] };
      x.status.push(`${a.status} (jam ${a.pertemuan.jamMulai})`);
      tidakHadir.set(a.siswa.id, x);
    });
    const jadwalKelas = jadwal.filter((j) => j.kelas.id === k.id);
    return {
      id: k.id,
      nama: k.nama,
      jumlahSiswa: k._count.siswa,
      jadwal: jadwalKelas.length,
      terisi: jadwalKelas.filter((j) => j.pertemuan).length,
      rekap: r,
      tidakHadir: [...tidakHadir.values()],
    };
  });

  const totalSiswa = absensiSiswa.length;
  const hadirSiswa = absensiSiswa.filter((a) => a.status === "H").length;

  return {
    guru: { total: guru.length, sudahAbsen: absenGuru.filter((a) => guru.some((g) => g.id === a.penggunaId)).length,
      hadir: absenGuru.filter((a) => a.status === "HADIR").length, luarRadius: absenGuru.filter((a) => a.dalamRadius === false).length },
    belumAbsen,
    jadwal: { total: jadwal.length, terisi: jadwal.filter((j) => j.pertemuan).length,
      belumDiperiksa: jadwal.filter((j) => j.pertemuan && !j.pertemuan.diperiksa).length },
    belumJurnal,
    siswa: { persenHadir: totalSiswa ? Math.round((hadirSiswa / totalSiswa) * 100) : null },
    perKelas,
  };
}
