import { Avatar, getar, HeroSub, Kerangka, LatarStatus, Ring, Segmen } from "@/components/v2";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GalatJaringan, GalatServer, minta } from "@/lib/api";
import { idBaru, isiAntrean, useAntrean, kirimAtauAntre, type ItemAntrean } from "@/lib/antrean";
import { cacheHariIni } from "@/lib/hari-ini";
import { konfirmasi } from "@/lib/konfirmasi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { bacaJson, hapus, simpanJson } from "@/lib/penyimpanan";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_SISWA, type ItemJadwal, type ResponsHariIni, type StatusSiswa } from "@/lib/tipe";
import { tanggalDiZona } from "@/lib/waktu";
import { huruf, Daftar, Judul, Kartu, Layar, Masukan, Pesan, T, Tombol, W, type JenisPesan } from "@/components/ui";

const URUTAN: StatusSiswa[] = ["H", "S", "I", "A"];
function akhiriKalimat(teks: string) {
  const kalimat = teks.trimEnd();
  return /[.!?]$/.test(kalimat) ? kalimat : kalimat + ".";
}
const WARNA: Record<StatusSiswa, string> = { H: W.hadir, S: W.biru, I: W.kuning, A: W.merah };

export default function IsiPertemuan() {
  const { jadwalId, antreanId } = useLocalSearchParams<{ jadwalId: string; antreanId?: string }>();
  const { pengguna, zona } = useSaya();
  const hari = tanggalDiZona(zona);
  const prefix = `draf_v1/${encodeURIComponent(pengguna.id)}/`;
  const kunci = `${prefix}${hari}/${jadwalId}`;
  const [muatan, setMuatan] = useState<{ kunci: string; item?: ItemJadwal; materiLalu?: string; tanggal: string; offline: boolean; galat?: string; draf?: Draf | null; lokal?: ItemAntrean }>();
  useEffect(() => {
    let aktif = true;
    async function buka() {
      const lama = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(prefix) && !k.startsWith(prefix + hari + "/"));
      if (lama.length) await hapus(...lama);
      const lokal = [...isiAntrean()].reverse().find(x => (!antreanId || x.id === antreanId) && x.path === "/api/pertemuan" && x.body.jadwalId === jadwalId && x.body.tanggal === hari);
      const draf = await bacaJson<Draf>(kunci);
      const cache = await cacheHariIni();
      let r = cache;
      let offline = false;
      let galat;
      if (!lokal?.jadwal && (!lokal || !cache?.data.jadwal.some(j => j.id === jadwalId) || cache.data.tanggal !== hari)) {
        try {
          r = await minta<ResponsHariIni>(`/api/m/hari-ini?jadwal=${encodeURIComponent(jadwalId)}`);
          if (r.data.jadwal.some(j => j.id === jadwalId && j.milikSaya)) await simpanJson("cache_hari_ini", r);
        } catch (e) {
          if (e instanceof GalatServer && e.status < 500) r = null;
          offline = e instanceof GalatJaringan;
          galat = e instanceof Error ? e.message : "Gagal memuat jadwal.";
        }
      }
      const item = lokal?.jadwal ?? r?.data.jadwal.find(j => j.id === jadwalId);
      const tanggal = lokal?.jadwal ? hari : r?.data.tanggal ?? "";
      const materiLalu = item && r?.data.tanggal === tanggal ? r.data.jadwal
        .filter(j => j.kelas.id === item.kelas.id && j.mapel.id === item.mapel.id && j.jamSelesai < item.jamMulai && j.pertemuan?.materi.trim())
        .sort((a, b) => b.jamSelesai - a.jamSelesai)[0]?.pertemuan?.materi ?? item.materiLalu?.materi : undefined;
      if (aktif) setMuatan({ kunci, item, tanggal, materiLalu, offline, galat, draf, lokal });
    }
    buka().catch(() => { if (aktif) setMuatan({ kunci, tanggal: "", offline: false, galat: "Penyimpanan HP tidak dapat dibaca." }); });
    return () => { aktif = false; };
  }, [jadwalId, antreanId, kunci, prefix, hari]);

  if (muatan?.kunci !== kunci) return <Layar><HeroSub judul="Absen & jurnal" sub="Memuat daftar siswa…" /><Kerangka baris={6} /></Layar>;
  if (!muatan.item) {
    return (
      <Layar>
        <HeroSub judul="Absen & jurnal" />
        <Pesan jenis="galat" teks={muatan.offline ? "Jadwal ini belum tersimpan di HP. Sambungkan internet lalu coba lagi." : muatan.galat ?? "Jadwal tidak ditemukan untuk hari ini."} />
        <Tombol jenis="garis" judul="Kembali" onPress={() => router.back()} />
      </Layar>
    );
  }
  return <Form key={kunci} kunci={kunci} lokal={muatan.lokal} draf={muatan.tanggal === hari ? muatan.draf : null} item={muatan.item} materiLalu={muatan.materiLalu} tanggal={muatan.tanggal} offline={muatan.offline} />;
}

