import "server-only";
import { NextResponse } from "next/server";
import type { Peran } from "@prisma/client";
import { penggunaSaatIni, type PenggunaAktif } from "./auth";

export class GalatApi extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function jsonGalat(status: number, pesan: string) {
  return NextResponse.json({ ok: false, pesan }, { status });
}

/** Tolak POST dari situs lain (perlindungan CSRF sederhana untuk route handler) */
export function cekAsal(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // beberapa browser lama tidak mengirim Origin untuk same-origin
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new GalatApi(403, "Permintaan ditolak.");
  } catch (e) {
    if (e instanceof GalatApi) throw e;
    throw new GalatApi(403, "Permintaan ditolak.");
  }
}

export async function penggunaApi(req: Request, peran?: Peran[]): Promise<PenggunaAktif> {
  cekAsal(req);
  const u = await penggunaSaatIni();
  if (!u) throw new GalatApi(401, "Sesi berakhir. Silakan login lagi.");
  if (peran && !peran.includes(u.peran)) throw new GalatApi(403, "Anda tidak punya akses.");
  return u;
}

/** Bungkus handler agar GalatApi menjadi respons JSON yang rapi */
export function tangani<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A): Promise<Response> => {
    try {
      return await fn(...a);
    } catch (e) {
      if (e instanceof GalatApi) return jsonGalat(e.status, e.message);
      if ((e as { code?: string })?.code === "P2002") {
        return jsonGalat(409, "Data ini sudah tersimpan sebelumnya. Muat ulang halaman.");
      }
      console.error(e);
      return jsonGalat(500, "Terjadi kesalahan di server.");
    }
  };
}
