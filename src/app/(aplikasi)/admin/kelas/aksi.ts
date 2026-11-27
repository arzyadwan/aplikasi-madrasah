"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { aksiAdmin, angka, GalatAksi, teks } from "@/lib/aksi-admin";

export const simpanKelas = aksiAdmin(async (form) => {
  const id = teks(form, "id");
  const nama = teks(form, "nama", true, 30);
  const tingkat = angka(form, "tingkat");
  if (!tingkat || tingkat < 1 || tingkat > 12) throw new GalatAksi("Tingkat harus 1–12.");
  const waliKelasId = teks(form, "waliKelasId") || null;
  const data = { nama, tingkat: Math.round(tingkat), waliKelasId };
  if (id) {
    await db.kelas.update({ where: { id }, data });
    revalidatePath("/admin/kelas");
    redirect("/admin/kelas");
  }
  await db.kelas.create({ data });
  revalidatePath("/admin/kelas");
  return { ok: true, pesan: `Kelas ${nama} ditambahkan.` };
});

export const hapusKelas = aksiAdmin(async (form) => {
  const id = teks(form, "id", true);
  const k = await db.kelas.findUniqueOrThrow({ where: { id }, include: { _count: { select: { siswa: true, pertemuan: true } } } });
  if (k._count.siswa > 0 || k._count.pertemuan > 0) {
    throw new GalatAksi("Kelas masih punya siswa atau riwayat absen. Pindahkan siswa dulu.");
  }
  await db.kelas.delete({ where: { id } });
  revalidatePath("/admin/kelas");
  return { ok: true, pesan: `Kelas ${k.nama} dihapus.` };
});