type Draf = { materi: string; kd: string; catatan: string; isian: Record<string, { status: StatusSiswa; keterangan: string }> };

function Form({ item, materiLalu, tanggal, offline, kunci, lokal, draf }: { kunci: string; lokal?: ItemAntrean; draf?: Draf | null; item: ItemJadwal; materiLalu?: string; tanggal: string; offline: boolean }) {
  const { pengguna, zona } = useSaya();
  const p = item.pertemuan;
  const hariIni = tanggalDiZona(zona);
  const bisaUbah = (!p || (p.guruId === pengguna.id && !p.diperiksa)) && tanggal === hariIni;
  const pengganti = !item.milikSaya;
  const bolehIsi = bisaUbah && pengguna.peran !== "ADMIN";

  const antrean = useAntrean();
  const aktif = antrean.find(x => x.path === "/api/pertemuan" && x.body.tanggal === tanggal && x.body.jadwalId === item.id);
  const body = lokal?.body;
  const absen = (body?.absensi ?? []) as { siswaId: string; status: StatusSiswa; keterangan?: string }[];
  const [isian, setIsian] = useState<Draf["isian"]>(() => {
    const salinan = Object.fromEntries(absen.map(a => [a.siswaId, a]));
    return Object.fromEntries(item.siswa.map(s => {
      const nilai = draf?.isian[s.id] ?? salinan[s.id] ?? p?.absensi[s.id];
      return [s.id, { status: nilai?.status ?? "H", keterangan: nilai?.keterangan ?? "" }];
    }));
  });
  const [materi, setMateri] = useState(draf?.materi ?? String(body ? body.materi ?? "" : p?.materi ?? ""));
  const [kd, setKd] = useState(draf?.kd ?? String(body ? body.kd ?? "" : p?.kd ?? ""));
  const [catatan, setCatatan] = useState(draf?.catatan ?? String(body ? body.catatan ?? "" : p?.catatan ?? ""));
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: JenisPesan; teks: string } | null>(null);

  const nilai = useMemo(() => ({ materi, kd, catatan, isian }), [materi, kd, catatan, isian]);
  const [tersimpan, setTersimpan] = useState<Draf | null>(draf ? nilai : null);
  const awal = useRef(nilai);
  const tertunda = useRef<Draf | null>(null);
  const selesai = useRef(false);
  const sibuk = useRef(false);
  const tulis = useRef(Promise.resolve());
  const flush = useMemo(() => () => {
    const d = tertunda.current;
    if (!d || selesai.current) return;
    tertunda.current = null;
    tulis.current = tulis.current.then(async () => { await simpanJson(kunci, d); setTersimpan(d); }).catch(() => setPesan({ jenis: "galat", teks: "Draf gagal disimpan di HP." }));
  }, [kunci]);
  useEffect(() => {
    if (!bolehIsi || selesai.current || nilai === awal.current) return;
    tertunda.current = nilai;
    const timer = setTimeout(flush, 350);
    return () => clearTimeout(timer);
  }, [nilai, bolehIsi, flush]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", state => { if (state !== "active") flush(); });
    return () => { sub.remove(); flush(); };
  }, [flush]);

  const rekap = useMemo(() => {
    const r: Record<StatusSiswa, number> = { H: 0, S: 0, I: 0, A: 0 };
    Object.values(isian).forEach((x) => r[x.status]++);
    return r;
  }, [isian]);

  async function kirim() {
    if (!materi.trim()) { setPesan({ jenis: "galat", teks: "Materi yang diajarkan wajib diisi." }); return; }
    if (tanggal !== tanggalDiZona(zona)) { setPesan({ jenis: "galat", teks: "Tanggal sudah berganti." }); return; }
    setProses(true);
    setPesan(null);
    const hasil = await kirimAtauAntre("/api/pertemuan", {
      idKlien: idBaru(), jadwalId: item.id, tanggal,
      materi: materi.trim(), kd: kd.trim() || null, catatan: catatan.trim() || null,
      diisiDiPerangkat: new Date().toISOString(),
      absensi: Object.entries(isian).map(([siswaId, x]) => ({ siswaId, status: x.status, keterangan: x.keterangan.trim() || null })),
    }, `${item.mapel.nama} · ${item.kelas.nama} (${tanggal})`, lokal?.id, item);
    if (hasil.status !== "ditolak") {
      selesai.current = true;
      await tulis.current;
      await hapus(kunci);
    }
    if (hasil.status === "terkirim") {
      getar("sukses");
      setPesan({ jenis: "ok", teks: "Terkirim." });
      setTimeout(() => router.back(), 700);
    } else if (hasil.status === "diantre") {
      setPesan({ jenis: "antre", teks: `Tersimpan di HP, menunggu dikirim. ${hasil.pesan}` });
    } else {
      setPesan({ jenis: "galat", teks: hasil.pesan });
    }
  }

  async function simpan() {
    if (pengganti && !(await konfirmasi("Guru pengganti", akhiriKalimat(`Isian ini akan dicatat atas nama Anda sebagai guru pengganti untuk ${item.guru.nama}`)))) return;
    if (sibuk.current || selesai.current) return;
    sibuk.current = true;
    try { await kirim(); }
    catch { setPesan({ jenis: "galat", teks: "Gagal menyimpan di HP. Coba lagi." }); }
    finally { sibuk.current = false; setProses(false); }
  }

  const { bottom } = useSafeAreaInsets();
  const adaIsiDraf = Boolean(materi.trim() || kd.trim() || catatan.trim() || rekap.H < item.siswa.length);
  const [tampilkanPetunjuk, setTampilkanPetunjuk] = useState(true);
  const [detail, setDetail] = useState(Boolean(kd || catatan));
  const [sebelum, setSebelum] = useState<typeof isian | null>(null);
  const [siswaCatatan, setSiswaCatatan] = useState<ItemJadwal["siswa"][number] | null>(null);
  const editable = bolehIsi && !proses && !selesai.current;
  const { fontScale } = useWindowDimensions();
  const [tidakHadir, setTidakHadir] = useState(false);
  const daftarSiswa = tidakHadir ? item.siswa.filter(s => isian[s.id].status !== "H") : item.siswa;
  const ringkas = URUTAN.slice(1).filter(st => rekap[st] > 0)
    .map(st => `${rekap[st]} ${LABEL_STATUS_SISWA[st].toLowerCase()}`).join(" · ");

  function gantiStatus(id: string) {
    getar();
    setTampilkanPetunjuk(false);
    setSebelum(null);
    setIsian(lama => {
      const siswa = lama[id];
      const status = URUTAN[(URUTAN.indexOf(siswa.status) + 1) % URUTAN.length];
      return { ...lama, [id]: { status, keterangan: status === "H" ? "" : siswa.keterangan } };
    });
  }

  function kartuSiswa({ item: siswa, index }: { item: ItemJadwal["siswa"][number]; index: number }) {
    const { status, keterangan } = isian[siswa.id];
    const label = LABEL_STATUS_SISWA[status];
    const hadir = status === "H";
    const akhir = index === daftarSiswa.length - 1;
    return <Pressable accessibilityRole="button" accessibilityLabel={[siswa.nama, label, keterangan].filter(Boolean).join(", ")}
      accessibilityHint={editable ? "Ketuk untuk mengganti status. Tekan lama untuk keterangan." : "Ketuk untuk melihat keterangan."}
      onPress={() => editable ? gantiStatus(siswa.id) : setSiswaCatatan(siswa)} onLongPress={() => setSiswaCatatan(siswa)}
      accessibilityActions={[{ name: "keterangan", label: "Buka keterangan siswa" }]}
      onAccessibilityAction={({ nativeEvent }) => { if (nativeEvent.actionName === "keterangan") setSiswaCatatan(siswa); }}
      style={({ pressed }) => [gaya.siswa, index === 0 && gaya.awal, akhir && gaya.akhir, !akhir && gaya.garis, pressed && { backgroundColor: "#F7FAF8" }]}>
      <Avatar nama={siswa.nama} size={36} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={[gaya.nama, huruf(600)]}>{siswa.nama}</Text>
        {keterangan ? <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[gaya.keterangan, huruf(600), { color: WARNA[status] }]}>{keterangan}</Text>
          : siswa.nis ? <Text maxFontSizeMultiplier={1.2} style={[gaya.keterangan, huruf(400), { color: "#8A9A93" }]}>NIS {siswa.nis}</Text> : null}
      </View>
      <View style={[gaya.pil, { backgroundColor: PIL[status][0] }]}>
        <Text maxFontSizeMultiplier={1.2} style={[huruf(700), { fontSize: 12, color: PIL[status][1] }]}>{label}</Text>
      </View>
    </Pressable>;
  }

  return <View style={{ flex: 1, backgroundColor: W.latar }}>
    <Daftar data={daftarSiswa} renderItem={kartuSiswa} contentContainerStyle={{ gap: 0 }}
      ListEmptyComponent={<View style={gaya.kosong}><T redup>{tidakHadir ? "Semua siswa hadir." : "Belum ada siswa di kelas ini."}</T></View>}>
      <HeroSub judul={item.mapel.nama} sub={`Kelas ${item.kelas.nama} · Jam ${item.jamMulai}${item.jamSelesai > item.jamMulai ? `–${item.jamSelesai}` : ""} · ${item.waktu}`}>
        {editable && adaIsiDraf && (tersimpan || nilai !== awal.current) && <View style={gaya.draf}><T tebal ukuran={12} style={{ color: W.utama }}>{tersimpan === nilai ? "Draf tersimpan di HP" : "Draf berubah"}</T></View>}
        <View style={[gaya.baris, { flexWrap: "wrap" }]}>
          <View accessible accessibilityLabel={`${rekap.H} hadir dari ${item.siswa.length} siswa`}>
            <Ring value={item.siswa.length ? 100 * rekap.H / item.siswa.length : 0} size={Math.max(76, 60 * Math.min(fontScale, 2))}>
              <T tebal ukuran={20} style={{ color: W.putih }}>{rekap.H}</T>
              <T ukuran={11} style={{ color: "#CFE8DD" }}>dari {item.siswa.length}</T>
            </Ring>
          </View>
          <View style={gaya.pilRekap}>{URUTAN.slice(1).map(st => <View key={st} style={[gaya.hitung, { backgroundColor: LATAR[st] }]}>
            <T tebal ukuran={12} style={{ color: WARNA[st] }}>{rekap[st]} {LABEL_STATUS_SISWA[st]}</T>
          </View>)}</View>
        </View>
      </HeroSub>
      <View style={{ gap: 12, paddingTop: 12, paddingBottom: 8 }}>
      {lokal && !pesan && <Pesan jenis={aktif?.galat ? "galat" : aktif ? "antre" : "ok"} teks={aktif?.galat ? `Perlu diperbaiki. ${aktif.galat}` : aktif ? "Tersimpan di HP, menunggu dikirim." : "Antrean sudah berubah. Buka kembali jadwal."} />}
      {offline && <Pesan jenis="antre" teks="Sedang offline. Isian akan disimpan di HP lalu dikirim otomatis." />}
      {pengganti && <Pesan jenis="info" teks={akhiriKalimat(`Jadwal ${item.guru.nama}`) + (bolehIsi ? " Anda mengisi sebagai guru pengganti." : "")} />}
      {p && <Pesan jenis="ok" teks={akhiriKalimat(`Sudah diisi oleh ${p.namaGuru}${p.pengganti ? " (pengganti)" : ""}`) + (bolehIsi ? " Anda masih bisa mengubahnya hari ini." : "")} />}

      {!bolehIsi && <Pesan jenis="info" teks={
        p?.diperiksa ? "Jurnal sudah diperiksa kepala madrasah, jadi tidak bisa diubah lagi."
        : tanggal < hariIni ? "Jadwal ini sudah lewat harinya, jadi tidak bisa diisi atau diubah lagi."
        : tanggal > hariIni ? "Jadwal ini belum tiba. Jurnal hanya bisa diisi pada hari yang dijadwalkan."
        : pengguna.peran === "ADMIN" ? "Admin hanya bisa melihat jurnal ini."
        : "Jurnal ini sudah diisi oleh guru lain. Hanya guru yang mengisinya yang bisa mengubahnya."
      } />}
      <Kartu>
        <Masukan label="Materi hari ini (wajib)" placeholder="Materi yang diajarkan" editable={editable} value={materi} onChangeText={setMateri} multiline />
        {editable && !!materiLalu && !materi.trim() && <Pressable accessibilityRole="button" accessibilityLabel={`Gunakan materi pertemuan lalu, ${materiLalu}`} style={gaya.chipLalu} onPress={() => { getar(); setMateri(materiLalu); }}>
          <T tebal ukuran={12} style={{ color: W.utama }}>↩</T>
          <T numberOfLines={1} tebal ukuran={12} style={{ color: W.utama, flexShrink: 1 }}>Pertemuan lalu: {materiLalu}</T>
        </Pressable>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detail }} onPress={() => setDetail(!detail)} style={gaya.detail}>
          <T tebal ukuran={13} style={{ color: W.utama }}>{detail ? "Sembunyikan KD & catatan" : "Tambah KD & catatan"}</T>
        </Pressable>
        {detail && <>
          <Masukan label="KD / tujuan pembelajaran" editable={editable} value={kd} onChangeText={setKd} />
          <Masukan label="Catatan kejadian (opsional)" editable={editable} value={catatan} onChangeText={setCatatan} multiline />
        </>}
      </Kartu>
      <Segmen<"semua" | "tidak"> nilai={tidakHadir ? "tidak" : "semua"} onUbah={k => setTidakHadir(k === "tidak")} pilihan={[
        { kunci: "semua", label: `Semua ${item.siswa.length}` }, { kunci: "tidak", label: `Tidak hadir ${item.siswa.length - rekap.H}` },
      ]} />
      <View style={[gaya.baris, { flexWrap: "wrap" }]}>
        <Judul kecil>Siswa</Judul>
        {editable && rekap.H < item.siswa.length && <Tombol jenis="teks" judul="Semua hadir" onPress={() => {
          setSebelum(isian);
          setIsian(Object.fromEntries(item.siswa.map(s => [s.id, { status: "H", keterangan: "" }])));
        }} />}
        {editable && sebelum && <Tombol jenis="teks" judul="Urungkan" onPress={() => { setIsian(sebelum); setSebelum(null); }} />}
      </View>
      {editable && tampilkanPetunjuk && item.siswa.length > 0 && <T redup ukuran={12}>Ketuk baris untuk mengganti status · tekan lama untuk keterangan</T>}
      </View>
    </Daftar>
    <View style={[gaya.footer, { marginBottom: Math.max(12, bottom) }]}>
      {pesan && (pesan.jenis === "antre"
        ? <Pesan jenis={aktif?.galat ? "galat" : aktif ? "antre" : "ok"} teks={aktif?.galat ? `Perlu diperbaiki. ${aktif.galat}` : aktif ? pesan.teks : "Terkirim."} />
        : <Pesan jenis={pesan.jenis} teks={pesan.teks} />)}
      <View style={gaya.baris}>
        <View style={{ flex: 1 }}>
          <T tebal style={{ color: W.putih }}>{rekap.H} hadir dari {item.siswa.length}</T>
          {(!!ringkas || (bolehIsi && !materi.trim())) && <T style={{ color: "#CFE8DD" }} ukuran={12}>{[ringkas, bolehIsi && !materi.trim() ? "materi belum diisi" : ""].filter(Boolean).join(" · ")}</T>}
        </View>
        {bolehIsi && !selesai.current && <Pressable accessibilityRole="button" accessibilityState={{ disabled: proses || !item.siswa.length, busy: proses }}
          disabled={proses || !item.siswa.length} onPress={() => void simpan()} style={[gaya.simpan, (proses || !item.siswa.length) && { opacity: 0.65 }]}>
          <T tebal style={{ color: "#3D2600" }}>{proses ? "Menyimpan…" : "Simpan"}</T>
        </Pressable>}
        {pesan?.jenis === "antre" && <Tombol jenis="garis" judul="Kembali ke jadwal" onPress={() => router.back()} />}
      </View>
    </View>
    <LatarStatus />
    <Modal visible={!!siswaCatatan} transparent animationType="fade" onRequestClose={() => setSiswaCatatan(null)}>
      <KeyboardAvoidingView style={gaya.lapisan} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {siswaCatatan && <ScrollView style={gaya.dialog} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Judul kecil>{siswaCatatan.nama}</Judul>
          <T redup>{LABEL_STATUS_SISWA[isian[siswaCatatan.id].status]}</T>
          <Masukan label="Keterangan siswa (opsional)" multiline editable={editable} value={isian[siswaCatatan.id].keterangan}
            onChangeText={keterangan => {
              const id = siswaCatatan.id;
              setSebelum(null);
              setIsian(lama => ({ ...lama, [id]: { ...lama[id], keterangan } }));
            }} />
          <Tombol judul="Selesai" onPress={() => setSiswaCatatan(null)} />
        </ScrollView>}
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

