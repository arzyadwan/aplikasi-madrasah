"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { idBaru, kirimAtauAntre } from "@/lib/antrean";
import { useCache, useTanggalHariIni } from "@/lib/hooks-klien";
import { LABEL_STATUS_SISWA, type DataHariIni, type ItemJadwal, type StatusSiswa } from "@/lib/tipe";

const URUTAN: StatusSiswa[] = ["H", "S", "I", "A"];
const WARNA: Record<StatusSiswa, string> = {
  H: "bg-utama-600 text-white border-utama-600",
  S: "bg-sky-600 text-white border-sky-600",
  I: "bg-amber-500 text-white border-amber-500",
  A: "bg-red-600 text-white border-red-600",
};

type Isian = Record<string, { status: StatusSiswa; keterangan: string }>;

export function FormPertemuan({ data, zona, bolehPengganti }: { data: DataHariIni; zona: string; bolehPengganti: boolean }) {
  const router = useRouter();
  const jadwalId = useSearchParams().get("jadwal") ?? "";
  const hariIni = useTanggalHariIni(zona);
  const cache = useCache<DataHariIni>("hari-ini");

  // Saat offline, halaman ini bisa dibuka dari cache untuk jadwal lain: cari di salinan data di HP.
  const sumber = hariIni && (data.tanggal !== hariIni || !data.jadwal.some((j) => j.id === jadwalId)) && cache?.data.tanggal === hariIni
    ? cache.data : data;
  const tanggal = sumber.tanggal;
  const item: ItemJadwal | null | undefined = hariIni === null ? undefined : sumber.jadwal.find((j) => j.id === jadwalId) ?? null;

  if (item === undefined) return <p className="text-sm text-slate-500">Memuat…</p>;
  if (item === null) {
    return (
      <div className="kartu space-y-3">
        <p className="font-semibold">Jadwal tidak ditemukan untuk hari ini.</p>
        <Link href="/guru" className="tombol-garis">Kembali</Link>
      </div>
    );
  }
  return (
    <IsiForm key={item.id} item={item} tanggal={tanggal} penggunaId={data.penggunaId}
      hariIni={hariIni ?? tanggal} bolehPengganti={bolehPengganti} onSelesai={() => { router.push("/guru"); router.refresh(); }} />
  );
}

