import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { GalatJaringan, minta } from "@/lib/api";
import { idBaru, kirimAtauAntre } from "@/lib/antrean";
import { cacheHariIni } from "@/lib/hari-ini";
import { konfirmasi } from "@/lib/konfirmasi";
import { simpanJson } from "@/lib/penyimpanan";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_SISWA, type ItemJadwal, type ResponsHariIni, type StatusSiswa } from "@/lib/tipe";
import { tanggalDiZona } from "@/lib/waktu";
import { Baris, Judul, Kartu, Layar, Masukan, Memuat, Pesan, T, Tombol, W, type JenisPesan } from "@/components/ui";

const URUTAN: StatusSiswa[] = ["H", "S", "I", "A"];
const WARNA: Record<StatusSiswa, string> = { H: W.utama, S: "#0284c7", I: "#f59e0b", A: "#dc2626" };

export default function IsiPertemuan() {
  const { jadwalId } = useLocalSearchParams<{ jadwalId: string }>();
  const [muatan, setMuatan] = useState<{ item: ItemJadwal | null; tanggal: string; offline: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await minta<ResponsHariIni>(`/api/m/hari-ini?jadwal=${encodeURIComponent(jadwalId)}`);
        if (r.data.jadwal.some((j) => j.id === jadwalId && j.milikSaya)) await simpanJson("cache_hari_ini", r);
        setMuatan({ item: r.data.jadwal.find((j) => j.id === jadwalId) ?? null, tanggal: r.data.tanggal, offline: false });
      } catch (e) {
        // Offline: pakai jadwal yang tersimpan di HP
        const c = await cacheHariIni();
        setMuatan({ item: c?.data.jadwal.find((j) => j.id === jadwalId) ?? null, tanggal: c?.data.tanggal ?? "", offline: e instanceof GalatJaringan });
      }
    })();
  }, [jadwalId]);

  if (!muatan) return <Memuat />;
  if (!muatan.item) {
    return (
      <Layar>
        <Pesan jenis="galat" teks={muatan.offline ? "Jadwal ini belum tersimpan di HP. Sambungkan internet lalu coba lagi." : "Jadwal tidak ditemukan untuk hari ini."} />
        <Tombol jenis="garis" judul="Kembali" onPress={() => router.back()} />
      </Layar>
    );
  }
  return <Form item={muatan.item} tanggal={muatan.tanggal} offline={muatan.offline} />;
}

