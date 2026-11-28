import { NextResponse } from "next/server";
import { penggunaApi, tangani } from "@/lib/api";
import { pantauanHarian } from "@/lib/data-pantauan";
import { persenHadirTanggal } from "@/lib/data-tambahan";
import { tambahHari, tanggalLokal, validTanggal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  await penggunaApi(req, ["KEPALA", "ADMIN"]);
  const t = new URL(req.url).searchParams.get("tanggal");
  const tanggal = validTanggal(t) ? t : tanggalLokal();
  const [data, pekanLalu] = await Promise.all([pantauanHarian(tanggal), persenHadirTanggal(tambahHari(tanggal, -7))]);
  return NextResponse.json({ ok: true, tanggal, ...data, siswa: { ...data.siswa, persenPekanLalu: pekanLalu } });
});
