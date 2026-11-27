import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Linking, Platform, Pressable, Text, View } from "react-native";
import { idBaru, kirimAtauAntre, useAntrean, useBuktiAbsen, type ItemAntrean } from "@/lib/antrean";
import { useHariIni } from "@/lib/hari-ini";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_GURU, type StatusGuru } from "@/lib/tipe";
import { formatTanggal, jamDiZona, jarakMeter, tanggalDiZona } from "@/lib/waktu";
import { FotoAman } from "@/components/foto-aman";
import { Judul, Kartu, Layar, Masukan, Memuat, Pesan, T, Tombol, W, type JenisPesan } from "@/components/ui";

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
  const { zona } = useSaya();
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

  return (
    <Layar segarkan={muat} memuat={memuat}>
      <View>
        <Judul>Absen saya</Judul>
        <T redup>{formatTanggal(tanggal)}</T>
      </View>
      {a && !(lokal?.galat && lokal.id === antreanId) ? (
        <Kartu>
          <T tebal ukuran={18} style={{ color: W.utama }}>{LABEL_STATUS_GURU[a.status]}</T>
          <T redup>Tercatat pukul {jamDiZona(zona, a.waktuMasuk)}</T>
          {a.jarakMeter != null && <T redup>Jarak dari madrasah ±{jarakTeks(a.jarakMeter)}{a.dalamRadius === false ? " (di luar area madrasah)" : ""}</T>}
          {a.keterangan && <T redup>Keterangan: {a.keterangan}</T>}
          {a.adaFoto && (
            <FotoAman absenId={a.id} label="Foto absen" style={{ width: 140, height: 180, borderRadius: 10, marginTop: 6 }} />
          )}
        </Kartu>
      ) : bukti === tanggal ? <Pesan jenis="ok" teks="Terkirim. Menunggu pembaruan status server." /> : lokal && !lokal.galat ? (
        <Pesan jenis="antre" teks="Tersimpan di HP, menunggu dikirim." />
      ) : (
        lokal?.galat || data?.data.tanggal === tanggal ?
          <><T>{lokal?.galat ? `Perlu diperbaiki. ${lokal.galat}` : "Belum absen"}</T>
          <FormAbsen key={lokal?.id ?? tanggal} lokal={lokal} tanggal={tanggal} onSelesai={muat} /></>
          : <><Pesan jenis="info" teks="Status belum dapat diperiksa." /><Tombol judul="Coba lagi" onPress={muat} /></>
      )}
    </Layar>
  );
}

function FormAbsen({ tanggal, onSelesai, lokal }: { lokal?: ItemAntrean; tanggal: string; onSelesai: () => void }) {
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

  return (
    <Kartu style={{ gap: 14 }}>
      <View style={{ gap: 6 }}>
        <T tebal ukuran={14}>Status</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {(Object.keys(LABEL_STATUS_GURU) as StatusGuru[]).map((s) => (
            <Pressable key={s} accessibilityRole="radio" accessibilityState={{ checked: status === s }} accessibilityLabel={LABEL_STATUS_GURU[s]}
              onPress={() => { if (s !== status) { setPercobaan(0); setStatus(s); } }}
              style={{ flexBasis: "47%", flexGrow: 1, minHeight: 48, justifyContent: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center",
                borderColor: status === s ? W.utama : "#cbd5e1", backgroundColor: status === s ? W.utama : W.putih }}>
              <Text style={{ fontWeight: "700", fontSize: 13, color: status === s ? W.putih : W.teks }}>{s === "DINAS" ? "Dinas" : LABEL_STATUS_GURU[s]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {status === "HADIR" ? (
        <>
          <View style={{ backgroundColor: W.latar, borderRadius: 10, padding: 12, gap: 6 }}>
            <T tebal>1. Lokasi</T>
            {lokasi && <T redup>Lokasi didapat (akurasi ±{lokasi.akurasi} m).{jarak != null ? ` Jarak ke madrasah ±${jarakTeks(jarak)}${jarak > madrasah.radiusMeter ? " (di luar area)" : ""}.` : ""}</T>}
            {galatLokasi && <T style={{ color: W.merah }}>{galatLokasi}</T>}
            <Tombol jenis="garis" judul={mencari ? "Mencari lokasi…" : galatLokasi ? "Coba lokasi lagi" : lokasi ? "Perbarui lokasi" : "Ambil lokasi"} onPress={() => setPercobaan(n => n + 1)} memuat={mencari} />
          </View>
          <View style={{ backgroundColor: W.latar, borderRadius: 10, padding: 12, gap: 6 }}>
            <T tebal>2. Foto selfie</T>
            {foto && <Image alt="Pratinjau selfie" accessibilityLabel="Pratinjau selfie" source={{ uri: foto }} style={{ width: 140, height: 180, borderRadius: 10 }} />}
            <Tombol jenis="garis" judul={foto ? "Ambil ulang foto" : "Buka kamera"} onPress={ambilFoto} />
          </View>
        </>
      ) : (
        <Masukan label="Keterangan *" value={keterangan} onChangeText={setKeterangan} multiline
          placeholder={status === "DINAS" ? "Contoh: rapat KKM di Kemenag Konawe" : "Contoh: demam"} />
      )}

      {status === "HADIR" ? <View><T>Lokasi: {mencari ? "mencari..." : lokasi ? "siap" : petunjukIzin ?? "belum"}</T><T>Selfie: {foto ? "siap" : "belum"}</T></View> : !keterangan.trim() && <T>Keterangan: belum diisi</T>}
      {pesan && <Pesan jenis={pesan.jenis} teks={pesan.teks} />}
      {pesan?.jenis !== "antre" && pesan?.jenis !== "ok" && (
        <Tombol judul={proses ? "Mengirim…" : "Kirim absen"} nonaktif={status === "HADIR" ? mencari || !lokasi || !foto : !keterangan.trim()} onPress={kirim} memuat={proses} />
      )}
    </Kartu>
  );
}
