import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Peran } from "@prisma/client";
import { db } from "./db";
import { bacaSesi } from "./sesi";

export type PenggunaAktif = {
  id: string;
  nama: string;
  username: string;
  peran: Peran;
  /** Kelas yang diwalikan */
  kelasWali: { id: string; nama: string }[];
  /** Punya jadwal mengajar */
  mengajar: boolean;
};

/** Pengguna yang sedang login, atau null. Dibaca sekali per request. */
export const penggunaSaatIni = cache(async (): Promise<PenggunaAktif | null> => {
  const sesi = await bacaSesi();
  if (!sesi) return null;
  const u = await db.pengguna.findUnique({
    where: { id: sesi.uid },
    select: {
      id: true,
      nama: true,
      username: true,
      peran: true,
      aktif: true,
      versiSesi: true,
      kelasWali: { select: { id: true, nama: true }, orderBy: { nama: "asc" } },
      _count: { select: { jadwal: true } },
    },
  });
  if (!u || !u.aktif || u.versiSesi !== sesi.v) return null;
  return {
    id: u.id,
    nama: u.nama,
    username: u.username,
    peran: u.peran,
    kelasWali: u.kelasWali,
    mengajar: u._count.jadwal > 0,
  };
});

/** Untuk halaman: wajib login (dan peran tertentu bila diisi), jika tidak dialihkan. */
export async function wajibLogin(peran?: Peran[]): Promise<PenggunaAktif> {
  const u = await penggunaSaatIni();
  if (!u) redirect("/login");
  if (peran && !peran.includes(u.peran)) redirect("/");
  return u;
}

/** Bisa melihat seluruh data (kuesioner 7.1: kepala madrasah dan TU) */
export function pimpinanAtauTU(u: PenggunaAktif) {
  return u.peran === "KEPALA" || u.peran === "ADMIN";
}

export function halamanAwal(u: PenggunaAktif): string {
  if (u.peran === "KEPALA") return "/kepala";
  if (u.peran === "ADMIN") return "/admin";
  return "/guru";
}
