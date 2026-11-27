import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GalatApi, tangani } from "@/lib/api";
import { cekLogin } from "@/lib/batas-login";
import { buatToken } from "@/lib/sesi";

/** Login aplikasi HP: mengembalikan token untuk header Authorization: Bearer */
export const POST = tangani(async (req: Request) => {
  const body = (await req.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
  const hasil = await cekLogin(String(body?.username ?? ""), String(body?.password ?? ""), ip);
  if (!hasil.ok) throw new GalatApi(401, hasil.pesan);
  const token = await buatToken({ uid: hasil.pengguna.id, v: hasil.pengguna.versiSesi }, 60);
  const p = await db.pengaturan.findUnique({ where: { id: 1 }, select: { namaMadrasah: true } });
  return NextResponse.json({ ok: true, token, namaMadrasah: p?.namaMadrasah ?? null });
});
