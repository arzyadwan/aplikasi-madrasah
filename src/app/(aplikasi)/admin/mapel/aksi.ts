"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { aksiAdmin, angka, GalatAksi, teks } from "@/lib/aksi-admin";

export const simpanMapel = aksiAdmin(async (form) => {
  const id = teks(form, "id");
  const data = { nama: teks(form, "nama", true, 100), kode: teks(form, "kode", false, 20) || null, urutan: Math.round(angka(form, "urutan") ?? 0) };
  if (id) {
    await db.mapel.update({ where: { id }, data });
    revalidatePath("/admin/mapel");
    redirect("/admin/mapel");
  }
  await db.mapel.create({ data });
  revalidatePath("/admin/mapel");
  return { ok: true, pesan: `${data.nama} ditambahkan.` };
});

export const hapusMapel = aksiAdmin(async (form) => {
  const id = teks(form, "id", true);
  const m = await db.mapel.findUniqueOrThrow({ where: { id }, include: { _count: { select: { jadwal: true, pertemuan: true } } } });
  if (m._count.jadwal || m._count.pertemuan) throw new GalatAksi("Mapel masih dipakai di jadwal atau jurnal.");
  await db.mapel.delete({ where: { id } });
  revalidatePath("/admin/mapel");
  return { ok: true, pesan: `${m.nama} dihapus.` };
});
