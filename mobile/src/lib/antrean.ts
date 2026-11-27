/**
 * Antrean offline: isian yang gagal terkirim karena tidak ada internet disimpan di HP
 * lalu dikirim otomatis saat internet kembali. Setiap isian membawa idKlien sehingga
 * aman dikirim ulang tanpa menjadi dobel di server.
 */
import * as Crypto from "expo-crypto";
import { useSyncExternalStore } from "react";
import { GalatJaringan, GalatServer, minta } from "./api";
import { bacaJson, simpanJson } from "./penyimpanan";

import type { ItemJadwal } from "./tipe";

export type ItemAntrean = {
  id: string;
  path: string;
  body: Record<string, unknown>;
  label: string;
  dibuat: string;
  galat?: string;
  alasanTunda?: string;
  jadwal?: ItemJadwal;
  dikoreksi?: boolean;
};

const KUNCI = "antrean_v1";
let daftar: ItemAntrean[] = [];
let siap = false;
const pendengar = new Set<() => void>();

function beriTahu() { pendengar.forEach((f) => f()); }

async function simpan(baru: ItemAntrean[]) {
  await simpanJson(KUNCI, baru);
  daftar = baru;
  beriTahu();
}

export async function muatAntrean() {
  if (siap) return;
  buktiAbsen = await bacaJson<string>("bukti_absen_v1");
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

// Satu operasi per giliran agar pengiriman otomatis dan koreksi tidak saling menimpa.
let giliran = Promise.resolve();
function urut<T>(kerja: () => Promise<T>) {
  const hasil = giliran.then(kerja);
  giliran = hasil.then(() => {}, () => {});
  return hasil;
}

let buktiAbsen: string | null = null;
let terakhir = "";
export function useBuktiAbsen() {
  return useSyncExternalStore(langganan, () => buktiAbsen, () => buktiAbsen);
}
function langganan(cb: () => void) { pendengar.add(cb); return () => { pendengar.delete(cb); }; }
export function useTerkirim() {
  return useSyncExternalStore(langganan, () => terakhir, () => terakhir);
}
export function hapusDariAntrean(id: string) {
  return urut(() => simpan(daftar.filter(x => x.id !== id)));
}
export function kosongkanAntrean() {
  return urut(async () => {
    await simpanJson("bukti_absen_v1", null);
    buktiAbsen = null;
    terakhir = "";
    await simpan([]);
  });
}

// Saat token kedaluwarsa, pindahkan antrean bersama bukti ke ruang akun yang sama.
export function titipAntrean(akun: string) {
  return urut(async () => {
    if (daftar.length || buktiAbsen) await simpanJson(akun, { daftar, buktiAbsen });
    await simpanJson("bukti_absen_v1", null);
    buktiAbsen = null;
    terakhir = "";
    await simpan([]);
  });
}
export function pulihkanAntrean(akun: string) {
  return urut(async () => {
    const titipan = await bacaJson<{ daftar: ItemAntrean[]; buktiAbsen: string | null }>(akun);
    if (!titipan) return;
    await simpanJson("bukti_absen_v1", titipan.buktiAbsen);
    buktiAbsen = titipan.buktiAbsen;
    await simpan(titipan.daftar);
    await simpanJson(akun, null);
  });
}

export type HasilKirim =
  | { status: "terkirim"; data: Record<string, unknown> }
  | { status: "diantre"; pesan: string }
  | { status: "ditolak"; pesan: string };

async function kirim(item: ItemAntrean): Promise<HasilKirim> {
  let data;
  try {
    data = await minta<Record<string, unknown>>(item.path, { body: item.body, timeoutMs: 30000 });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "Gagal mengirim.";
    if ((e instanceof GalatServer && e.status === 401) || e instanceof GalatJaringan || (e instanceof GalatServer && e.status >= 500)) {
      await simpan(daftar.map(x => x.id === item.id ? { ...item, alasanTunda: pesan } : x));
      return { status: "diantre", pesan };
    }
    await simpan(daftar.map(x => x.id === item.id ? { ...item, galat: pesan } : x));
    return { status: "ditolak", pesan };
  }
  if (item.dikoreksi && data.ulang === true) {
    const pesan = "Versi sebelumnya sudah terkirim. Periksa kembali koreksi ini.";
    await simpan(daftar.map(x => x.id === item.id ? { ...item, body: { ...item.body, idKlien: idBaru() }, dikoreksi: false, galat: pesan } : x));
    return { status: "ditolak", pesan };
  }
  if (item.path === "/api/absen-guru") {
    const tanggal = String(item.body.tanggal);
    if (!buktiAbsen || tanggal > buktiAbsen) {
      await simpanJson("bukti_absen_v1", tanggal);
      buktiAbsen = tanggal;
    }
  }
  terakhir = item.label;
  await simpan(daftar.filter(x => x.id !== item.id));
  return { status: "terkirim", data };
}

export function kirimAtauAntre(path: string, body: Record<string, unknown>, label: string, sumber?: string, jadwal?: ItemJadwal): Promise<HasilKirim> {
  return urut(async () => {
    await muatAntrean();
    const lama = sumber ? daftar.find(x => x.id === sumber) : [...daftar].reverse().find(x => x.path === path && x.body.tanggal === body.tanggal && x.body.jadwalId === body.jadwalId);
    if (sumber && lama?.id !== sumber) return { status: "ditolak" as const, pesan: "Antrean sudah berubah. Buka kembali isian untuk memperbarui data." };
    if (lama) body = { ...body, idKlien: lama.body.idKlien, diisiDiPerangkat: lama.body.diisiDiPerangkat };
    const dikoreksi = lama && (lama.dikoreksi || JSON.stringify(lama.body) !== JSON.stringify(body));
    const item = { dikoreksi, jadwal: jadwal ?? lama?.jadwal, id: lama?.id ?? idBaru(), dibuat: lama?.dibuat ?? new Date().toISOString(), path, body, label };
    await simpan(lama ? daftar.map(x => x.id === lama.id ? item : x) : [...daftar, item]);
    return kirim(item);
  });
}

let sedangSinkron = false;
export async function sinkronkan() {
  if (sedangSinkron) return;
  sedangSinkron = true;
  try {
    for (const { id } of daftar.filter(x => !x.galat)) {
      const hasil = await urut(async () => {
        const item = daftar.find(x => x.id === id && !x.galat);
        if (item) return kirim(item);
      });
      if (hasil?.status === "diantre") break;
    }
  } finally { sedangSinkron = false; }
}
