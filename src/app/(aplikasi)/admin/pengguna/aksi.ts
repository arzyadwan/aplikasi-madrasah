"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Peran } from "@prisma/client";
import { db } from "@/lib/db";
import { aksiAdmin, GalatAksi, teks } from "@/lib/aksi-admin";

const PERAN: Peran[] = ["GURU", "KEPALA", "ADMIN"];

function sandiAcak() {
  return randomBytes(5).toString("base64url").replace(/[-_]/g, "x").slice(0, 8);
}

export const simpanPengguna = aksiAdmin(async (form) => {
  const id = teks(form, "id");
  const nama = teks(form, "nama", true, 120);
  const username = teks(form, "username", true, 40).toLowerCase();
  if (!/^[a-z0-9._]{3,40}$/.test(username)) throw new GalatAksi("Nama pengguna 3–40 huruf kecil/angka, boleh titik atau garis bawah.");
  const peran = teks(form, "peran") as Peran;
  if (!PERAN.includes(peran)) throw new GalatAksi("Peran tidak valid.");
  const data = { nama, username, peran, nip: teks(form, "nip", false, 30) || null, noHp: teks(form, "noHp", false, 20) || null };

  if (id) {
    await db.pengguna.update({ where: { id }, data });
    revalidatePath("/admin/pengguna");
    redirect("/admin/pengguna");
  }
  const sandi = teks(form, "sandi", false, 100) || sandiAcak();
  if (sandi.length < 6) throw new GalatAksi("Kata sandi awal minimal 6 karakter.");
  await db.pengguna.create({ data: { ...data, passwordHash: await bcrypt.hash(sandi, 10) } });
  revalidatePath("/admin/pengguna");
  return { ok: true, pesan: `Akun ${username} dibuat. Kata sandi awal: ${sandi} (minta guru menggantinya setelah login).` };
});

export const resetSandi = aksiAdmin(async (form) => {
  const id = teks(form, "id", true);
  const sandi = sandiAcak();
  const u = await db.pengguna.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(sandi, 10), versiSesi: { increment: 1 } },
  });
  return { ok: true, pesan: `Kata sandi baru untuk ${u.username}: ${sandi}` };
});

export const ubahAktif = aksiAdmin(async (form, saya) => {
  const id = teks(form, "id", true);
  if (id === saya.id) throw new GalatAksi("Anda tidak bisa menonaktifkan akun sendiri.");
  const u = await db.pengguna.findUniqueOrThrow({ where: { id } });
  await db.pengguna.update({ where: { id }, data: { aktif: !u.aktif, versiSesi: { increment: 1 } } });
  revalidatePath("/admin/pengguna");
  return { ok: true, pesan: u.aktif ? `${u.nama} dinonaktifkan.` : `${u.nama} diaktifkan kembali.` };
});
