import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { GalatApi, penggunaApi, tangani } from "@/lib/api";
import { bolehIsi } from "@/lib/aturan-isi";
import { keDbDate, nomorHari, tanggalLokal, validTanggal } from "@/lib/waktu";

const skema = z.object({
  idKlien: z.string().min(8).max(64),
  jadwalId: z.string().min(1),
  tanggal: z.string().refine(validTanggal, "Tanggal tidak valid"),
  materi: z.string().trim().min(1, "Materi wajib diisi").max(500),
  kd: z.string().trim().max(300).optional().nullable(),
  catatan: z.string().trim().max(1000).optional().nullable(),
  diisiDiPerangkat: z.string().datetime().optional().nullable(),
  absensi: z
    .array(
      z.object({
        siswaId: z.string().min(1),
        status: z.enum(["H", "S", "I", "A"]),
        keterangan: z.string().trim().max(200).optional().nullable(),
      }),
    )
    .max(200),
});

/** Simpan absen siswa + jurnal untuk satu jadwal pada satu tanggal */
export const POST = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  const hasil = skema.safeParse(await req.json().catch(() => null));
  if (!hasil.success) throw new GalatApi(400, hasil.error.issues[0]?.message ?? "Data tidak valid.");
  const d = hasil.data;

  // Kirim ulang dari antrean offline: sudah tersimpan sebelumnya
  const sudah = await db.pertemuan.findUnique({ where: { idKlien: d.idKlien }, select: { id: true } });
  if (sudah) return NextResponse.json({ ok: true, id: sudah.id, ulang: true });

  const jadwal = await db.jadwal.findUnique({
    where: { id: d.jadwalId },
    include: { kelas: { select: { waliKelasId: true, siswa: { where: { aktif: true }, select: { id: true } } } } },
  });
  if (!jadwal) throw new GalatApi(404, "Jadwal tidak ditemukan.");
  if (jadwal.hari !== nomorHari(d.tanggal)) throw new GalatApi(400, "Jadwal ini bukan untuk hari tersebut.");

  const milikSaya = jadwal.guruId === u.id;
  const waliKelas = jadwal.kelas.waliKelasId === u.id;
  if (!milikSaya && !waliKelas && u.peran === "ADMIN") {
    throw new GalatApi(403, "Operator tidak mengisi absen kelas. Gunakan akun guru.");
  }

  const pengaturan = await db.pengaturan.findUnique({ where: { id: 1 } });
  const diisi = d.diisiDiPerangkat ? new Date(d.diisiDiPerangkat) : null;
  const izin = bolehIsi(d.tanggal, diisi, pengaturan?.batasSinkronJam ?? 72);
  if (!izin.boleh) throw new GalatApi(422, izin.alasan);

  // Semua siswa aktif di kelas harus punya status
  const idSiswaKelas = new Set(jadwal.kelas.siswa.map((s) => s.id));
  const absensi = d.absensi.filter((a) => idSiswaKelas.has(a.siswaId));
  const terisi = new Set(absensi.map((a) => a.siswaId));
  if (terisi.size !== idSiswaKelas.size) {
    throw new GalatApi(400, "Status kehadiran semua siswa harus diisi.");
  }

  const ada = await db.pertemuan.findUnique({
    where: { jadwalId_tanggal: { jadwalId: jadwal.id, tanggal: keDbDate(d.tanggal) } },
    include: { guru: { select: { nama: true } } },
  });

  const dataJurnal = {
    materi: d.materi,
    kd: d.kd || null,
    catatan: d.catatan || null,
  };
  const dataAbsensi = absensi.map((a) => ({ siswaId: a.siswaId, status: a.status, keterangan: a.keterangan || null }));

  if (ada) {
    const bisaUbah =
      ada.guruId === u.id && d.tanggal === tanggalLokal() && !ada.diperiksaPada;
    if (!bisaUbah) {
      const alasan = ada.diperiksaPada
        ? "Jurnal ini sudah diperiksa kepala madrasah dan tidak bisa diubah."
        : ada.guruId !== u.id
          ? `Pertemuan ini sudah diisi oleh ${ada.guru.nama}.`
          : "Isian yang sudah lewat harinya tidak bisa diubah.";
      throw new GalatApi(409, alasan);
    }
    await db.$transaction([
      db.pertemuan.update({ where: { id: ada.id }, data: { ...dataJurnal, idKlien: d.idKlien } }),
      db.absensiSiswa.deleteMany({ where: { pertemuanId: ada.id } }),
      db.absensiSiswa.createMany({ data: dataAbsensi.map((a) => ({ ...a, pertemuanId: ada.id })) }),
    ]);
    return NextResponse.json({ ok: true, id: ada.id, diubah: true });
  }

  const baru = await db.pertemuan.create({
    data: {
      idKlien: d.idKlien,
      tanggal: keDbDate(d.tanggal),
      jamMulai: jadwal.jamMulai,
      jamSelesai: jadwal.jamSelesai,
      jadwalId: jadwal.id,
      kelasId: jadwal.kelasId,
      mapelId: jadwal.mapelId,
      guruId: u.id,
      pengganti: !milikSaya,
      ...dataJurnal,
      diisiDiPerangkat: diisi,
      absensi: { createMany: { data: dataAbsensi } },
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: baru.id });
});
