"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { aksiAdmin, angka, GalatAksi, teks } from "@/lib/aksi-admin";

export const simpanPengaturan = aksiAdmin(async (form) => {
  const lat = angka(form, "lat");
  const lng = angka(form, "lng");
  if ((lat == null) !== (lng == null)) throw new GalatAksi("Isi lintang dan bujur sekaligus, atau kosongkan keduanya.");
  if (lat != null && (lat < -90 || lat > 90)) throw new GalatAksi("Lintang tidak valid.");
  if (lng != null && (lng < -180 || lng > 180)) throw new GalatAksi("Bujur tidak valid.");
  const radius = angka(form, "radiusMeter") ?? 150;
  const batas = angka(form, "batasSinkronJam") ?? 72;
  if (radius < 20 || radius > 5000) throw new GalatAksi("Radius 20–5000 meter.");
  if (batas < 1 || batas > 240) throw new GalatAksi("Batas kirim offline 1–240 jam.");
  const data = {
    namaMadrasah: teks(form, "namaMadrasah", true, 120),
    alamat: teks(form, "alamat", false, 300) || null,
    lat, lng,
    radiusMeter: Math.round(radius),
    tolakLuarRadius: form.get("tolakLuarRadius") === "on",
    batasSinkronJam: Math.round(batas),
  };
  await db.pengaturan.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  revalidatePath("/", "layout");
  return { ok: true, pesan: "Pengaturan disimpan." };
});

const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const simpanJam = aksiAdmin(async (form) => {
  const mulai = form.getAll("mulai").map(String);
  const selesai = form.getAll("selesai").map(String);
  const data = mulai.map((m, i) => ({ jamKe: i + 1, mulai: m.trim(), selesai: (selesai[i] ?? "").trim() }))
    .filter((j) => j.mulai || j.selesai);
  if (data.some((j, i) => j.jamKe !== i + 1)) throw new GalatAksi("Baris kosong hanya boleh di bagian akhir.");
  for (const j of data) {
    if (!POLA_JAM.test(j.mulai) || !POLA_JAM.test(j.selesai) || j.selesai <= j.mulai) {
      throw new GalatAksi(`Jam ke-${j.jamKe} tidak valid (format 07:30, selesai harus setelah mulai).`);
    }
  }
  const maksJadwal = await db.jadwal.aggregate({ _max: { jamSelesai: true } });
  if ((maksJadwal._max.jamSelesai ?? 0) > data.length) {
    throw new GalatAksi(`Masih ada jadwal sampai jam ke-${maksJadwal._max.jamSelesai}. Hapus jadwal itu dulu sebelum mengurangi jam.`);
  }
  await db.$transaction([db.jamPelajaran.deleteMany(), db.jamPelajaran.createMany({ data })]);
  revalidatePath("/admin/pengaturan");
  return { ok: true, pesan: "Jam pelajaran disimpan." };
});
