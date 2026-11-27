"use client";

import { useState } from "react";

type Preset = { label: string; dari: string; sampai: string };

const JENIS = [
  { nilai: "siswa", label: "Rekap kehadiran siswa", ket: "Per kelas: jumlah hadir, sakit, izin, alpa setiap siswa, plus rekap harian." },
  { nilai: "guru", label: "Rekap kehadiran guru", ket: "Hadir, izin, sakit, dinas, tidak absen, absen di luar area, dan keterisian jurnal." },
  { nilai: "jurnal", label: "Jurnal mengajar", ket: "Daftar semua jurnal: materi, KD, catatan, kehadiran, dan status diperiksa." },
];

export function FormLaporan({ kelas, preset }: { kelas: { id: string; nama: string }[]; preset: Preset[] }) {
  const [jenis, setJenis] = useState("siswa");
  const [dari, setDari] = useState(preset[2].dari);
  const [sampai, setSampai] = useState(preset[2].sampai);
  const [kelasId, setKelasId] = useState(kelas[0]?.id ?? "");

  const q = new URLSearchParams({ jenis, dari, sampai });
  if (jenis === "siswa" || (jenis === "jurnal" && kelasId)) q.set("kelas", kelasId);
  const sah = dari && sampai && dari <= sampai && (jenis !== "siswa" || kelasId);

  return (
    <div className="kartu space-y-4">
      <fieldset className="space-y-2">
        <legend className="label">Jenis laporan</legend>
        {JENIS.map((j) => (
          <label key={j.nilai} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${jenis === j.nilai ? "border-utama-500 bg-utama-50" : "border-slate-200"}`}>
            <input type="radio" name="jenis" value={j.nilai} checked={jenis === j.nilai} onChange={() => setJenis(j.nilai)} className="mt-1" />
            <span><span className="block font-medium">{j.label}</span><span className="text-sm text-slate-500">{j.ket}</span></span>
          </label>
        ))}
      </fieldset>

      <div>
        <p className="label">Periode</p>
        <div className="mb-2 flex flex-wrap gap-2">
          {preset.map((p) => (
            <button key={p.label} type="button" onClick={() => { setDari(p.dari); setSampai(p.sampai); }}
              className={dari === p.dari && sampai === p.sampai ? "tombol px-3 py-1.5" : "tombol-garis px-3 py-1.5"}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">Dari<input type="date" className="masukan" value={dari} onChange={(e) => setDari(e.target.value)} /></label>
          <label className="text-sm">Sampai<input type="date" className="masukan" value={sampai} onChange={(e) => setSampai(e.target.value)} /></label>
        </div>
      </div>

      {jenis !== "guru" && (
        <div>
          <label className="label" htmlFor="kelas">Kelas</label>
          <select id="kelas" className="masukan" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
            {jenis === "jurnal" && <option value="">Semua kelas</option>}
            {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </div>
      )}

      <a href={sah ? `/api/laporan?${q.toString()}` : undefined} aria-disabled={!sah}
        className={`tombol w-full ${sah ? "" : "pointer-events-none opacity-50"}`}>
        Unduh Excel
      </a>
    </div>
  );
}
