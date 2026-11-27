import { db } from "@/lib/db";
import { GalatApi, penggunaApi, tangani } from "@/lib/api";
import { pimpinanAtauTU } from "@/lib/auth";
import { laporanGuru, laporanJurnal, laporanSiswa } from "@/lib/laporan";
import { keDbDate, validTanggal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  const q = new URL(req.url).searchParams;
  const jenis = q.get("jenis");
  const dari = q.get("dari");
  const sampai = q.get("sampai");
  const kelasId = q.get("kelas") || undefined;
  if (!validTanggal(dari) || !validTanggal(sampai) || dari > sampai) throw new GalatApi(400, "Periode tidak valid.");
  if ((keDbDate(sampai).getTime() - keDbDate(dari).getTime()) / 86400000 > 190) {
    throw new GalatApi(400, "Periode maksimal 6 bulan.");
  }

  let hasil;
  if (jenis === "siswa") {
    if (!kelasId) throw new GalatApi(400, "Pilih kelas.");
    const kelas = await db.kelas.findUnique({ where: { id: kelasId }, select: { waliKelasId: true } });
    if (!kelas) throw new GalatApi(404, "Kelas tidak ditemukan.");
    if (!pimpinanAtauTU(u) && kelas.waliKelasId !== u.id) throw new GalatApi(403, "Anda tidak punya akses ke kelas ini.");
    hasil = await laporanSiswa(kelasId, dari, sampai);
  } else if (jenis === "guru") {
    if (!pimpinanAtauTU(u)) throw new GalatApi(403, "Anda tidak punya akses.");
    hasil = await laporanGuru(dari, sampai);
  } else if (jenis === "jurnal") {
    if (!pimpinanAtauTU(u)) throw new GalatApi(403, "Anda tidak punya akses.");
    hasil = await laporanJurnal(dari, sampai, kelasId);
  } else {
    throw new GalatApi(400, "Jenis laporan tidak dikenal.");
  }

  const buf = await hasil.wb.xlsx.writeBuffer();
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${hasil.nama}"`,
      "Cache-Control": "no-store",
    },
  });
});
