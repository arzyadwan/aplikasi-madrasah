"use client";

import { useMemo, useSyncExternalStore } from "react";
import { EVENT_ANTREAN, type ItemAntrean } from "./antrean";

const KUNCI_ANTREAN = "antrean_madrasah_v1";

function langganan(event: string) {
  return (cb: () => void) => {
    window.addEventListener(event, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(event, cb);
      window.removeEventListener("storage", cb);
    };
  };
}

const langgananAntrean = langganan(EVENT_ANTREAN);

/** Isi antrean offline (null saat render di server / sebelum hidrasi) */
export function useAntrean(): ItemAntrean[] | null {
  const raw = useSyncExternalStore(
    langgananAntrean,
    () => localStorage.getItem(KUNCI_ANTREAN) ?? "[]",
    () => null,
  );
  return useMemo(() => {
    if (raw === null) return null;
    try { return JSON.parse(raw) as ItemAntrean[]; } catch { return []; }
  }, [raw]);
}

const langgananCache = langganan("cache-berubah");

/** Salinan data di HP (lihat simpanCache) */
export function useCache<T>(kunci: string): { disimpan: string; data: T } | null {
  const raw = useSyncExternalStore(langgananCache, () => localStorage.getItem(`cache_${kunci}`), () => null);
  return useMemo(() => {
    if (!raw) return null;
    try { return JSON.parse(raw) as { disimpan: string; data: T }; } catch { return null; }
  }, [raw]);
}

function langgananOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(langgananOnline, () => navigator.onLine, () => true);
}

function langgananMenit(cb: () => void) {
  const t = setInterval(cb, 60000);
  return () => clearInterval(t);
}

/** Tanggal hari ini (YYYY-MM-DD) di zona madrasah menurut jam HP; null sebelum hidrasi */
export function useTanggalHariIni(zona: string): string | null {
  return useSyncExternalStore(
    langgananMenit,
    () => new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
    () => null,
  );
}
