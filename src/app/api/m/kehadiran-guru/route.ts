import { NextResponse } from "next/server";
import { penggunaApi, tangani } from "@/lib/api";
import { kehadiranGuru } from "@/lib/data-mobile";
import { tanggalLokal, validTanggal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  await penggunaApi(req, ["KEPALA", "ADMIN"]);
  const t = new URL(req.url).searchParams.get("tanggal");
  const tanggal = validTanggal(t) ? t : tanggalLokal();
  return NextResponse.json({ ok: true, tanggal, guru: await kehadiranGuru(tanggal) });
});
