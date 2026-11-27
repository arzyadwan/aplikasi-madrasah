import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { GalatApi, penggunaApi, tangani } from "@/lib/api";
import { bolehIsi } from "@/lib/aturan-isi";
import { jarakMeter } from "@/lib/geo";
import { simpanFotoJpeg } from "@/lib/simpan-foto";
import { keDbDate, validTanggal } from "@/lib/waktu";

const skema = z.object({
  idKlien: z.string().min(8).max(64),
  tanggal: z.string().refine(validTanggal, "Tanggal tidak valid"),
  status: z.enum(["HADIR", "IZIN", "SAKIT", "DINAS"]),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  akurasi: z.number().min(0).max(100000).optional().nullable(),
  foto: z.string().max(2_200_000).optional().nullable(),
  keterangan: z.string().trim().max(300).optional().nullable(),
  diisiDiPerangkat: z.string().datetime().optional().nullable(),
});

/** Absen harian guru: Hadir (wajib GPS + selfie) atau Izin/Sakit/Dinas (wajib keterangan) */
export const POST = tangani(async (req: Request) => {
  const u = await penggunaApi(req);
  const hasil = skema.safeParse(await req.json().catch(() => null));
  if (!hasil.success) throw new GalatApi(400, hasil.error.issues[0]?.message ?? "Data tidak valid.");
  const d = hasil.data;

  const sudah = await db.absensiGuru.findUnique({ where: { idKlien: d.idKlien }, select: { id: true } });
  if (sudah) return NextResponse.json({ ok: true, id: sudah.id, ulang: true });

  const pengaturan = await db.pengaturan.findUnique({ where: { id: 1 } });
  const diisi = d.diisiDiPerangkat ? new Date(d.diisiDiPerangkat) : null;
  const izin = bolehIsi(d.tanggal, diisi, pengaturan?.batasSinkronJam ?? 72);
  if (!izin.boleh) throw new GalatApi(422, izin.alasan);

  const ada = await db.absensiGuru.findUnique({
    where: { penggunaId_tanggal: { penggunaId: u.id, tanggal: keDbDate(d.tanggal) } },
  });
  if (ada) throw new GalatApi(409, "Anda sudah absen untuk tanggal ini.");

  let jarak: number | null = null;
  let dalamRadius: boolean | null = null;
  if (d.status === "HADIR") {
    if (d.lat == null || d.lng == null) throw new GalatApi(400, "Lokasi GPS wajib untuk absen hadir.");
    if (!d.foto) throw new GalatApi(400, "Foto selfie wajib untuk absen hadir.");
    if (pengaturan?.lat != null && pengaturan?.lng != null) {
      jarak = jarakMeter(d.lat, d.lng, pengaturan.lat, pengaturan.lng);
      dalamRadius = jarak <= pengaturan.radiusMeter + Math.min(d.akurasi ?? 0, 100);
      if (!dalamRadius && pengaturan.tolakLuarRadius) {
        throw new GalatApi(422, `Anda berada ${jarak} m dari madrasah (batas ${pengaturan.radiusMeter} m).`);
      }
    }
  } else if (!d.keterangan) {
    throw new GalatApi(400, "Keterangan wajib diisi untuk izin, sakit, atau dinas.");
  }

  let fotoPath: string | null = null;
  if (d.foto) {
    try {
      fotoPath = await simpanFotoJpeg(d.foto, `absen-guru/${d.tanggal.slice(0, 7)}`);
    } catch (e) {
      throw new GalatApi(400, (e as Error).message);
    }
  }

  // Untuk isian offline, jam masuk = waktu saat diisi di HP
  const waktuMasuk = diisi && !isNaN(diisi.getTime()) && diisi < new Date() ? diisi : new Date();

  const baru = await db.absensiGuru.create({
    data: {
      idKlien: d.idKlien,
      penggunaId: u.id,
      tanggal: keDbDate(d.tanggal),
      status: d.status,
      waktuMasuk,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      akurasi: d.akurasi ?? null,
      jarakMeter: jarak,
      dalamRadius,
      fotoPath,
      keterangan: d.keterangan || null,
      diisiDiPerangkat: diisi,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: baru.id, jarakMeter: jarak, dalamRadius });
});
