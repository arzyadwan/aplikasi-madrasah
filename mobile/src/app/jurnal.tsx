import Ionicons from "@expo/vector-icons/Ionicons";
import { Avatar, getar, HeroSub, Kerangka, LatarStatus, Segmen } from "@/components/v2";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { konfirmasi } from "@/lib/konfirmasi";
import { useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { minta } from "@/lib/api";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ItemJurnal } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Daftar, Masukan, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

type Saring = "belum" | "sudah";
const LABEL_STATUS = { H: "hadir", S: "sakit", I: "izin", A: "alpa" } as const;

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
  const [saring, setSaring] = useState<Saring>("belum");
  const [dibuka, setDibuka] = useState<string | null>(null);
  const kepala = pengguna.peran === "KEPALA";
  const { bottom } = useSafeAreaInsets();

  const semua = data?.jurnal ?? [];
  const belum = semua.filter(j => !j.diperiksa);
  const diperiksa = semua.filter(j => j.diperiksa);
  const daftar = saring === "sudah" ? diperiksa : belum;
  const terbuka = semua.find(j => j.id === dibuka) ?? null;

  async function periksa(id: string, catatan: string | null = null, batal = false) {
    await minta("/api/m/jurnal", { body: { ids: [id], catatan, batal } });
    getar("sukses");
    muat();
  }

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
      getar("sukses");
      setHasil(`${berhasil} jurnal sudah diperiksa.`);
      muat();
    } catch (e) {
      setHasil(`${berhasil} dikonfirmasi. ${e instanceof Error ? e.message : "Gagal menyimpan."} Coba lagi.`);
      muat();
    } finally { kunci.current = false; setSibuk(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: W.latar }}>
      <Daftar data={daftar} refreshing={memuat} onRefresh={sibuk ? undefined : muat}
        contentContainerStyle={{ gap: 0 }}
        renderItem={({ item: j, index }) => <BarisJurnal j={j} awal={index === 0} akhir={index === daftar.length - 1}
          bisaGeser={kepala && !sibuk && !j.diperiksa} onBuka={() => setDibuka(j.id)}
          onGeser={() => periksa(j.id).catch(e => setHasil(e instanceof Error ? e.message : "Gagal menyimpan."))} />}>
        <HeroSub judul="Periksa jurnal" sub={formatTanggal(tanggal)}
          kanan={<Pressable accessibilityRole="button" accessibilityLabel={"Ganti tanggal, " + formatTanggal(tanggal)}
            accessibilityState={{ expanded: pilihTanggal }} onPress={() => setPilihTanggal(!pilihTanggal)} style={s.ganti}>
            <Ionicons name="calendar-outline" size={16} color={W.putih} /><T tebal ukuran={12} style={{ color: W.putih }}>Ganti</T>
          </Pressable>}>
          {data && <View accessible accessibilityLabel={`${diperiksa.length} dari ${semua.length} jurnal sudah diperiksa`} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={s.jalur}><View style={{ height: 8, backgroundColor: W.emas, width: `${100 * diperiksa.length / (semua.length || 1)}%` }} /></View>
            <T tebal ukuran={12} style={{ color: W.putih }}>{diperiksa.length} dari {semua.length} diperiksa</T>
          </View>}
        </HeroSub>
        <View style={{ gap: 10, paddingTop: 12, paddingBottom: 8 }}>
          {pilihTanggal && <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={t => { if (!kunci.current) { setTanggal(t); setHasil(""); } }} />}
          {data && <Segmen<Saring> nilai={saring} onUbah={setSaring} pilihan={[
            { kunci: "belum", label: `Belum ${belum.length}` }, { kunci: "sudah", label: `Sudah ${diperiksa.length}` },
          ]} />}
          {data && kepala && saring === "belum" && belum.length > 0 && <T redup ukuran={12}>Ketuk untuk rincian · geser ke kanan untuk menandai diperiksa</T>}
          {!!hasil && <Pesan jenis="info" teks={hasil} />}
          {memuat && !data && <Kerangka baris={4} />}
          {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
          {data && !daftar.length && <View style={s.kosong}><T redup>{semua.length ? "Tidak ada jurnal dalam kategori ini." : "Belum ada jurnal pada tanggal ini."}</T></View>}
        </View>
      </Daftar>
      {kepala && belum.length > 0 && <View style={[s.bilah, { marginBottom: bottom + 8 }]}>
        <T tebal style={{ color: W.putih, flex: 1 }}>{belum.length} jurnal belum diperiksa</T>
        <Pressable accessibilityRole="button" disabled={sibuk} accessibilityState={{ disabled: sibuk, busy: sibuk }} onPress={tandaiSemua} style={s.tombolEmas}>
          <T tebal style={{ color: "#3D2600" }}>{sibuk ? "Memproses…" : "Tandai semua"}</T>
        </Pressable>
      </View>}
      <LatarStatus />
      <SheetJurnal j={terbuka} kepala={kepala && !sibuk} onTutup={() => setDibuka(null)}
        onPeriksa={async (catatan, batal) => { await periksa(terbuka!.id, catatan, batal); setDibuka(null); }} />
    </View>
  );
}

