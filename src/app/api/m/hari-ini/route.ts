import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { penggunaApi, tangani } from "@/lib/api";
import { dataHariIni } from "@/lib/data-guru";
import { keDbDate, tanggalLokal } from "@/lib/waktu";

/** Jadwal hari ini + daftar siswa (disimpan di HP untuk dipakai offline) dan status absen saya */
export const GET = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  const jadwalId = new URL(req.url).searchParams.get("jadwal") ?? undefined;
  const tanggal = tanggalLokal();
  const [data, a] = await Promise.all([
    dataHariIni(u.id, tanggal, jadwalId),
    db.absensiGuru.findUnique({ where: { penggunaId_tanggal: { penggunaId: u.id, tanggal: keDbDate(tanggal) } } }),
  ]);
  return NextResponse.json({
    ok: true,
    data,
    absenSaya: a ? {
      id: a.id, status: a.status, waktuMasuk: a.waktuMasuk.toISOString(), jarakMeter: a.jarakMeter,
      dalamRadius: a.dalamRadius, keterangan: a.keterangan, adaFoto: !!a.fotoPath,
    } : null,
  });
});
