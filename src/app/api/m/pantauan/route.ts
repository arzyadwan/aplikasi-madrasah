import { NextResponse } from "next/server";
import { penggunaApi, tangani } from "@/lib/api";
import { pantauanHarian } from "@/lib/data-pantauan";
import { tanggalLokal, validTanggal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  await penggunaApi(req, ["KEPALA", "ADMIN"]);
  const t = new URL(req.url).searchParams.get("tanggal");
  const tanggal = validTanggal(t) ? t : tanggalLokal();
  return NextResponse.json({ ok: true, tanggal, ...(await pantauanHarian(tanggal)) });
});
