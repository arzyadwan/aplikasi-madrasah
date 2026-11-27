"use client";

/**
 * Antrean offline: data yang gagal terkirim karena tidak ada internet disimpan di HP
 * (localStorage) dan dikirim otomatis saat internet kembali. Setiap data membawa
 * idKlien sehingga aman dikirim ulang tanpa menjadi dobel.
 */

export type ItemAntrean = {
  id: string;
  url: string;
  body: unknown;
  label: string;
  dibuat: string;
  /** Diisi bila server menolak data (bukan karena offline) */
  galat?: string;
};

const KUNCI = "antrean_madrasah_v1";
export const EVENT_ANTREAN = "antrean-berubah";

export function bacaAntrean(): ItemAntrean[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KUNCI) ?? "[]") as ItemAntrean[];
  } catch {
    return [];
  }
}

function simpan(list: ItemAntrean[]) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(list));
  } catch {
    throw new Error("Memori HP penuh. Kirim data yang tertunda dulu.");
  }
  window.dispatchEvent(new Event(EVENT_ANTREAN));
}

export function hapusDariAntrean(id: string) {
  simpan(bacaAntrean().filter((x) => x.id !== id));
}

export function idBaru(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type HasilKirim =
  | { status: "terkirim"; data: Record<string, unknown> }
  | { status: "diantre" }
  | { status: "ditolak"; pesan: string };

async function kirim(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
}

/** Coba kirim; bila offline atau server tidak terjangkau, simpan ke antrean. */
export async function kirimAtauAntre(url: string, body: unknown, label: string): Promise<HasilKirim> {
  try {
    const res = await kirim(url, body);
    if (res.ok) return { status: "terkirim", data: await res.json() };
    if (res.status >= 500 || res.status === 408 || res.status === 429) throw new Error("server");
    const j = await res.json().catch(() => ({}));
    return { status: "ditolak", pesan: (j as { pesan?: string }).pesan ?? `Gagal (${res.status})` };
  } catch {
    simpan([...bacaAntrean(), { id: idBaru(), url, body, label, dibuat: new Date().toISOString() }]);
    return { status: "diantre" };
  }
}

let sedangSinkron = false;

/** Kirim semua isi antrean. Berhenti bila masih offline. */
export async function sinkronkan(): Promise<{ terkirim: number; ditolak: number; sisa: number }> {
  if (sedangSinkron) return { terkirim: 0, ditolak: 0, sisa: bacaAntrean().length };
  sedangSinkron = true;
  let terkirim = 0;
  let ditolak = 0;
  try {
    for (const item of bacaAntrean()) {
      if (item.galat) continue;
      let res: Response;
      try {
        res = await kirim(item.url, item.body);
      } catch {
        break; // masih offline
      }
      if (res.ok) {
        hapusDariAntrean(item.id);
        terkirim++;
      } else if (res.status >= 500 || res.status === 429) {
        break;
      } else {
        const j = await res.json().catch(() => ({}));
        const pesan = (j as { pesan?: string }).pesan ?? `Ditolak server (${res.status})`;
        if (res.status === 401) break; // perlu login ulang, coba lagi nanti
        simpan(bacaAntrean().map((x) => (x.id === item.id ? { ...x, galat: pesan } : x)));
        ditolak++;
      }
    }
  } finally {
    sedangSinkron = false;
  }
  return { terkirim, ditolak, sisa: bacaAntrean().length };
}

/** Simpan salinan data untuk dipakai saat offline */
export function simpanCache<T>(kunci: string, data: T) {
  try {
    const baru = JSON.stringify({ disimpan: new Date().toISOString(), data });
    const lama = localStorage.getItem(`cache_${kunci}`);
    // hanya beri tahu bila isinya berubah (abaikan cap waktu)
    if (lama && JSON.stringify(JSON.parse(lama).data) === JSON.stringify(data)) return;
    localStorage.setItem(`cache_${kunci}`, baru);
    window.dispatchEvent(new Event("cache-berubah"));
  } catch {
    /* abaikan bila penuh */
  }
}

export function bacaCache<T>(kunci: string): { disimpan: string; data: T } | null {
  try {
    const s = localStorage.getItem(`cache_${kunci}`);
    return s ? (JSON.parse(s) as { disimpan: string; data: T }) : null;
  } catch {
    return null;
  }
}
