import Ionicons from "@expo/vector-icons/Ionicons";
import { Hero } from "@/components/v2";
import { Guru } from "@/components/ilustrasi";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useBuktiAbsen, useAntrean } from "@/lib/antrean";
import { useHariIni } from "@/lib/hari-ini";
import { namaPanggilan } from "@/lib/nama";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_GURU } from "@/lib/tipe";
import { formatTanggal, jamDiZona, tanggalDiZona } from "@/lib/waktu";
import { Baris, Judul, Kartu, Layar, Lencana, Memuat, Pesan, T, Tombol, W } from "@/components/ui";

function Kepala({ tanggal, children, tumpang }: { tanggal: string; children?: ReactNode; tumpang?: boolean }) {
  const { pengguna } = useSaya();
  return <Hero style={[s.kepala, tumpang && { paddingBottom: 80 }]}>
    <Baris>
      <Pressable accessibilityRole="button" accessibilityLabel="Buka akun" style={s.akun} onPress={() => router.navigate("/akun")}>
        <T tebal ukuran={18} style={{ color: "#3D2600" }}>{namaPanggilan(pengguna.nama).charAt(0).toUpperCase()}</T>
      </Pressable>
      <View style={{ flex: 1 }}>
        <T ukuran={13} style={s.pucat}>Assalamu&apos;alaikum,</T>
        <T tebal ukuran={18} style={s.putih}>{namaPanggilan(pengguna.nama)}</T>
      </View>
    </Baris>
    <View style={{ gap: 4 }}><T ukuran={13} style={s.pucat}>{tanggal}</T>{children}</View>
  </Hero>;
}

