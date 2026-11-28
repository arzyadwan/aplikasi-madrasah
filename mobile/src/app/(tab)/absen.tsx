import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Hero } from "@/components/v2";
import { Sukses } from "@/components/ilustrasi";
import { namaPanggilan } from "@/lib/nama";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { idBaru, kirimAtauAntre, useAntrean, useBuktiAbsen, type ItemAntrean } from "@/lib/antrean";
import { useHariIni } from "@/lib/hari-ini";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_GURU, type StatusGuru } from "@/lib/tipe";
import { formatTanggal, jamDiZona, jarakMeter, tanggalDiZona } from "@/lib/waktu";
import { FotoAman } from "@/components/foto-aman";
import { huruf, Kartu, Lencana, Layar, Masukan, Memuat, Pesan, T, Tombol, W, type JenisPesan } from "@/components/ui";

type Lokasi = { lat: number; lng: number; akurasi: number };

/** Perkecil foto selfie menjadi JPEG kecil (±50–120 KB) agar hemat kuota */
async function siapkanFoto(uri: string): Promise<string> {
  const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
  ctx.resize({ width: 640 });
  const gambar = await ctx.renderAsync();
  const hasil = await gambar.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.6, base64: true });
  return `data:image/jpeg;base64,${hasil.base64}`;
}

function jarakTeks(meter: number) {
  return meter >= 1000 ? (meter / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " km" : meter + " m";
}

export default function AbsenSaya() {
  const { zona, pengguna } = useSaya();
  const { data, memuat, muat } = useHariIni();
  const { antreanId } = useLocalSearchParams<{ antreanId?: string }>();
  const antrean = useAntrean();
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));
  const tanggal = tanggalDiZona(zona);
  const bukti = useBuktiAbsen();
  useEffect(() => { if (bukti === tanggal) muat(); }, [bukti, tanggal, muat]);
  const lokal = antrean.find(x => x.id === antreanId && x.path === "/api/absen-guru" && x.body.tanggal === tanggal) ?? [...antrean].reverse().find((x) => x.path === "/api/absen-guru" && x.body.tanggal === tanggal);

  if (!lokal && bukti !== tanggal && !data && memuat) return <Memuat />;
  const a = data?.data.tanggal === tanggal ? data.absenSaya : null;

  const tercatat = a && !(lokal?.galat && lokal.id === antreanId);
  const bukaForm = !tercatat && bukti !== tanggal && (!lokal || !!lokal.galat) && (!!lokal?.galat || data?.data.tanggal === tanggal);
  const kepala = <View>
    <T ukuran={13} style={{ color: "#BFE0D3" }}>{formatTanggal(tanggal)} · {jamDiZona(zona, new Date())}</T>
    <Text accessibilityRole="header" style={[g.judul, huruf(700)]}>Absen pagi</Text>
  </View>;

  if (bukaForm) return <FormAbsen key={lokal?.id ?? tanggal} lokal={lokal} tanggal={tanggal}
    kepala={kepala} memuat={memuat} onSelesai={muat} />;

  if (a && tercatat) return <ScrollView style={{ backgroundColor: W.putih }} contentContainerStyle={g.sukses}
    refreshControl={<RefreshControl refreshing={memuat} onRefresh={muat} colors={[W.utama]} />}>
    <View style={{ flexGrow: 1 }} /><Sukses width={200} height={172} />
    <T tebal ukuran={22} style={g.teksTengah}>Absen tercatat!</T>
    <T redup style={g.teksTengah}>Terima kasih, {namaPanggilan(pengguna.nama)}.</T>
    <View style={g.rincian}>
      <BarisRincian label="Status" nilai={LABEL_STATUS_GURU[a.status]} />
      <BarisRincian label="Jam tercatat" nilai={jamDiZona(zona, a.waktuMasuk)} />
      {a.dalamRadius != null && <BarisRincian label="Lokasi" nilai={a.dalamRadius ? "Di area madrasah" : "Di luar area madrasah"} />}
      {a.jarakMeter != null && <BarisRincian label="Jarak" nilai={jarakTeks(a.jarakMeter)} />}
      {!!a.keterangan && <BarisRincian label="Keterangan" nilai={a.keterangan} />}
    </View>
    {a.adaFoto && (
      <FotoAman absenId={a.id} label="Foto absen" style={{ width: 140, height: 180, borderRadius: 10, marginTop: 6 }} />
    )}
    <View style={{ alignSelf: "stretch", marginTop: "auto" }}>
      <Tombol judul="Lihat jadwal hari ini" onPress={() => router.navigate("/")} />
    </View>
  </ScrollView>;

  return (
    <Layar segarkan={muat} memuat={memuat}>
      <Hero style={g.hero}>{kepala}</Hero>
      {bukti === tanggal ? <Pesan jenis="ok" teks="Terkirim. Menunggu pembaruan status server." /> : lokal && !lokal.galat ? (
        <Pesan jenis="antre" teks="Tersimpan di HP, menunggu dikirim." />
      ) : (
        <><Pesan jenis="info" teks="Status belum dapat diperiksa." /><Tombol judul="Coba lagi" onPress={muat} /></>
      )}
    </Layar>
  );
}

