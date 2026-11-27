"use client";

import { useState } from "react";

/** Isi lintang/bujur dari GPS HP (dipakai operator saat berada di madrasah) */
export function TombolLokasi() {
  const [pesan, setPesan] = useState<string | null>(null);
  return (
    <div>
      <button type="button" className="tombol-garis" onClick={() => {
        setPesan("Mencari lokasi…");
        navigator.geolocation.getCurrentPosition((p) => {
          const lat = document.querySelector<HTMLInputElement>('input[name="lat"]');
          const lng = document.querySelector<HTMLInputElement>('input[name="lng"]');
          if (lat && lng) { lat.value = p.coords.latitude.toFixed(6); lng.value = p.coords.longitude.toFixed(6); }
          setPesan(`Lokasi terisi (akurasi ±${Math.round(p.coords.accuracy)} m). Jangan lupa klik Simpan.`);
        }, () => setPesan("Lokasi tidak didapat. Aktifkan GPS dan izin lokasi."), { enableHighAccuracy: true, timeout: 20000 });
      }}>
        Pakai lokasi saya sekarang
      </button>
      {pesan && <p className="mt-1 text-xs text-slate-600">{pesan}</p>}
    </div>
  );
}
