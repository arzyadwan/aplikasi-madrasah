import { db } from "@/lib/db";
import { GalatApi, penggunaApi, tangani } from "@/lib/api";
import { pimpinanAtauTU } from "@/lib/auth";
import { bacaFoto } from "@/lib/simpan-foto";

/** Foto selfie absen guru: hanya untuk pemilik, kepala madrasah, dan TU */
export const GET = tangani(async (req: Request, ctx: RouteContext<"/api/foto/[id]">) => {
  const u = await penggunaApi(req);
  const { id } = await ctx.params;
  const absen = await db.absensiGuru.findUnique({ where: { id }, select: { penggunaId: true, fotoPath: true } });
  if (!absen?.fotoPath) throw new GalatApi(404, "Foto tidak ditemukan.");
  if (absen.penggunaId !== u.id && !pimpinanAtauTU(u)) throw new GalatApi(403, "Anda tidak punya akses.");
  const buf = await bacaFoto(absen.fotoPath);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" },
  });
});