function BarisRincian({ label, nilai }: { label: string; nilai: string }) {
  return <View style={[g.baris, { justifyContent: "space-between" }]}><T redup>{label}</T><T tebal>{nilai}</T></View>;
}

function FormAbsen({ tanggal, onSelesai, lokal, kepala, memuat }: { kepala: React.ReactNode; memuat: boolean; lokal?: ItemAntrean; tanggal: string; onSelesai: () => void }) {
  const { madrasah, zona } = useSaya();
  const [status, setStatus] = useState<StatusGuru>((lokal?.body.status as StatusGuru) ?? "HADIR");
  const [lokasi, setLokasi] = useState<Lokasi | null>(() => typeof lokal?.body.lat === "number" && typeof lokal.body.lng === "number" ? { lat: lokal.body.lat, lng: lokal.body.lng, akurasi: Number(lokal.body.akurasi) } : null);
  const [galatLokasi, setGalatLokasi] = useState<string | null>(null);
  const [petunjukIzin, setPetunjukIzin] = useState<string | null>(null);
  const [mencari, setMencari] = useState(false);
  const [foto, setFoto] = useState<string | null>(lokal?.body.foto as string ?? null);
  const [keterangan, setKeterangan] = useState(String(lokal?.body.keterangan ?? ""));
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: JenisPesan; teks: string } | null>(null);

  // Android bisa menutup aplikasi saat kamera terbuka: ambil foto yang tertunda
  useEffect(() => {
    if (Platform.OS !== "android") return;
    ImagePicker.getPendingResultAsync().then(async (r) => {
      if (r && "assets" in r && !r.canceled && r.assets?.[0]) setFoto(await siapkanFoto(r.assets[0].uri));
    }).catch(() => {});
  }, []);

  const [percobaan, setPercobaan] = useState(0);
  useEffect(() => {
    if (status !== "HADIR" || (!percobaan && lokal?.body.lat != null)) return;
    let aktif = true;
    let batas: ReturnType<typeof setTimeout> | undefined;
    setLokasi(null);
    setMencari(true);
    setGalatLokasi(null);
    setPetunjukIzin(null);
    async function cari() {
      try {
        const izin = percobaan ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
        if (!aktif) return;
        if (!izin.granted) {
          setPetunjukIzin(izin.canAskAgain
            ? "ketuk Ambil lokasi lalu izinkan akses lokasi"
            : "aktifkan izin lokasi aplikasi di pengaturan HP, lalu ketuk Ambil lokasi");
          return;
        }
        batas = setTimeout(() => {
          aktif = false;
          setMencari(false);
          setGalatLokasi("Lokasi belum ditemukan dalam 20 detik. Pastikan GPS aktif lalu coba lagi.");
        }, 20000);
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (aktif) setLokasi({ lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy ?? 0) });
      } catch {
        if (aktif) setGalatLokasi("Lokasi belum didapat. Pastikan GPS aktif lalu coba lagi.");
      } finally {
        clearTimeout(batas);
        if (aktif) setMencari(false);
      }
    }
    void cari();
    return () => { aktif = false; clearTimeout(batas); };
  }, [status, percobaan, lokal]);

  async function ambilFoto() {
    try {
      const izin = await ImagePicker.requestCameraPermissionsAsync();
      if (!izin.granted) {
        setPesan({ jenis: "galat", teks: "Izin kamera ditolak. Aktifkan izin kamera di pengaturan HP." });
        if (Platform.OS !== "web") void Linking.openSettings();
        return;
      }
      const r = await ImagePicker.launchCameraAsync({ mediaTypes: "images", cameraType: ImagePicker.CameraType.front, quality: 0.7 });
      if (!r.canceled && r.assets[0]) setFoto(await siapkanFoto(r.assets[0].uri));
    } catch {
      setPesan({ jenis: "galat", teks: "Kamera tidak bisa dibuka." });
    }
  }

  const kunci = useRef(false);
  async function kirim() {
    setPesan(null);
    if (status === "HADIR" && !lokasi) { setPesan({ jenis: "galat", teks: "Ambil lokasi GPS dulu." }); return; }
    if (status === "HADIR" && !foto) { setPesan({ jenis: "galat", teks: "Ambil foto selfie dulu." }); return; }
    if (status !== "HADIR" && !keterangan.trim()) { setPesan({ jenis: "galat", teks: "Isi keterangan." }); return; }
    if (kunci.current) return;
    if (tanggal !== tanggalDiZona(zona)) { setPesan({ jenis: "galat", teks: "Tanggal sudah berganti." }); return; }
    kunci.current = true;
    setProses(true);
    try {
      const hadir = status === "HADIR";
      const hasil = await kirimAtauAntre("/api/absen-guru", {
        idKlien: idBaru(), tanggal, status,
        lat: hadir ? lokasi?.lat : null, lng: hadir ? lokasi?.lng : null, akurasi: hadir ? lokasi?.akurasi : null,
        foto: hadir ? foto : null, keterangan: keterangan.trim() || null,
        diisiDiPerangkat: new Date().toISOString(),
      }, `Absen saya (${tanggal})`, lokal?.id);

      if (hasil.status === "terkirim") { setPesan({ jenis: "ok", teks: "Absen tercatat." }); onSelesai(); }
      else if (hasil.status === "diantre") setPesan({ jenis: "antre", teks: "Tersimpan di HP, menunggu dikirim." });
      else setPesan({ jenis: "galat", teks: hasil.pesan });
    } catch { setPesan({ jenis: "galat", teks: "Gagal menyimpan di HP. Coba lagi." }); }
    finally { kunci.current = false; setProses(false); }
  }

  const jarak = lokasi && madrasah.lat != null && madrasah.lng != null ? jarakMeter(lokasi.lat, lokasi.lng, madrasah.lat, madrasah.lng) : null;

  const diLuar = jarak != null && jarak > madrasah.radiusMeter;

  return <View style={{ flex: 1, backgroundColor: W.latar }}>
    <Layar segarkan={onSelesai} memuat={memuat}>
      <Hero style={[g.hero, { paddingBottom: 64 }]}>{kepala}
        <View style={g.segmen} accessibilityRole="radiogroup" accessibilityLabel="Status kehadiran">
          {(Object.keys(LABEL_STATUS_GURU) as StatusGuru[]).map(s => (
            <Pressable key={s} accessibilityRole="radio" accessibilityState={{ checked: status === s }}
              accessibilityLabel={LABEL_STATUS_GURU[s]} onPress={() => { if (s !== status) { setPercobaan(0); setStatus(s); } }}
              style={[g.opsi, status === s && g.terpilih]}>
              <T ringkas tebal ukuran={14} style={{ color: status === s ? W.utama : "#CFE8DD" }}>{s === "DINAS" ? "Dinas" : LABEL_STATUS_GURU[s]}</T>
            </Pressable>
          ))}
        </View>
      </Hero>
      <View style={{ marginTop: -54, gap: 12 }}>
        {lokal?.galat && <Pesan jenis="galat" teks={`Perlu diperbaiki. ${lokal.galat}`} />}
        {status === "HADIR" ? <>
          <Kartu style={g.kartu}>
            {madrasah.lat != null && madrasah.lng != null && <AreaAbsen nama={madrasah.nama} lokasi={lokasi} lat={madrasah.lat} lng={madrasah.lng} jarak={jarak} radius={madrasah.radiusMeter} />}
            <View style={g.baris}>
              <View style={{ flex: 1, gap: 3 }}>
                <T tebal ukuran={16}>{mencari ? "Mencari lokasi…" : jarak != null ? diLuar ? "Di luar area madrasah" : "Di area madrasah" : lokasi ? "Lokasi ditemukan" : "Lokasi GPS"}</T>
                <T redup ukuran={13}>{jarak != null ? `${jarakTeks(jarak)} dari titik` :
                  lokasi ? "Titik madrasah belum diatur" : petunjukIzin ?? "Periksa posisi terhadap area madrasah"}</T>
              </View>
              {lokasi && lokasi.akurasi > 0 && <Lencana jenis="hijau" teks={`±${lokasi.akurasi} m`} />}
            </View>

            {galatLokasi && <Pesan jenis="galat" teks={galatLokasi} />}
            <Tombol jenis="garis" judul={mencari ? "Mencari lokasi…" : galatLokasi ? "Coba lokasi lagi" : lokasi ? "Perbarui lokasi" : "Ambil lokasi"} onPress={() => setPercobaan(n => n + 1)} memuat={mencari} />
          </Kartu>
          <Kartu style={g.baris}>
            <Pressable accessibilityRole="button" accessibilityLabel={foto ? "Ambil ulang foto selfie" : "Buka kamera depan"}
              style={g.selfie} onPress={ambilFoto}>
              {foto ? <Image source={{ uri: foto }} style={{ width: "100%", height: "100%", borderRadius: 44 }} /> : <Ionicons name="camera-outline" color={W.kuning} size={34} />}
              <View style={g.tambah}><Ionicons name={foto ? "refresh" : "add"} size={18} color="#3D2600" /></View>
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}><T tebal ukuran={16}>Foto selfie</T><T redup ukuran={13}>{foto ? "Ketuk untuk mengambil ulang foto." : "Ketuk lingkaran untuk membuka kamera depan."}</T></View>
          </Kartu>
        </> : <Kartu style={g.kartu}>
          <Masukan label="Keterangan *" value={keterangan} onChangeText={setKeterangan} multiline
            placeholder={status === "DINAS" ? "Contoh: rapat KKM di Kemenag Konawe" : "Contoh: demam"} />
        </Kartu>}
        {status === "HADIR" && <View style={g.baris} accessible accessibilityLabel={`${Number(!!lokasi) + Number(!!foto)} dari 2 syarat siap. ${lokasi ? "Lokasi siap" : "Lokasi belum siap"}. ${foto ? "Selfie siap" : "Selfie belum siap"}.`}>
          {[!!lokasi, !!foto].map((siap, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: siap ? W.hadir : W.garis }} />)}
          <T tebal redup ukuran={12}>{Number(!!lokasi) + Number(!!foto)} dari 2</T>
        </View>}
      </View>
    </Layar>
    <View style={g.kaki}>
      {pesan && <Pesan jenis={pesan.jenis} teks={pesan.teks} />}
      {pesan?.jenis !== "antre" && pesan?.jenis !== "ok" && <Tombol judul={proses ? "Mengirim…" : "Kirim absen"}
        nonaktif={status === "HADIR" ? mencari || !lokasi || !foto : !keterangan.trim()} onPress={kirim} memuat={proses} />}
      {status === "HADIR" && (!lokasi || !foto) && <T ukuran={12} redup style={g.teksTengah}>{!lokasi && !foto ? "Ambil lokasi dan selfie untuk mengirim absen." : !lokasi ? "Ambil lokasi untuk mengirim absen." : "Tombol aktif setelah selfie diambil."}</T>}
    </View>
  </View>;
}

