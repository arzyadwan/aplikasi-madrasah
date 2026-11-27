/**
 * Antrean offline: isian yang gagal terkirim karena tidak ada internet disimpan di HP
 * lalu dikirim otomatis saat internet kembali. Setiap isian membawa idKlien sehingga
 * aman dikirim ulang tanpa menjadi dobel di server.
 */
import * as Crypto from "expo-crypto";
import { useSyncExternalStore } from "react";
import { GalatJaringan, GalatServer, minta } from "./api";
import { bacaJson, simpanJson } from "./penyimpanan";

export type ItemAntrean = {
  id: string;
  path: string;
  body: Record<string, unknown>;
  label: string;
  dibuat: string;
  galat?: string;
};

const KUNCI = "antrean_v1";
let daftar: ItemAntrean[] = [];
let siap = false;
const pendengar = new Set<() => void>();

function beriTahu() { pendengar.forEach((f) => f()); }

async function simpan(baru: ItemAntrean[]) {
  daftar = baru;
  await simpanJson(KUNCI, daftar);
  beriTahu();
}

export async function muatAntrean() {
  daftar = (await bacaJson<ItemAntrean[]>(KUNCI)) ?? [];
  siap = true;
  beriTahu();
}

export function isiAntrean() { return daftar; }

export function useAntrean(): ItemAntrean[] {
  return useSyncExternalStore(
    (cb) => { pendengar.add(cb); return () => { pendengar.delete(cb); }; },
    () => daftar,
    () => daftar,
  );
}

export function idBaru(): string { return Crypto.randomUUID(); }

export async function hapusDariAntrean(id: string) {
  await simpan(daftar.filter((x) => x.id !== id));
}

export async function kosongkanAntrean() { await simpan([]); }

export type HasilKirim =
  | { status: "terkirim"; data: Record<string, unknown> }
  | { status: "diantre" }
  | { status: "ditolak"; pesan: string };

/** Coba kirim; bila offline atau server sedang bermasalah, simpan ke antrean. */
export async function kirimAtauAntre(path: string, body: Record<string, unknown>, label: string): Promise<HasilKirim> {
  try {
    const data = await minta<Record<string, unknown>>(path, { body, timeoutMs: 30000 });
    return { status: "terkirim", data };
  } catch (e) {
    if (e instanceof GalatServer && e.status < 500 && e.status !== 0) return { status: "ditolak", pesan: e.message };
    if (!siap) await muatAntrean();
    await simpan([...daftar, { id: idBaru(), path, body, label, dibuat: new Date().toISOString() }]);
    return { status: "diantre" };
  }
}

let sedangSinkron = false;

/** Kirim semua isi antrean. Berhenti bila masih offline. */
export async function sinkronkan(): Promise<{ terkirim: number; ditolak: number }> {
  if (sedangSinkron) return { terkirim: 0, ditolak: 0 };
  sedangSinkron = true;
  let terkirim = 0;
  let ditolak = 0;
  try {
    if (!siap) await muatAntrean();
    for (const item of [...daftar]) {
      if (item.galat) continue;
      try {
        await minta(item.path, { body: item.body, timeoutMs: 30000 });
        await simpan(daftar.filter((x) => x.id !== item.id));
        terkirim++;
      } catch (e) {
        if (e instanceof GalatJaringan) break;
        if (e instanceof GalatServer && (e.status >= 500 || e.status === 401 || e.status === 0)) break;
        const pesan = e instanceof Error ? e.message : "Ditolak server";
        await simpan(daftar.map((x) => (x.id === item.id ? { ...x, galat: pesan } : x)));
        ditolak++;
      }
    }
  } finally {
    sedangSinkron = false;
  }
  return { terkirim, ditolak };
}
