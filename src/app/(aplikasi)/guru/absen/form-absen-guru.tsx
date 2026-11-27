"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { idBaru, kirimAtauAntre } from "@/lib/antrean";
import { useAntrean, useTanggalHariIni } from "@/lib/hooks-klien";
import { kecilkanFoto } from "@/lib/foto-klien";
import { jarakMeter } from "@/lib/geo";
import { LABEL_STATUS_GURU, type StatusGuru } from "@/lib/tipe";

type Lokasi = { lat: number; lng: number; akurasi: number };

export function FormAbsenGuru({
  tanggal: tanggalServer, zona, lokasiMadrasah,
}: {
  tanggal: string; zona: string; lokasiMadrasah: { lat: number; lng: number; radius: number } | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusGuru>("HADIR");
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [galatLokasi, setGalatLokasi] = useState<string | null>(null);
  const [mencari, setMencari] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat" | "antre"; teks: string } | null>(null);
  const tanggal = useTanggalHariIni(zona) ?? tanggalServer;
  const antrean = useAntrean();
  const tertunda = (antrean ?? []).some((x) => x.url === "/api/absen-guru" && (x.body as { tanggal?: string }).tanggal === tanggal);

  function ambilLokasi() {
    if (!("geolocation" in navigator)) { setGalatLokasi("HP ini tidak mendukung GPS."); return; }
    setMencari(true);
    setGalatLokasi(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLokasi({ lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy) }); setMencari(false); },
      (e) => {
        setMencari(false);
        setGalatLokasi(e.code === e.PERMISSION_DENIED
          ? "Izin lokasi ditolak. Aktifkan izin lokasi untuk aplikasi ini di pengaturan browser."
          : "Lokasi belum didapat. Pastikan GPS aktif lalu coba lagi.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  const jarak = lokasi && lokasiMadrasah ? jarakMeter(lokasi.lat, lokasi.lng, lokasiMadrasah.lat, lokasiMadrasah.lng) : null;

  async function pilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setFoto(await kecilkanFoto(f)); } catch (err) { setPesan({ jenis: "galat", teks: (err as Error).message }); }
  }

  async function kirim() {
    setPesan(null);
    if (status === "HADIR" && !lokasi) { setPesan({ jenis: "galat", teks: "Lokasi GPS belum didapat." }); return; }
    if (status === "HADIR" && !foto) { setPesan({ jenis: "galat", teks: "Ambil foto selfie dulu." }); return; }
    if (status !== "HADIR" && !keterangan.trim()) { setPesan({ jenis: "galat", teks: "Isi keterangan." }); return; }
    setProses(true);
    const body = {
      idKlien: idBaru(),
      tanggal,
      status,
      lat: status === "HADIR" ? lokasi?.lat : null,
      lng: status === "HADIR" ? lokasi?.lng : null,
      akurasi: status === "HADIR" ? lokasi?.akurasi : null,
      foto: status === "HADIR" ? foto : null,
      keterangan: keterangan.trim() || null,
      diisiDiPerangkat: new Date().toISOString(),
    };
    const hasil = await kirimAtauAntre("/api/absen-guru", body, `Absen saya (${tanggal})`);
    setProses(false);
    if (hasil.status === "terkirim") {
      setPesan({ jenis: "ok", teks: "Absen tercatat." });
      router.refresh();
    } else if (hasil.status === "diantre") {
      setPesan({ jenis: "antre", teks: "Tidak ada internet. Absen disimpan di HP dan dikirim otomatis saat internet tersambung." });
    } else {
      setPesan({ jenis: "galat", teks: hasil.pesan });
    }
  }

  if (tertunda && pesan?.jenis !== "antre") {
    return <p className="kartu text-sm text-amber-900">Absen hari ini sudah tersimpan di HP dan menunggu dikirim.</p>;
  }

  return (
    <div className="kartu space-y-4">
      <div>
        <p className="label">Status</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(LABEL_STATUS_GURU) as StatusGuru[]).map((s) => (
            <button key={s} type="button" onClick={() => { setStatus(s); if (s === "HADIR" && !lokasi && !mencari) ambilLokasi(); }}
              className={`rounded-lg border px-2 py-2 text-sm font-semibold ${status === s ? "border-utama-600 bg-utama-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
              {LABEL_STATUS_GURU[s]}
            </button>
          ))}
        </div>
      </div>

      {status === "HADIR" ? (
        <>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-semibold">1. Lokasi</p>
            {mencari && <p className="text-slate-600">Mencari lokasi GPS…</p>}
            {lokasi && (
              <p className="text-slate-700">
                Lokasi didapat (akurasi ±{lokasi.akurasi} m).
                {jarak != null && <> Jarak ke madrasah ±{jarak} m{lokasiMadrasah && jarak > lokasiMadrasah.radius ? " (di luar area)" : ""}.</>}
              </p>
            )}
            {galatLokasi && <p className="text-red-700">{galatLokasi}</p>}
            <button type="button" className={lokasi ? "mt-2 text-sm font-semibold text-utama-700" : "tombol-garis mt-2"} onClick={ambilLokasi} disabled={mencari}>
              {lokasi ? "Perbarui lokasi" : "Ambil lokasi"}
            </button>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="mb-2 font-semibold">2. Foto selfie</p>
            {foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="Pratinjau selfie" className="mb-2 w-40 rounded-lg border" />
            )}
            <label className="tombol-garis cursor-pointer">
              {foto ? "Ambil ulang foto" : "Buka kamera"}
              <input type="file" accept="image/*" capture="user" className="sr-only" onChange={pilihFoto} />
            </label>
          </div>
        </>
      ) : (
        <div>
          <label className="label" htmlFor="ket">Keterangan *</label>
          <textarea id="ket" className="masukan" rows={2} value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
            placeholder={status === "DINAS" ? "Contoh: rapat KKM di Kemenag Konawe" : "Contoh: demam"} />
        </div>
      )}

      {pesan && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${
          pesan.jenis === "ok" ? "bg-utama-50 text-utama-900" : pesan.jenis === "antre" ? "bg-amber-100 text-amber-900" : "bg-red-50 text-red-700"
        }`}>{pesan.teks}</p>
      )}
      {pesan?.jenis !== "antre" && pesan?.jenis !== "ok" && (
        <button className="tombol w-full" onClick={kirim} disabled={proses}>
          {proses ? "Mengirim…" : "Kirim absen"}
        </button>
      )}
    </div>
  );
}