function Form({ item, tanggal, offline }: { item: ItemJadwal; tanggal: string; offline: boolean }) {
  const { pengguna, zona } = useSaya();
  const p = item.pertemuan;
  const hariIni = tanggalDiZona(zona);
  const bisaUbah = (!p || (p.guruId === pengguna.id && !p.diperiksa)) && tanggal === hariIni;
  const pengganti = !item.milikSaya;
  const bolehIsi = bisaUbah && pengguna.peran !== "ADMIN";

  const [isian, setIsian] = useState<Record<string, { status: StatusSiswa; keterangan: string }>>(() =>
    Object.fromEntries(item.siswa.map((s) => [s.id, { status: p?.absensi[s.id]?.status ?? "H", keterangan: p?.absensi[s.id]?.keterangan ?? "" }])));
  const [materi, setMateri] = useState(p?.materi ?? "");
  const [kd, setKd] = useState(p?.kd ?? "");
  const [catatan, setCatatan] = useState(p?.catatan ?? "");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: JenisPesan; teks: string } | null>(null);

  const rekap = useMemo(() => {
    const r: Record<StatusSiswa, number> = { H: 0, S: 0, I: 0, A: 0 };
    Object.values(isian).forEach((x) => r[x.status]++);
    return r;
  }, [isian]);

  async function kirim() {
    if (!materi.trim()) { setPesan({ jenis: "galat", teks: "Materi yang diajarkan wajib diisi." }); return; }
    setProses(true);
    setPesan(null);
    const hasil = await kirimAtauAntre("/api/pertemuan", {
      idKlien: idBaru(), jadwalId: item.id, tanggal,
      materi: materi.trim(), kd: kd.trim() || null, catatan: catatan.trim() || null,
      diisiDiPerangkat: new Date().toISOString(),
      absensi: Object.entries(isian).map(([siswaId, x]) => ({ siswaId, status: x.status, keterangan: x.keterangan.trim() || null })),
    }, `${item.mapel.nama} · ${item.kelas.nama} (${tanggal})`);
    setProses(false);
    if (hasil.status === "terkirim") {
      setPesan({ jenis: "ok", teks: "Tersimpan. Terima kasih!" });
      setTimeout(() => router.back(), 700);
    } else if (hasil.status === "diantre") {
      setPesan({ jenis: "antre", teks: "Tidak ada internet. Data disimpan di HP dan akan dikirim otomatis saat internet tersambung." });
    } else {
      setPesan({ jenis: "galat", teks: hasil.pesan });
    }
  }

  async function simpan() {
    if (pengganti && !(await konfirmasi("Guru pengganti", `Anda akan mengisi sebagai guru pengganti untuk ${item.guru.nama}.`))) return;
    await kirim();
  }

  return (
    <Layar>
      <View>
        <Judul>{item.mapel.nama}</Judul>
        <T redup>Kelas {item.kelas.nama} · Jam ke-{item.jamMulai}{item.jamSelesai > item.jamMulai ? `–${item.jamSelesai}` : ""} · {item.waktu}</T>
      </View>
      {offline && <Pesan jenis="antre" teks="Sedang offline. Isian akan disimpan di HP lalu dikirim otomatis." />}
      {pengganti && <Pesan jenis="info" teks={`Jadwal ${item.guru.nama}. Anda mengisi sebagai guru pengganti.`} />}
      {p && <Pesan jenis="ok" teks={`Sudah diisi oleh ${p.namaGuru}${p.pengganti ? " (pengganti)" : ""}.${p.diperiksa ? " Sudah diperiksa kepala madrasah." : bisaUbah ? " Anda masih bisa mengubahnya hari ini." : ""}`} />}

      <Kartu>
        <Baris>
          <Judul kecil>Kehadiran siswa</Judul>
          {bolehIsi && (
            <Pressable onPress={() => setIsian((s) => Object.fromEntries(Object.keys(s).map((k) => [k, { status: "H" as StatusSiswa, keterangan: "" }])))}>
              <T tebal style={{ color: W.utama }} ukuran={14}>Semua hadir</T>
            </Pressable>
          )}
        </Baris>
        <T redup ukuran={13}>Hadir {rekap.H} · Sakit {rekap.S} · Izin {rekap.I} · Alpa {rekap.A}</T>
        {item.siswa.map((s, i) => (
          <View key={s.id} style={{ borderTopWidth: i ? 1 : 0, borderColor: "#f1f5f9", paddingVertical: 8, gap: 6 }}>
            <Baris>
              <T style={{ flex: 1 }} ukuran={14}><Text style={{ color: "#94a3b8" }}>{i + 1}. </Text>{s.nama}</T>
              <View style={{ flexDirection: "row", gap: 4 }} accessibilityRole="radiogroup">
                {URUTAN.map((st) => {
                  const pilih = isian[s.id].status === st;
                  return (
                    <Pressable key={st} disabled={!bolehIsi} accessibilityRole="radio" accessibilityState={{ checked: pilih }}
                      accessibilityLabel={`${s.nama} ${LABEL_STATUS_SISWA[st]}`}
                      onPress={() => setIsian((x) => ({ ...x, [s.id]: { status: st, keterangan: st === "H" ? "" : x[s.id].keterangan } }))}
                      style={{ width: 38, height: 38, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center",
                        borderColor: pilih ? WARNA[st] : "#cbd5e1", backgroundColor: pilih ? WARNA[st] : W.putih }}>
                      <Text style={{ fontWeight: "800", color: pilih ? W.putih : W.redup }}>{st}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Baris>
            {isian[s.id].status !== "H" && (
              <Masukan label={`Keterangan ${s.nama}`} sembunyikanLabel placeholder="Keterangan (opsional)" editable={bolehIsi} value={isian[s.id].keterangan}
                onChangeText={(v) => setIsian((x) => ({ ...x, [s.id]: { ...x[s.id], keterangan: v } }))} />
            )}
          </View>
        ))}
        {item.siswa.length === 0 && <T redup>Belum ada siswa di kelas ini.</T>}
      </Kartu>

      <Kartu style={{ gap: 12 }}>
        <Judul kecil>Jurnal mengajar</Judul>
        <Masukan label="Materi yang diajarkan *" value={materi} onChangeText={setMateri} editable={bolehIsi} multiline />
        <Masukan label="KD / tujuan pembelajaran" value={kd} onChangeText={setKd} editable={bolehIsi} />
        <Masukan label="Catatan kejadian (opsional)" value={catatan} onChangeText={setCatatan} editable={bolehIsi} multiline />
      </Kartu>

      {pesan && <Pesan jenis={pesan.jenis} teks={pesan.teks} />}
      {bolehIsi && pesan?.jenis !== "antre" && pesan?.jenis !== "ok" && (
        <Tombol judul={proses ? "Menyimpan…" : p ? "Simpan perubahan" : "Simpan absen & jurnal"} onPress={() => void simpan()} memuat={proses} nonaktif={item.siswa.length === 0} />
      )}
      {pesan?.jenis === "antre" && <Tombol jenis="garis" judul="Kembali ke jadwal" onPress={() => router.back()} />}
    </Layar>
  );
}