function AreaAbsen({ nama, lokasi, lat, lng, jarak, radius }: { nama: string; lokasi: Lokasi | null; lat: number; lng: number; jarak: number | null; radius: number }) {
  // Samakan skala lingkaran dan posisi pengguna, dengan utara di atas.
  const skala = 52 / Math.max(radius, jarak ?? 0, 1);
  const arah = lokasi ? Math.atan2((lokasi.lng - lng) * Math.cos(lat * Math.PI / 180), lokasi.lat - lat) : 0;
  const r = radius * skala;
  const d = (jarak ?? 0) * skala;
  return <View style={g.peta} accessible accessibilityLabel={`${nama}. Area absen berjari-jari ${radius} meter`}>
    <View style={[g.jalan, { left: 0, right: 0, top: "42%", height: 10 }]} />
    <View style={[g.jalan, { top: 0, bottom: 0, left: "64%", width: 10 }]} />
    <View style={{ width: 2 * r, height: 2 * r, borderRadius: r, borderStyle: "dashed", borderColor: "#7DAA97", borderWidth: 1.5, backgroundColor: "rgba(15,92,69,0.12)" }} />
    <View style={{ position: "absolute", transform: [{ translateY: -14 }] }}><Ionicons name="location" size={34} color={W.utama} /></View>
    {lokasi && <View style={[g.titik, { backgroundColor: W.emas, transform: [{ translateX: d * Math.sin(arah) }, { translateY: -d * Math.cos(arah) }] }]} />}
    <View style={g.pinLabel}>
      <T numberOfLines={1} tebal ukuran={11}>{nama}</T>
      <T numberOfLines={1} ukuran={11} style={{ color: W.utamaTua }}>Area absen {radius} m</T>
    </View>
    {lokasi && <View style={g.legenda}><View style={[g.titikKecil, { backgroundColor: W.emas }]} /><T tebal ukuran={11}>Posisi Anda</T></View>}
  </View>;
}

