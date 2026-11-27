"use client";

import { bacaAntrean } from "@/lib/antrean";

/** Keluar: hapus salinan data di HP agar tidak terlihat oleh pengguna berikutnya. */
export function TombolKeluar({ aksi }: { aksi: () => Promise<void> }) {
  return (
    <form action={aksi} onSubmit={(e) => {
      const n = bacaAntrean().length;
      if (n > 0 && !confirm(`Ada ${n} data yang belum terkirim. Jika keluar sekarang, data itu akan terhapus dari HP. Tetap keluar?`)) {
        e.preventDefault();
        return;
      }
      Object.keys(localStorage).filter((k) => k.startsWith("cache_") || k.startsWith("antrean_")).forEach((k) => localStorage.removeItem(k));
      navigator.serviceWorker?.controller?.postMessage("hapus-cache");
    }}>
      <button className="rounded-lg px-2 py-1 text-xs text-utama-100 hover:bg-white/10">Keluar</button>
    </form>
  );
}
