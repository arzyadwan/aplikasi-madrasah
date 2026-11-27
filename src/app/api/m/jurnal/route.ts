import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { GalatApi, penggunaApi, tangani } from "@/lib/api";
import { daftarJurnal } from "@/lib/data-mobile";
import { tanggalLokal, validTanggal } from "@/lib/waktu";

export const GET = tangani(async (req: Request) => {
  await penggunaApi(req, ["KEPALA", "ADMIN"]);
  const q = new URL(req.url).searchParams;
  const t = q.get("tanggal");
  const tanggal = validTanggal(t) ? t : tanggalLokal();
  const status = q.get("status");
  const filter = status === "belum" ? { diperiksaPada: null } : status === "sudah" ? { diperiksaPada: { not: null } } : {};
  return NextResponse.json({ ok: true, tanggal, jurnal: await daftarJurnal(tanggal, filter) });
});

const skema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  catatan: z.string().trim().max(500).optional().nullable(),
  batal: z.boolean().optional(),
});

/** Tandai jurnal "sudah diperiksa" (hanya kepala madrasah) */
export const POST = tangani(async (req: Request) => {
  const u = await penggunaApi(req, ["KEPALA"]);
  const d = skema.safeParse(await req.json().catch(() => null));
  if (!d.success) throw new GalatApi(400, "Data tidak valid.");
  if (d.data.batal) {
    await db.pertemuan.updateMany({ where: { id: { in: d.data.ids } }, data: { diperiksaPada: null, diperiksaOlehId: null } });
  } else {
    await db.pertemuan.updateMany({
      where: { id: { in: d.data.ids }, diperiksaPada: null },
      data: {
        diperiksaPada: new Date(), diperiksaOlehId: u.id,
        ...(d.data.ids.length === 1 && d.data.catatan ? { catatanKepala: d.data.catatan } : {}),
      },
    });
  }
  return NextResponse.json({ ok: true });
});
