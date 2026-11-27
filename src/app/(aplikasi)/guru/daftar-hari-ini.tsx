"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { simpanCache } from "@/lib/antrean";
import { useAntrean, useCache, useTanggalHariIni } from "@/lib/hooks-klien";
import type { DataHariIni } from "@/lib/tipe";

/** Daftar jadwal mengajar hari ini. Data disimpan di HP agar bisa dipakai saat offline. */
export function DaftarHariIni({ data: dataServer, zona }: { data: DataHariIni; zona: string }) {
  const hariIni = useTanggalHariIni(zona);
  const cache = useCache<DataHariIni>("hari-ini");
  const antrean = useAntrean();

  // Halaman dari cache offline bisa berisi data lama; pakai salinan terbaru di HP bila lebih baru.
  const data = hariIni && dataServer.tanggal !== hariIni && cache?.data.tanggal === hariIni ? cache.data : dataServer;
  const kedaluwarsa = hariIni !== null && data.tanggal !== hariIni;

  useEffect(() => {
    if (hariIni && dataServer.tanggal === hariIni) simpanCache("hari-ini", dataServer);
  }, [dataServer, hariIni]);

  const menunggu = useMemo(() => {
    const s = new Set<string>();
    for (const x of antrean ?? []) {
      const b = x.body as { jadwalId?: string; tanggal?: string };
      if (x.url === "/api/pertemuan" && b.jadwalId && b.tanggal === data.tanggal) s.add(b.jadwalId);
    }
    return s;
  }, [antrean, data.tanggal]);

  const jadwal = data.jadwal.filter((j) => j.milikSaya);
  const selesai = jadwal.filter((j) => j.pertemuan || menunggu.has(j.id)).length;

  return (
    <section className="space-y-3">
      {kedaluwarsa && (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Jadwal ini dari {data.tanggalTeks}. Sambungkan internet lalu muat ulang untuk melihat jadwal hari ini.
        </p>
      )}
      <div className="flex items-end justify-between">
        <h2 className="font-semibold text-slate-900">Jadwal mengajar</h2>
        {jadwal.length > 0 && (
          <span className="text-sm text-slate-500">{selesai} dari {jadwal.length} sudah diisi</span>
        )}
      </div>
      {jadwal.length === 0 && (
        <p className="kartu text-sm text-slate-500">Tidak ada jadwal mengajar hari ini.</p>
      )}
      <ul className="space-y-2">
        {jadwal.map((j) => {
          const status = j.pertemuan ? "terisi" : menunggu.has(j.id) ? "menunggu" : "belum";
          return (
            <li key={j.id}>
              <Link
                href={`/guru/isi?jadwal=${j.id}`}
                className="kartu flex items-center justify-between gap-3 transition hover:border-utama-500"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    Jam ke-{j.jamMulai}{j.jamSelesai > j.jamMulai ? `–${j.jamSelesai}` : ""} · {j.waktu}
                  </p>
                  <p className="truncate font-semibold text-slate-900">{j.mapel.nama}</p>
                  <p className="text-sm text-slate-600">Kelas {j.kelas.nama} · {j.siswa.length} siswa</p>
                </div>
                {status === "terisi" && <span className="lencana shrink-0 bg-utama-100 text-utama-700">Sudah diisi</span>}
                {status === "menunggu" && <span className="lencana shrink-0 bg-amber-100 text-amber-800">Menunggu dikirim</span>}
                {status === "belum" && <span className="lencana shrink-0 bg-slate-100 text-slate-700">Isi absen</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
