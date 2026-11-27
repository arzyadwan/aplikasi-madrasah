"use client";

import { useEffect, useState } from "react";
import { bacaAntrean, hapusDariAntrean, sinkronkan } from "@/lib/antrean";
import { useAntrean, useOnline } from "@/lib/hooks-klien";

/** Penanda di header: offline / ada data yang menunggu dikirim. Sinkron otomatis saat online. */
export function StatusSinkron() {
  const antrean = useAntrean() ?? [];
  const online = useOnline();
  const [buka, setBuka] = useState(false);
  const [proses, setProses] = useState(false);

  // Kirim otomatis: saat halaman dibuka, saat kembali online, dan tiap menit
  useEffect(() => {
    if (!online) return;
    const coba = () => { if (bacaAntrean().some((x) => !x.galat)) void sinkronkan(); };
    coba();
    const t = setInterval(coba, 60000);
    return () => clearInterval(t);
  }, [online]);

  if (online && antrean.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setBuka((b) => !b)}
        className={`lencana ${online ? "bg-amber-300 text-amber-950" : "bg-slate-200 text-slate-800"}`}
      >
        {!online ? "Offline" : ""}
        {!online && antrean.length > 0 ? " · " : ""}
        {antrean.length > 0 ? `${antrean.length} menunggu` : ""}
      </button>
      {buka && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-lg">
          <p className="mb-2 font-semibold">Data tersimpan di HP</p>
          {antrean.length === 0 && <p className="text-slate-500">Tidak ada data tertunda. Anda sedang offline.</p>}
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {antrean.map((x) => (
              <li key={x.id} className="rounded-lg bg-slate-50 p-2">
                <p className="font-medium">{x.label}</p>
                {x.galat ? (
                  <div className="mt-1">
                    <p className="text-xs text-red-700">Ditolak: {x.galat}</p>
                    <button className="mt-1 text-xs font-semibold text-red-700 underline"
                      onClick={() => { if (confirm("Hapus data ini dari HP?")) hapusDariAntrean(x.id); }}>
                      Hapus
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Akan dikirim otomatis saat ada internet.</p>
                )}
              </li>
            ))}
          </ul>
          {online && antrean.some((x) => !x.galat) && (
            <button className="tombol mt-3 w-full" disabled={proses}
              onClick={async () => { setProses(true); await sinkronkan(); setProses(false); }}>
              {proses ? "Mengirim…" : "Kirim sekarang"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