/** Satu baris jurnal. Kepala bisa menggeser ke kanan untuk menandai diperiksa. */
function BarisJurnal({ j, awal, akhir, bisaGeser, onBuka, onGeser }: {
  j: ItemJurnal; awal: boolean; akhir: boolean; bisaGeser: boolean; onBuka: () => void; onGeser: () => void;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const AMBANG = 110;
  const terkini = useRef({ bisaGeser, onGeser });
  terkini.current = { bisaGeser, onGeser };
  const geser = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => terkini.current.bisaGeser && g.dx > 12 && Math.abs(g.dy) < 10,
    onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(g.dx, 160))),
    onPanResponderRelease: (_, g) => {
      if (g.dx > AMBANG) { Animated.timing(x, { toValue: 400, duration: 160, useNativeDriver: true }).start(() => { terkini.current.onGeser(); setTimeout(() => x.setValue(0), 1500); }); }
      else Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  })).current;
  const sudut = [awal && s.awal, akhir && s.akhir];
  const tidakHadir = j.rekap.S + j.rekap.I + j.rekap.A;
  return <View style={[s.latarGeser, ...sudut, !akhir && { marginBottom: 1 }]}>
    {bisaGeser && <View style={s.ikonGeser}><Ionicons name="checkmark-circle" size={22} color={W.putih} /><T tebal ukuran={12} style={{ color: W.putih }}>Diperiksa</T></View>}
    <Animated.View {...geser.panHandlers} style={{ transform: [{ translateX: x }] }}>
      <Pressable accessibilityRole="button"
        accessibilityLabel={`${j.guru}, ${j.mapel}, kelas ${j.kelas}, jam ${j.jamMulai} sampai ${j.jamSelesai}. Materi ${j.materi}. ${j.diperiksa ? "Sudah diperiksa" : "Belum diperiksa"}`}
        accessibilityHint="Buka rincian jurnal"
        accessibilityActions={bisaGeser ? [{ name: "periksa", label: "Tandai diperiksa" }] : undefined}
        onAccessibilityAction={e => { if (e.nativeEvent.actionName === "periksa") onGeser(); }}
        onPress={onBuka} style={({ pressed }) => [s.baris, ...sudut, pressed && { backgroundColor: "#F7FAF8" }]}>
        <Avatar nama={j.guru} size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T numberOfLines={1} tebal>{j.guru.split(",")[0]} · {j.mapel}</T>
          <T numberOfLines={1} ukuran={12} redup>{j.kelas} · {j.materi}</T>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <T ukuran={11} redup>Jam {j.jamMulai}–{j.jamSelesai}</T>
          {j.menggantikan ? <T tebal ukuran={11} style={{ color: W.kuning }}>pengganti</T>
            : tidakHadir > 0 ? <T tebal ukuran={11} style={{ color: W.biru }}>{tidakHadir} tidak hadir</T> : null}
        </View>
      </Pressable>
    </Animated.View>
  </View>;
}

