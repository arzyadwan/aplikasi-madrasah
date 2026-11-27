import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { penggunaApi, tangani } from "@/lib/api";
import { tanggalLokal, ZONA } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  const p = await db.pengaturan.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    ok: true,
    pengguna: u,
    madrasah: { nama: p?.namaMadrasah ?? "Madrasah", lat: p?.lat ?? null, lng: p?.lng ?? null, radiusMeter: p?.radiusMeter ?? 150 },
    zona: ZONA,
    tanggal: tanggalLokal(),
    batasSinkronJam: p?.batasSinkronJam ?? 72,
  });
});
