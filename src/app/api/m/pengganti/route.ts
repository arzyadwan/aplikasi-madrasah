import { NextResponse } from "next/server";
import { penggunaApi, tangani } from "@/lib/api";
import { semuaJadwalTanggal } from "@/lib/data-guru";
import { tanggalLokal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  const u = await penggunaApi(req, ["GURU", "KEPALA"]);
  const jadwal = (await semuaJadwalTanggal(tanggalLokal())).filter((j) => j.guru.id !== u.id);
  return NextResponse.json({ ok: true, jadwal });
});