/** Sheet bawah berisi rincian jurnal dan aksi pemeriksaan. */
function SheetJurnal({ j, kepala, onTutup, onPeriksa }: {
  j: ItemJurnal | null; kepala: boolean; onTutup: () => void; onPeriksa: (catatan: string | null, batal: boolean) => Promise<void>;
}) {
  const { bottom } = useSafeAreaInsets();
  const [catatan, setCatatan] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  async function kirim(batal: boolean) {
    setProses(true); setGalat(null);
    try { await onPeriksa(catatan.trim() || null, batal); setCatatan(""); }
    catch (e) { setGalat(e instanceof Error ? e.message : "Gagal menyimpan."); }
    finally { setProses(false); }
  }
  const tutup = () => { setCatatan(""); setGalat(null); onTutup(); };
  return <Modal visible={!!j} transparent animationType="slide" onRequestClose={tutup} statusBarTranslucent>
    <Pressable accessibilityLabel="Tutup rincian" style={s.redup} onPress={tutup} />
    {j && <View style={[s.sheet, { paddingBottom: bottom + 16 }]}>
      <View style={s.pegangan} />
      <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar nama={j.guru} size={44} />
          <View style={{ flex: 1 }}>
            <T tebal ukuran={16}>{j.guru}</T>
            <T redup ukuran={12}>{j.mapel} · {j.kelas} · Jam {j.jamMulai}–{j.jamSelesai}</T>
            {j.menggantikan && <T ukuran={12} style={{ color: W.kuning }}>Pengganti untuk {j.menggantikan}</T>}
          </View>
        </View>
        <View style={s.kotakMateri}>
          <T tebal ukuran={11} redup>Materi</T>
          <T tebal ukuran={15}>{j.materi}</T>
          {!!j.kd && <T redup ukuran={12}>KD: {j.kd}</T>}
          {!!j.catatan && <T redup ukuran={12}>Catatan guru: {j.catatan}</T>}
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {([["H", "Hadir", W.utamaMuda, W.hadir], ["S", "Sakit", W.biruMuda, W.biru], ["I", "Izin", W.kuningMuda, W.kuning], ["A", "Alpa", "#F2F5F3", W.redup]] as const).map(([k, label, bg, fg]) =>
            <View key={k} accessible accessibilityLabel={`${j.rekap[k]} ${label}`} style={[s.rekap, { backgroundColor: bg }]}>
              <T tebal ukuran={17} style={{ color: fg }}>{j.rekap[k]}</T><T tebal ukuran={11} style={{ color: fg }}>{label}</T>
            </View>)}
        </View>
        {j.tidakHadir.length > 0 && <T redup ukuran={12}>Tidak hadir: {j.tidakHadir.map(a => `${a.nama} (${LABEL_STATUS[a.status]}${a.keterangan ? `: ${a.keterangan}` : ""})`).join(", ")}</T>}
        {!!j.catatanKepala && <Pesan jenis="info" teks={`Catatan kepala: ${j.catatanKepala}`} />}
        {kepala && !j.diperiksa && <Masukan label="Catatan untuk guru (opsional)" value={catatan} onChangeText={setCatatan} />}
        {galat && <Pesan jenis="galat" teks={galat} />}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}><Tombol jenis="garis" judul="Tutup" onPress={tutup} /></View>
          {kepala && <View style={{ flex: 2 }}>{j.diperiksa
            ? <Tombol jenis="garis" judul="Batalkan tanda" onPress={() => kirim(true)} memuat={proses} />
            : <Tombol judul="Tandai diperiksa" onPress={() => kirim(false)} memuat={proses} />}</View>}
        </View>
      </ScrollView>
    </View>}
  </Modal>;
}

const s = StyleSheet.create({
  ganti: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#1B7258" },
  jalur: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#1B7258", overflow: "hidden" },
  kosong: { backgroundColor: W.putih, borderRadius: 18, padding: 16 },
  latarGeser: { backgroundColor: W.hadir, overflow: "hidden" },
  ikonGeser: { position: "absolute", left: 16, top: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  baris: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: W.putih },
  awal: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  akhir: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  bilah: { backgroundColor: W.teks, padding: 10, paddingLeft: 16, marginHorizontal: 12, borderRadius: 20, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8,
    elevation: 8, shadowColor: "#12211C", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  tombolEmas: { backgroundColor: W.emas, borderRadius: 14, minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  redup: { flex: 1, backgroundColor: "rgba(18,33,28,0.4)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "88%", backgroundColor: W.putih, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  pegangan: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#D5E1DC" },
  kotakMateri: { backgroundColor: W.latar, borderRadius: 16, padding: 12, gap: 4 },
  rekap: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: "center" },
});
