"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { penggunaSaatIni } from "@/lib/auth";
import { buatSesi } from "@/lib/sesi";

export type HasilAksi = { ok?: boolean; pesan?: string };

export async function gantiSandi(_: HasilAksi, form: FormData): Promise<HasilAksi> {
  const u = await penggunaSaatIni();
  if (!u) return { pesan: "Sesi berakhir. Silakan login lagi." };
  const lama = String(form.get("lama") ?? "");
  const baru = String(form.get("baru") ?? "");
  const ulang = String(form.get("ulang") ?? "");
  if (baru.length < 8) return { pesan: "Kata sandi baru minimal 8 karakter." };
  if (baru !== ulang) return { pesan: "Ulangi kata sandi baru dengan benar." };
  const data = await db.pengguna.findUnique({ where: { id: u.id } });
  if (!data || !(await bcrypt.compare(lama, data.passwordHash))) return { pesan: "Kata sandi lama salah." };
  const hasil = await db.pengguna.update({
    where: { id: u.id },
    data: { passwordHash: await bcrypt.hash(baru, 10), versiSesi: { increment: 1 } },
  });
  await buatSesi({ uid: u.id, v: hasil.versiSesi });
  return { ok: true, pesan: "Kata sandi berhasil diganti. Perangkat lain otomatis keluar." };
}
