import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { penggunaApi, tangani } from "@/lib/api";
import { profilGuru } from "@/lib/data-tambahan";
import { tanggalLokal, ZONA } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  const [p, profil] = await Promise.all([db.pengaturan.findUnique({ where: { id: 1 } }), profilGuru(u.id)]);
  return NextResponse.json({
    ok: true,
    pengguna: u,
    profil,
    madrasah: { nama: p?.namaMadrasah ?? "Madrasah", lat: p?.lat ?? null, lng: p?.lng ?? null, radiusMeter: p?.radiusMeter ?? 150 },
    zona: ZONA,
    tanggal: tanggalLokal(),
    batasSinkronJam: p?.batasSinkronJam ?? 72,
  });
});