const LATAR: Record<StatusSiswa, string> = { H: W.putih, S: W.biruMuda, I: W.izinMuda, A: W.merahMuda };
/** Pil status di kanan baris: hadir lembut, selain hadir pekat agar mudah terlihat. */
const PIL: Record<StatusSiswa, [string, string]> = { H: [W.utamaMuda, W.hadir], S: [W.biru, W.putih], I: [W.emas, "#3D2600"], A: [W.merah, W.putih] };
const gaya = StyleSheet.create({
  baris: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  draf: { alignSelf: "flex-start", paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "#CDEBDD" },
  pilRekap: { flex: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 5 },
  hitung: { padding: 7, borderRadius: 9 },
  detail: { justifyContent: "center", minHeight: 48 },
  chipLalu: { alignSelf: "flex-start", maxWidth: "100%", minHeight: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: W.utamaMuda },
  kosong: { backgroundColor: W.putih, borderRadius: 18, padding: 16 },
  siswa: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: W.putih },
  awal: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  akhir: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  garis: { borderBottomWidth: 1, borderBottomColor: "#EDF2EF" },
  nama: { fontSize: 14, color: W.teks },
  keterangan: { fontSize: 12 },
  pil: { minWidth: 66, minHeight: 32, borderRadius: 16, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  footer: { backgroundColor: W.teks, marginHorizontal: 12, marginTop: 4, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  simpan: { minWidth: 82, minHeight: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: W.emas, justifyContent: "center", alignItems: "center" },
  lapisan: { flex: 1, justifyContent: "center", backgroundColor: "rgba(16,32,27,0.45)", padding: 16 },
  dialog: { flexGrow: 0, maxHeight: "90%", borderRadius: 14, backgroundColor: W.putih },
});