function Menu({ nama, info, ikon, warna, latar, buka }: {
  nama: string; info: string; ikon: keyof typeof Ionicons.glyphMap; warna: string; latar: string; buka: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${nama}, ${info}`} onPress={buka} style={s.menu}>
    <View style={[s.ikon, { backgroundColor: latar }]}><Ionicons name={ikon} size={20} color={warna} /></View>
    <View style={{ flex: 1 }}><T ringkas tebal ukuran={14}>{nama}</T><T numberOfLines={1} ellipsizeMode="tail" redup ukuran={13}>{info}</T></View>
  </Pressable>;
}

const menit = (jam: string) => Number(jam.slice(0, 2)) * 60 + Number(jam.slice(3));

function labelWaktu(mulai: number, akhir: number, sekarang: number, waktu: string) {
  const selisih = mulai - sekarang;
  if (selisih > 180) return "Mulai " + waktu.match(/\d{2}:\d{2}/)?.[0];
  if (selisih >= 60) {
    const sisa = selisih % 60;
    return Math.floor(selisih / 60) + " jam" + (sisa ? " " + sisa + " menit" : "") + " lagi";
  }
  if (selisih > 0) return selisih + " menit lagi";
  return akhir > sekarang ? "Sedang berlangsung" : "Belum diisi";
}

export default function Beranda() {
  const { pengguna } = useSaya();
  if (pengguna.peran === "GURU" || pengguna.mengajar) return <BerandaGuru />;
  return <BerandaPimpinan />;
}

function BerandaPimpinan() {
  const { zona } = useSaya();
  const { data, memuat, muat } = useHariIni();
  const antrean = useAntrean();
  const bukti = useBuktiAbsen();
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));
  const hari = tanggalDiZona(zona);
  const a = data?.data.tanggal === hari ? data.absenSaya : null;
  const pagi = antrean.find(x => x.path === "/api/absen-guru" && x.body.tanggal === hari);
  const infoPagi = pagi?.galat ? "Perlu diperbaiki" : pagi ? "Tersimpan di HP"
    : a ? LABEL_STATUS_GURU[a.status] + " · " + jamDiZona(zona, a.waktuMasuk) : bukti === hari ? "Selesai" : "Belum absen";
  return <Layar segarkan={muat} memuat={memuat}>
    <Kepala tanggal={formatTanggal(hari)} tumpang>
      <T tebal ukuran={22} style={s.putih}>Pantau madrasah hari ini.</T>
    </Kepala>
    <Kartu style={[s.berikut, { gap: 12 }]}>
      <Baris>
        <View style={[s.ikonBesar, { backgroundColor: W.utamaMuda }]}><Ionicons name="stats-chart" size={22} color={W.utama} /></View>
        <View style={{ flex: 1 }}><T tebal ukuran={17}>Pantauan madrasah</T><T redup ukuran={13}>Kehadiran siswa, guru, dan jurnal</T></View>
      </Baris>
      <Tombol judul="Buka pantauan" onPress={() => router.navigate("/pantauan")} />
    </Kartu>
    <Judul kecil>Menu</Judul>
    <View style={s.grid}>
      <Menu nama="Absen pagi" info={infoPagi} ikon="location-outline" warna={W.utama} latar={W.utamaMuda} buka={() => router.navigate("/absen")} />
      <Menu nama="Kehadiran guru" info="Hari ini" ikon="people-outline" warna={W.biru} latar={W.biruMuda} buka={() => router.push({ pathname: "/kehadiran-guru", params: { tanggal: hari } })} />
      <Menu nama="Periksa jurnal" info="Hari ini" ikon="document-text-outline" warna="#A4400E" latar="#FFE8DC" buka={() => router.push({ pathname: "/jurnal", params: { tanggal: hari } })} />
      <Menu nama="Pengganti" info="Gantikan kelas" ikon="swap-horizontal-outline" warna="#6A44C2" latar="#EEE6FF" buka={() => router.push("/pengganti")} />
    </View>
  </Layar>;
}

function BerandaGuru() {
  const { zona, pengguna } = useSaya();
  const gulir = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const posisiJadwal = useRef(0);
  const { data, memuat, offline, galat, muat } = useHariIni();
  const antrean = useAntrean();
  const bukti = useBuktiAbsen();
  const [kini, setKini] = useState(() => new Date());
  useFocusEffect(useCallback(() => {
    void muat();
    setKini(new Date());
    const timer = setInterval(() => setKini(new Date()), 30000);
    return () => clearInterval(timer);
  }, [muat]));
  const hari = tanggalDiZona(zona, kini);
  const tanggal = data?.data.tanggal;
  const lokal = antrean.filter(x => x.body.tanggal === tanggal);
  const pagi = lokal.find(x => x.path === "/api/absen-guru");
  const a = data?.absenSaya;
  const pagiSelesai = !!a || (!!tanggal && bukti === tanggal) || (!!pagi && !pagi.galat);
  const jadwal = (data?.data.jadwal ?? []).filter(j => j.milikSaya).sort((a,b) => a.jamMulai - b.jamMulai);
  const isian = new Map(lokal.filter(x => x.path === "/api/pertemuan").map(x => [String(x.body.jadwalId), x]));
  const belum = jadwal.filter(j => !j.pertemuan && !isian.has(j.id));
  const sekarang = menit(jamDiZona(zona, kini));
  const rentang = (waktu: string) => (waktu.match(/\d{2}:\d{2}/g) ?? []).map(menit);
  const berikut = tanggal === hari ? belum.find(j => rentang(j.waktu)[1] > sekarang) ?? belum[0] : undefined;
  const [mulai, akhir] = rentang(berikut?.waktu ?? "");
  const selesai = jadwal.filter(j => j.pertemuan || (isian.has(j.id) && !isian.get(j.id)?.galat)).length + Number(pagiSelesai);
  const buka = (id: string) => router.push({ pathname: "/isi/[jadwalId]", params: { jadwalId: id } });
  return <Layar scrollRef={gulir} segarkan={muat} memuat={memuat}>
    <Kepala tanggal={data?.data.tanggalTeks ?? formatTanggal(hari)} tumpang={!!berikut}>
      {!!data && <T tebal ukuran={22} style={s.putih}>{tanggal !== hari ? "Jadwal tersimpan" : belum.length ? `${belum.length} kelas lagi hari ini.` : "Jadwal mengajar hari ini."}</T>}
    </Kepala>
    {berikut && <Kartu style={s.berikut}>
      <Baris><View style={{ flex: 1, gap: 5 }}>
        <View style={s.waktu}><T tebal ukuran={12} style={{ color: W.kuning }}>{labelWaktu(mulai, akhir, sekarang, berikut.waktu)}</T></View>
        <T tebal ukuran={18}>{berikut.mapel.nama}</T><T redup>Kelas {berikut.kelas.nama} · {berikut.waktu}</T>
      </View><Guru width={92} height={80} /></Baris>
      <Tombol judul="Isi absen & jurnal" onPress={() => buka(berikut.id)} />
    </Kartu>}
    {offline && <Pesan jenis="antre" teks={data ? "Sedang offline. Menampilkan jadwal yang tersimpan di HP." : "Belum ada jadwal tersimpan di HP. Sambungkan internet untuk memuat jadwal."} />}
    {data && tanggal !== hari && <Pesan jenis="galat" teks={`Jadwal ini dari ${data.data.tanggalTeks}. Sambungkan internet lalu tarik layar ke bawah untuk memuat jadwal hari ini.`} />}
    {galat && <Pesan jenis="galat" teks={galat} />}
    {!data && (memuat ? <Memuat /> : <Tombol jenis="garis" judul="Muat ulang jadwal" onPress={muat} />)}
    {!!data && <>
      <Baris style={s.progres}><View style={[s.ikon, { backgroundColor: W.emas }]}><Ionicons name="checkmark-done" size={22} color="#4A3200" /></View>
        <View style={{ flex: 1, gap: 7 }}><T tebal>{selesai} dari {jadwal.length + 1} tugas selesai</T>
          <View style={s.jalur}><View style={{ height: 6, backgroundColor: "#E3A428", width: `${100 * selesai / (jadwal.length + 1)}%` }} /></View>
        </View>
      </Baris>
      <Judul kecil>Menu</Judul>
      <View style={s.grid}>
        <Menu nama="Absen pagi" info={pagi?.galat ? "Perlu diperbaiki" : pagi ? "Tersimpan di HP" : a ? LABEL_STATUS_GURU[a.status] + " · " + jamDiZona(zona, a.waktuMasuk) : pagiSelesai ? "Selesai" : "Belum absen"} ikon="location-outline" warna={W.utama} latar={W.utamaMuda} buka={() => router.navigate("/absen")} />
        <Menu nama="Jadwal" info={`${jadwal.length} kelas`} ikon="calendar-outline" warna={W.biru} latar={W.biruMuda} buka={() => gulir.current?.scrollTo({ y: posisiJadwal.current, animated: true })} />
        <Menu nama="Riwayat" info="Lihat pertemuan" ikon="document-text-outline" warna="#A4400E" latar="#FFE8DC" buka={() => router.navigate("/riwayat")} />
        {!!pengguna.kelasWali.length && <Menu nama={`Kelas ${pengguna.kelasWali.map(k => k.nama).join(", ")}`} info="Wali kelas" ikon="people-outline" warna="#6A44C2" latar="#EEE6FF" buka={() => router.navigate("/kelas")} />}
      </View>
      <View onLayout={e => { posisiJadwal.current = e.nativeEvent.layout.y; }}><Judul kecil>Jadwal {tanggal === hari ? "hari ini" : "tersimpan"}</Judul></View>
      {!jadwal.length && <Kartu><T redup>Hari ini tidak ada jadwal mengajar.</T></Kartu>}
      {jadwal.map(j => {
        const item = isian.get(j.id);
        const aktif = j.id === berikut?.id;
        return <Pressable key={j.id} accessibilityRole="button" testID={`jadwal-${j.id}`}
          onPress={() => item?.galat ? router.push({ pathname: "/isi/[jadwalId]", params: { jadwalId: j.id, antreanId: item.id } }) : buka(j.id)}>
          <Kartu style={aktif && { borderColor: W.utama, borderWidth: 1 }}><Baris>
            <View style={{ flex: 1 }}><T tebal>{j.mapel.nama} · {j.kelas.nama}</T><T redup ukuran={13}>Jam {j.jamMulai} · {j.waktu}</T></View>
            <Lencana jenis={item?.galat ? "merah" : item || aktif ? "kuning" : j.pertemuan ? "hijau" : "abu"}
              teks={item?.galat ? "Perlu diperbaiki" : item ? "Tersimpan di HP" : j.pertemuan ? "Terisi" : aktif ? "Berikutnya" : "Belum"} />
          </Baris></Kartu>
        </Pressable>;
      })}
      <Tombol jenis="teks" judul="Lihat jadwal guru pengganti" onPress={() => router.push("/pengganti")} />
    </>}
  </Layar>;
}

const s = StyleSheet.create({
  kepala: { marginHorizontal: -16, marginTop: -16, padding: 18, gap: 14 },
  pucat: { color: "#CDE7DC" }, putih: { color: W.putih },
  akun: { width: 48, minHeight: 48, borderWidth: 2, borderColor: W.putih, borderRadius: 24, backgroundColor: W.emas, alignItems: "center", justifyContent: "center" },
  berikut: { marginTop: -72, borderRadius: 22, elevation: 5, shadowColor: "#0C3C2D", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  waktu: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 9, backgroundColor: "#FFF1D2", borderRadius: 8 },
  progres: { backgroundColor: "#FFF4D6", padding: 14, borderRadius: 18 },
  jalur: { height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: "#F5D99A" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  menu: { width: "48%", height: 72, backgroundColor: W.putih, borderRadius: 18, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  ikonBesar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ikon: { width: 30, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
