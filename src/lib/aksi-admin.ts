import "server-only";
import { unstable_rethrow } from "next/navigation";
import { penggunaSaatIni, type PenggunaAktif } from "./auth";
import type { HasilAksi } from "@/components/form-aksi";

export class GalatAksi extends Error {}

/** Bungkus server action admin: cek peran ADMIN dan ubah galat menjadi pesan. */
export function aksiAdmin(fn: (form: FormData, u: PenggunaAktif) => Promise<HasilAksi | void>) {
  return async (_: HasilAksi, form: FormData): Promise<HasilAksi> => {
    try {
      const u = await penggunaSaatIni();
      if (!u || u.peran !== "ADMIN") return { pesan: "Hanya operator/TU yang bisa mengubah data ini." };
      return (await fn(form, u)) ?? { ok: true, pesan: "Tersimpan." };
    } catch (e) {
      unstable_rethrow(e);
      if (e instanceof GalatAksi) return { pesan: e.message };
      if ((e as { code?: string })?.code === "P2002") return { pesan: "Data dengan nama/kode yang sama sudah ada." };
      if ((e as { code?: string })?.code === "P2003") return { pesan: "Data ini masih dipakai di data lain." };
      console.error(e);
      return { pesan: "Terjadi kesalahan. Coba lagi." };
    }
  };
}

export function teks(form: FormData, kunci: string, wajib = false, maks = 200): string {
  const v = String(form.get(kunci) ?? "").trim().slice(0, maks);
  if (wajib && !v) throw new GalatAksi("Lengkapi semua isian yang wajib.");
  return v;
}

export function angka(form: FormData, kunci: string): number | null {
  const s = String(form.get(kunci) ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new GalatAksi("Isian angka tidak valid.");
  return n;
}
