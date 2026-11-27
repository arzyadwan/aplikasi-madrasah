"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { aksiAdmin, angka, GalatAksi, teks } from "@/lib/aksi-admin";
import { NAMA_HARI } from "@/lib/waktu";

export const tambahJadwal = aksiAdmin(async (form) => {
  const kelasId = teks(form, "kelasId", true);
  const mapelId = teks(form, "mapelId", true);
  const guruId = teks(form, "guruId", true);
  const hari = angka(form, "hari");
  const jamMulai = angka(form, "jamMulai");
  const jamSelesai = angka(form, "jamSelesai");
  if (!hari || hari < 1 || hari > 6) throw new GalatAksi("Pilih hari Senin–Sabtu.");
  if (!jamMulai || !jamSelesai || jamSelesai < jamMulai) throw new GalatAksi("Jam selesai tidak boleh sebelum jam mulai.");

  const bentrok = await db.jadwal.findMany({
    where: {
      hari,
      jamMulai: { lte: jamSelesai },
      jamSelesai: { gte: jamMulai },
      OR: [{ kelasId }, { guruId }],
    },
    include: { kelas: { select: { nama: true } }, mapel: { select: { nama: true } }, guru: { select: { nama: true } } },
  });
  const b = bentrok[0];
  if (b) {
    throw new GalatAksi(b.kelasId === kelasId
      ? `Bentrok: kelas ini sudah ada ${b.mapel.nama} pada ${NAMA_HARI[hari]} jam ${b.jamMulai}–${b.jamSelesai}.`
      : `Bentrok: ${b.guru.nama} sudah mengajar di ${b.kelas.nama} pada ${NAMA_HARI[hari]} jam ${b.jamMulai}–${b.jamSelesai}.`);
  }
  await db.jadwal.create({ data: { kelasId, mapelId, guruId, hari, jamMulai, jamSelesai } });
  revalidatePath("/admin/jadwal");
  return { ok: true, pesan: "Jadwal ditambahkan." };
});

export const hapusJadwal = aksiAdmin(async (form) => {
  const id = teks(form, "id", true);
  // Riwayat jurnal tetap tersimpan (jadwalId menjadi kosong)
  await db.jadwal.delete({ where: { id } });
  revalidatePath("/admin/jadwal");
  return { ok: true, pesan: "Jadwal dihapus." };
});
