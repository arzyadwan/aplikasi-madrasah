import { NextResponse } from "next/server";
import { GalatApi, penggunaApi, tangani } from "@/lib/api";
import { dataWali } from "@/lib/data-mobile";
import { tanggalLokal, validTanggal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  if (u.kelasWali.length === 0) throw new GalatApi(403, "Anda belum ditetapkan sebagai wali kelas.");
  const q = new URL(req.url).searchParams;
  const kelas = u.kelasWali.find((k) => k.id === q.get("kelas")) ?? u.kelasWali[0];
  const t = q.get("tanggal");
  const tanggal = validTanggal(t) && t <= tanggalLokal() ? t : tanggalLokal();
  return NextResponse.json({ ok: true, kelasWali: u.kelasWali, kelas, tanggal, ...(await dataWali(kelas.id, tanggal)) });
});
