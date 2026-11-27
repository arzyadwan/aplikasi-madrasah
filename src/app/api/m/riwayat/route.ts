import { NextResponse } from "next/server";
import { penggunaApi, tangani } from "@/lib/api";
import { riwayatGuru } from "@/lib/data-mobile";
import { tanggalLokal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  return NextResponse.json({ ok: true, riwayat: await riwayatGuru(u.id, tanggalLokal()) });
});
