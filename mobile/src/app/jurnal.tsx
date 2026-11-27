import { useLocalSearchParams } from "expo-router";
import { konfirmasi } from "@/lib/konfirmasi";
import { useRef, useState } from "react";
import { View } from "react-native";
import { minta } from "@/lib/api";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ItemJurnal } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Baris, Kartu, Layar, Lencana, Masukan, Memuat, NavTanggal, Pesan, T, Tombol } from "@/components/ui";

export default function Jurnal() {
  const { pengguna, zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const awal = useLocalSearchParams<{ tanggal?: string }>().tanggal;
  const [tanggal, setTanggal] = useState(awal && awal <= hariIni ? awal : hariIni);
  const { data, galat, memuat, muat } = useMuat<{ jurnal: ItemJurnal[] }>(`/api/m/jurnal?tanggal=${tanggal}`);
  const kunci = useRef(false);
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState("");
  const kepala = pengguna.peran === "KEPALA";

  const belum = data?.jurnal.filter((j) => !j.diperiksa) ?? [];
  return (
    <Layar segarkan={sibuk ? undefined : muat} memuat={memuat}>
      <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={t => { if (!kunci.current) { setTanggal(t); setHasil(""); } }} />
      {memuat && <Memuat />}
      {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
      {data && <T redup>{data.jurnal.length} jurnal, {belum.length} belum diperiksa</T>}
      {hasil && <T>{hasil}</T>}
      {kepala && belum.length > 1 && (
        <Tombol judul={`Tandai semua (${belum.length}) sudah diperiksa`} memuat={sibuk} onPress={async () => {
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
        }} />
      )}
      {data?.jurnal.length === 0 && <Kartu><T redup>Belum ada jurnal pada tanggal ini.</T></Kartu>}
      {data?.jurnal.map((j) => <KartuJurnal key={j.id} j={j} kepala={kepala && !sibuk} setelahUbah={muat} />)}
    </Layar>
  );
}

function KartuJurnal({ j, kepala, setelahUbah }: { j: ItemJurnal; kepala: boolean; setelahUbah: () => void }) {
  const [catatan, setCatatan] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  async function periksa(batal = false) {
    setProses(true);
    setGalat(null);
    try {
      await minta("/api/m/jurnal", { body: { ids: [j.id], catatan: catatan.trim() || null, batal } });
      setelahUbah();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setProses(false);
    }
  }
  return (
    <Kartu>
      <Baris style={{ alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <T redup ukuran={12}>Jam ke-{j.jamMulai}–{j.jamSelesai} · Kelas {j.kelas}</T>
          <T tebal>{j.mapel}</T>
          <T redup>{j.guru}{j.menggantikan ? ` (menggantikan ${j.menggantikan})` : ""}</T>
        </View>
        <Lencana teks={j.diperiksa ? "Diperiksa" : "Belum diperiksa"} jenis={j.diperiksa ? "hijau" : "kuning"} />
      </Baris>
      <T><T redup>Materi: </T>{j.materi}</T>
      {j.kd && <T><T redup>KD/tujuan: </T>{j.kd}</T>}
      {j.catatan && <T><T redup>Catatan: </T>{j.catatan}</T>}
      <T ukuran={13}>H {j.rekap.H} · S {j.rekap.S} · I {j.rekap.I} · A {j.rekap.A}</T>
      {j.tidakHadir.length > 0 && <T redup ukuran={12}>{j.tidakHadir.map((a) => `${a.nama} (${a.status}${a.keterangan ? `: ${a.keterangan}` : ""})`).join(", ")}</T>}
      {j.catatanKepala && <Pesan jenis="info" teks={`Catatan kepala: ${j.catatanKepala}`} />}
      {galat && <Pesan jenis="galat" teks={galat} />}
      {kepala && (j.diperiksa ? (
        <Tombol jenis="teks" judul="Batalkan tanda diperiksa" onPress={() => periksa(true)} memuat={proses} />
      ) : (
        <View style={{ gap: 8, marginTop: 4 }}>
          <Masukan label="Catatan untuk guru (opsional)" value={catatan} onChangeText={setCatatan} />
          <Tombol judul="Sudah diperiksa" onPress={() => periksa()} memuat={proses} />
        </View>
      ))}
    </Kartu>
  );
}