function IsiForm({
  item, tanggal, penggunaId, hariIni, bolehPengganti, onSelesai,
}: {
  item: ItemJadwal; tanggal: string; penggunaId: string; hariIni: string; bolehPengganti: boolean; onSelesai: () => void;
}) {
  const p = item.pertemuan;
  const bisaUbah = !p || (p.guruId === penggunaId && !p.diperiksa && tanggal === hariIni);
  const pengganti = !item.milikSaya;

  const [isian, setIsian] = useState<Isian>(() =>
    Object.fromEntries(item.siswa.map((s) => [s.id, {
      status: p?.absensi[s.id]?.status ?? "H",
      keterangan: p?.absensi[s.id]?.keterangan ?? "",
    }])),
  );
  const [materi, setMateri] = useState(p?.materi ?? "");
  const [kd, setKd] = useState(p?.kd ?? "");
  const [catatan, setCatatan] = useState(p?.catatan ?? "");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: "ok" | "galat" | "antre"; teks: string } | null>(null);

  const rekap = useMemo(() => {
    const r: Record<StatusSiswa, number> = { H: 0, S: 0, I: 0, A: 0 };
    Object.values(isian).forEach((x) => r[x.status]++);
    return r;
  }, [isian]);

  const ubah = (id: string, status: StatusSiswa) =>
    setIsian((s) => ({ ...s, [id]: { ...s[id], status, keterangan: status === "H" ? "" : s[id].keterangan } }));

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!materi.trim()) { setPesan({ jenis: "galat", teks: "Materi yang diajarkan wajib diisi." }); return; }
    if (pengganti && !confirm(`Anda akan mengisi sebagai guru pengganti untuk ${item.guru.nama}. Lanjutkan?`)) return;
    setProses(true);
    setPesan(null);
    const body = {
      idKlien: idBaru(),
      jadwalId: item.id,
      tanggal,
      materi: materi.trim(),
      kd: kd.trim() || null,
      catatan: catatan.trim() || null,
      diisiDiPerangkat: new Date().toISOString(),
      absensi: Object.entries(isian).map(([siswaId, x]) => ({ siswaId, status: x.status, keterangan: x.keterangan.trim() || null })),
    };
    const hasil = await kirimAtauAntre("/api/pertemuan", body, `${item.mapel.nama} · ${item.kelas.nama} (${tanggal})`);
    setProses(false);
    if (hasil.status === "terkirim") {
      setPesan({ jenis: "ok", teks: "Tersimpan. Terima kasih!" });
      setTimeout(onSelesai, 700);
    } else if (hasil.status === "diantre") {
      setPesan({ jenis: "antre", teks: "Tidak ada internet. Data disimpan di HP dan akan dikirim otomatis saat internet tersambung." });
    } else {
      setPesan({ jenis: "galat", teks: hasil.pesan });
    }
  }

  return (
    <form onSubmit={simpan} className="space-y-4 pb-24">
      <div>
        <Link href="/guru" className="text-sm text-utama-700">← Kembali</Link>
        <h1 className="judul-halaman mt-1">{item.mapel.nama}</h1>
        <p className="text-sm text-slate-600">
          Kelas {item.kelas.nama} · Jam ke-{item.jamMulai}{item.jamSelesai > item.jamMulai ? `–${item.jamSelesai}` : ""} · {item.waktu}
        </p>
        {pengganti && (
          <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
            Jadwal {item.guru.nama}. {bolehPengganti ? "Anda mengisi sebagai guru pengganti." : ""}
          </p>
        )}
        {p && (
          <p className="mt-2 rounded-lg bg-utama-50 px-3 py-2 text-sm text-utama-900">
            Sudah diisi oleh {p.namaGuru}{p.pengganti ? " (pengganti)" : ""}.
            {p.diperiksa ? " Sudah diperiksa kepala madrasah." : bisaUbah ? " Anda masih bisa mengubahnya hari ini." : ""}
          </p>
        )}
      </div>

      <section className="kartu space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Kehadiran siswa</h2>
          {bisaUbah && (
            <button type="button" className="text-sm font-semibold text-utama-700"
              onClick={() => setIsian((s) => Object.fromEntries(Object.keys(s).map((k) => [k, { status: "H", keterangan: "" }])))}>
              Tandai semua hadir
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600">
          Hadir {rekap.H} · Sakit {rekap.S} · Izin {rekap.I} · Alpa {rekap.A}
        </p>
        <ol className="divide-y divide-slate-100">
          {item.siswa.map((s, i) => (
            <li key={s.id} className="py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 text-sm">
                  <span className="mr-1 text-slate-400">{i + 1}.</span>
                  <span className="font-medium">{s.nama}</span>
                </p>
                <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`Status ${s.nama}`}>
                  {URUTAN.map((st) => (
                    <button key={st} type="button" disabled={!bisaUbah} role="radio" aria-checked={isian[s.id].status === st}
                      title={LABEL_STATUS_SISWA[st]} onClick={() => ubah(s.id, st)}
                      className={`h-9 w-9 rounded-lg border text-sm font-bold transition ${
                        isian[s.id].status === st ? WARNA[st] : "border-slate-300 bg-white text-slate-500"
                      }`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              {isian[s.id].status !== "H" && (
                <input className="masukan mt-2" placeholder="Keterangan (opsional)" disabled={!bisaUbah}
                  value={isian[s.id].keterangan}
                  onChange={(e) => setIsian((x) => ({ ...x, [s.id]: { ...x[s.id], keterangan: e.target.value } }))} />
              )}
            </li>
          ))}
        </ol>
        {item.siswa.length === 0 && <p className="text-sm text-slate-500">Belum ada siswa di kelas ini.</p>}
      </section>

      <section className="kartu space-y-3">
        <h2 className="font-semibold">Jurnal mengajar</h2>
        <div>
          <label className="label" htmlFor="materi">Materi yang diajarkan *</label>
          <textarea id="materi" className="masukan" rows={2} value={materi} disabled={!bisaUbah}
            onChange={(e) => setMateri(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="kd">KD / tujuan pembelajaran (sesuai program semester)</label>
          <input id="kd" className="masukan" value={kd} disabled={!bisaUbah} onChange={(e) => setKd(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="catatan">Catatan kejadian (opsional)</label>
          <textarea id="catatan" className="masukan" rows={2} value={catatan} disabled={!bisaUbah}
            onChange={(e) => setCatatan(e.target.value)} />
        </div>
      </section>

      {pesan && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${
          pesan.jenis === "ok" ? "bg-utama-50 text-utama-900" : pesan.jenis === "antre" ? "bg-amber-100 text-amber-900" : "bg-red-50 text-red-700"
        }`}>{pesan.teks}</p>
      )}

      {bisaUbah && (!pengganti || bolehPengganti) && pesan?.jenis !== "antre" && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-6xl">
            <button className="tombol w-full" disabled={proses || item.siswa.length === 0}>
              {proses ? "Menyimpan…" : p ? "Simpan perubahan" : "Simpan absen & jurnal"}
            </button>
          </div>
        </div>
      )}
      {pesan?.jenis === "antre" && <Link href="/guru" className="tombol-garis w-full">Kembali ke jadwal</Link>}
    </form>
  );
}
