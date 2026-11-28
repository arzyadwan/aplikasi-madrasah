import Ionicons from "@expo/vector-icons/Ionicons";
import { Avatar, Hero } from "@/components/v2";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { konfirmasi } from "@/lib/konfirmasi";
import { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { minta } from "@/lib/api";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ItemJurnal } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Baris, Kartu, Daftar, Lencana, Masukan, Memuat, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

type IsianPeriksa = { buka?: boolean; catatan?: string; proses?: boolean; galat?: string | null };

export default function Jurnal() {
  const { pengguna, zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const awal = useLocalSearchParams<{ tanggal?: string }>().tanggal;
  const [pilihTanggal, setPilihTanggal] = useState(false);
  const [tanggal, setTanggal] = useState(awal && awal <= hariIni ? awal : hariIni);
  const { data, galat, memuat, muat } = useMuat<{ jurnal: ItemJurnal[] }>(`/api/m/jurnal?tanggal=${tanggal}`);
  const kunci = useRef(false);
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState("");
  const kepala = pengguna.peran === "KEPALA";

  const [isian, setIsian] = useState<Record<string, IsianPeriksa>>({});
  function ubah(id: string, nilai: IsianPeriksa) {
    setIsian(lama => ({ ...lama, [id]: { ...lama[id], ...nilai } }));
  }

  const belum = data?.jurnal.filter((j) => !j.diperiksa) ?? [];
  const { bottom } = useSafeAreaInsets();
  const [sudah, setSudah] = useState(false);
  const diperiksa = data?.jurnal.filter(j => j.diperiksa) ?? [];
  async function tandaiSemua() {
    if (kunci.current) return;
    kunci.current = true;
    setSibuk(true);
    let berhasil = 0;
    try {
      if (!await konfirmasi("Tandai semua", `Tandai ${belum.length} jurnal tanggal ${formatTanggal(tanggal)} sudah diperiksa?`)) return;
      for (let i = 0; i < belum.length; i += 200) {
        const ids = belum.slice(i, i + 200).map(j => j.id);
        await minta("/api/m/jurnal", { body: { ids } });
        berhasil += ids.length;
      }
      setHasil(`${berhasil} jurnal sudah diperiksa.`);
      muat();
    } catch (e) {
      setHasil(`${berhasil} dikonfirmasi. ${e instanceof Error ? e.message : "Gagal menyimpan."} Coba lagi.`);
      muat();
    } finally { kunci.current = false; setSibuk(false); }
  }
  return (
    <View style={{ flex: 1, backgroundColor: W.latar }}>
    <Daftar data={sudah ? diperiksa : belum} refreshing={memuat} onRefresh={sibuk ? undefined : muat}
      renderItem={({ item: j }) => <KartuJurnal key={j.id} j={j} kepala={kepala && !sibuk} setelahUbah={muat} isian={isian[j.id]} ubah={nilai => ubah(j.id, nilai)} />}>
      <Hero style={{ marginHorizontal: -16, marginTop: -16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={"Pilih tanggal, " + formatTanggal(tanggal)}
          accessibilityState={{ expanded: pilihTanggal }} onPress={() => setPilihTanggal(!pilihTanggal)}
          style={{ minHeight: 48, alignSelf: "flex-start", flexDirection: "row", gap: 8, alignItems: "center" }}>
          <T tebal ukuran={16} style={{ color: W.putih }}>{formatTanggal(tanggal)}</T><Ionicons name="chevron-down" size={18} color={W.putih} />
        </Pressable>
        {data && <><T style={{ color: W.putih }}>{diperiksa.length} dari {data.jurnal.length} diperiksa</T>
          <View style={{ height: 8, borderRadius: 8, backgroundColor: "#1B7258" }}>
            <View style={{ height: 8, borderRadius: 8, backgroundColor: W.emas, width: `${100 * diperiksa.length / (data.jurnal.length || 1)}%` }} />
          </View></>}
      </Hero>
      {pilihTanggal && <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={t => { if (!kunci.current) { setTanggal(t); setHasil(""); } }} />}
      {memuat && <Memuat />}
      {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
      {data && <Baris>{[false, true].map(status => <Pressable key={String(status)} accessibilityRole="button" accessibilityState={{ selected: sudah === status }} onPress={() => setSudah(status)}
        style={{ minHeight: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: sudah === status ? W.teks : W.putih, borderRadius: 24 }}>
        <T tebal style={{ color: sudah === status ? W.putih : W.teks }}>{status ? "Sudah " + diperiksa.length : "Belum " + belum.length}</T>
      </Pressable>)}</Baris>}
      {hasil && <T>{hasil}</T>}
      {data && !(sudah ? diperiksa : belum).length && <Kartu><T redup>{data.jurnal.length ? "Tidak ada jurnal dalam kategori ini." : "Belum ada jurnal pada tanggal ini."}</T></Kartu>}

    </Daftar>
    {kepala && belum.length > 0 && <View style={{ backgroundColor: W.teks, padding: 12, marginHorizontal: 12, marginBottom: bottom + 8, borderRadius: 20, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      <T tebal style={{ color: W.putih, flex: 1 }}>{belum.length} jurnal belum diperiksa</T>
      <Pressable accessibilityRole="button" disabled={sibuk} accessibilityState={{ disabled: sibuk, busy: sibuk }} onPress={tandaiSemua}
        style={{ backgroundColor: W.emas, borderRadius: 14, minHeight: 48, justifyContent: "center", paddingHorizontal: 14 }}>
        <T tebal>{sibuk ? "Memproses…" : "Tandai semua"}</T>
      </Pressable>
    </View>}
    </View>
  );
}

function KartuJurnal({ j, kepala, setelahUbah, isian, ubah }: {
  j: ItemJurnal; kepala: boolean; setelahUbah: () => void; isian?: IsianPeriksa; ubah: (nilai: IsianPeriksa) => void;
}) {
  const { catatan = "", proses, galat } = isian ?? {};
  async function periksa(batal = false) {
    ubah({ proses: true, galat: null });
    try {
      await minta("/api/m/jurnal", { body: { ids: [j.id], catatan: catatan.trim() || null, batal } });
      setelahUbah();
    } catch (e) {
      ubah({ galat: e instanceof Error ? e.message : "Gagal menyimpan." });
    } finally {
      ubah({ proses: false });
    }
  }
  return (
    <Kartu>
      <Baris style={{ alignItems: "flex-start" }}>
        <Avatar nama={j.guru} size={36} />
        <View style={{ flex: 1, gap: 2 }}>
          <T tebal numberOfLines={2}>{j.guru} · {j.mapel}</T>
          <T redup ukuran={12}>Kelas {j.kelas} · Jam {j.jamMulai}–{j.jamSelesai}</T>
          {j.menggantikan && <T redup ukuran={12} style={{ color: W.kuning }}>Pengganti untuk {j.menggantikan}</T>}
        </View>
      </Baris>
      <T><T redup>Materi: </T>{j.materi}</T>
      {j.kd && <T><T redup>KD/tujuan: </T>{j.kd}</T>}
      {j.catatan && <T><T redup>Catatan: </T>{j.catatan}</T>}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <Lencana teks={j.diperiksa ? "Diperiksa" : "Belum diperiksa"} jenis={j.diperiksa ? "hijau" : "kuning"} />
        <Lencana teks={j.rekap.H + " hadir"} jenis="hijau" />
        {j.rekap.S > 0 && <Lencana teks={j.rekap.S + " sakit"} jenis="biru" />}
        {j.rekap.I > 0 && <Lencana teks={j.rekap.I + " izin"} jenis="kuning" />}
        {j.rekap.A > 0 && <Lencana teks={j.rekap.A + " alpa"} jenis="merah" />}
      </View>
      {j.tidakHadir.length > 0 && <T redup ukuran={12}>{j.tidakHadir.map((a) => `${a.nama} (${a.status}${a.keterangan ? `: ${a.keterangan}` : ""})`).join(", ")}</T>}
      {j.catatanKepala && <Pesan jenis="info" teks={`Catatan kepala: ${j.catatanKepala}`} />}
      {galat && <Pesan jenis="galat" teks={galat} />}
      {kepala && (j.diperiksa ? (
        <Tombol jenis="teks" judul="Batalkan tanda diperiksa" onPress={() => periksa(true)} memuat={proses} />
      ) : (
        <View style={{ gap: 8, marginTop: 4 }}>
          {isian?.buka && <Masukan label="Catatan untuk guru (opsional)" value={catatan} onChangeText={catatan => ubah({ catatan })} />}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <View style={{ flex: 1, minWidth: 112 }}><Tombol jenis="garis" judul={isian?.buka ? "Tutup catatan" : "Beri catatan"} onPress={() => ubah({ buka: !isian?.buka })} /></View>
            <View style={{ flex: 1, minWidth: 120 }}><Tombol judul="Tandai diperiksa" onPress={() => periksa()} memuat={proses} /></View>
          </View>
        </View>
      ))}
    </Kartu>
  );
}
