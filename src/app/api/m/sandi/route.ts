import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { GalatApi, penggunaApi, tangani } from "@/lib/api";
import { buatToken } from "@/lib/sesi";

/** Ganti kata sandi dari aplikasi HP. Sesi di perangkat lain otomatis keluar. */
export const POST = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  const b = (await req.json().catch(() => null)) as { lama?: string; baru?: string } | null;
  const lama = String(b?.lama ?? "");
  const baru = String(b?.baru ?? "");
  if (baru.length < 8) throw new GalatApi(400, "Kata sandi baru minimal 8 karakter.");
  const data = await db.pengguna.findUniqueOrThrow({ where: { id: u.id } });
  if (!(await bcrypt.compare(lama, data.passwordHash))) throw new GalatApi(400, "Kata sandi lama salah.");
  const hasil = await db.pengguna.update({
    where: { id: u.id },
    data: { passwordHash: await bcrypt.hash(baru, 10), versiSesi: { increment: 1 } },
  });
  return NextResponse.json({ ok: true, token: await buatToken({ uid: u.id, v: hasil.versiSesi }, 60) });
});