const g = StyleSheet.create({
  hero: { marginHorizontal: -16, marginTop: -16, padding: 16, gap: 16 },
  judul: { fontSize: 22, color: W.putih },
  baris: { flexDirection: "row", alignItems: "center", gap: 10 },
  rincian: { backgroundColor: W.latar, width: "100%", borderRadius: 18, padding: 16, gap: 12 },
  sukses: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 28 },
  teksTengah: { textAlign: "center" },
  segmen: { backgroundColor: "#0B4A37", padding: 4, borderRadius: 14, flexDirection: "row", gap: 6, flexWrap: "wrap" },
  opsi: { flexGrow: 1, flexBasis: 58, minWidth: 48, minHeight: 48, padding: 4, borderRadius: 14, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  terpilih: { backgroundColor: W.putih },
  kartu: { gap: 10 },
  peta: { height: 144, overflow: "hidden", backgroundColor: W.utamaLatar, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  jalan: { position: "absolute", backgroundColor: "#F5FAF7" },
  titik: { position: "absolute", height: 16, width: 16, borderRadius: 8, borderWidth: 3, borderColor: W.putih },
  pinLabel: { position: "absolute", bottom: 8, left: 8, maxWidth: "60%", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: W.putih },
  legenda: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: W.putih },
  titikKecil: { width: 10, height: 10, borderRadius: 5 },
  selfie: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF4D6" },
  tambah: { position: "absolute", bottom: 2, right: 1, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: W.putih, backgroundColor: W.emas },
  kaki: { backgroundColor: W.latar, paddingVertical: 10, paddingHorizontal: 16, gap: 6 },
});
