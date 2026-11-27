"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker agar aplikasi bisa dibuka saat offline (hanya di produksi). */
export function DaftarkanSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
