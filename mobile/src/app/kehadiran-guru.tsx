import Ionicons from "@expo/vector-icons/Ionicons";
import { Avatar, HeroSub, Kerangka, LatarStatus, Segmen, TitikStatus } from "@/components/v2";
import { Siluet } from "@/components/ilustrasi";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { FotoAman } from "@/components/foto-aman";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_GURU, type ItemKehadiranGuru } from "@/lib/tipe";
import { formatTanggal, jamDiZona, tanggalDiZona } from "@/lib/waktu";
import { Daftar, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

type Saring = "belum" | "sudah" | "semua";
type Baris = { id: string; guru?: ItemKehadiranGuru; judul?: string; awal?: boolean; akhir?: boolean };

const WARNA_STATUS = { HADIR: W.hadir, IZIN: W.kuning, SAKIT: W.biru, DINAS: "#6A44C2" } as const;

/** Susun daftar datar berisi judul kelompok dan baris, dengan penanda awal/akhir kartu. */
function susun(kelompok: [string, ItemKehadiranGuru[]][]): Baris[] {
  return kelompok.filter(([, isi]) => isi.length).flatMap(([judul, isi]) => [
    { id: "judul-" + judul, judul },
    ...isi.map((g, i) => ({ id: g.id, guru: g, awal: i === 0, akhir: i === isi.length - 1 })),
  ]);
}

export default function KehadiranGuru() {
  const { zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const awal = useLocalSearchParams<{ tanggal?: string }>().tanggal;
  const [pilihTanggal, setPilihTanggal] = useState(false);
  const [tanggal, setTanggal] = useState(awal && awal <= hariIni ? awal : hariIni);
  const [saring, setSaring] = useState<Saring | null>(null);
  const { data, galat, memuat, muat } = useMuat<{ guru: ItemKehadiranGuru[] }>(`/api/m/kehadiran-guru?tanggal=${tanggal}`);

  const [terlihat, setTerlihat] = useState<Set<string>>(new Set());
  const saatTerlihat = useCallback(({ viewableItems }: { viewableItems: { item: Baris }[] }) => {
    setTerlihat(new Set(viewableItems.map(v => v.item.id)));
  }, []);

  const guru = data?.guru ?? [];
  const sudah = guru.filter(g => g.absen);
  const belum = guru.filter(g => !g.absen);
  const hadir = sudah.filter(g => g.absen?.status === "HADIR").length;
  const tidakHadir = sudah.length - hadir;
  const belumBerjadwal = belum.filter(g => g.jadwal > 0);
  const aktif: Saring = saring ?? (belum.length ? "belum" : "semua");
  const kelompokBelum: [string, ItemKehadiranGuru[]][] = [["Belum absen · punya jadwal", belumBerjadwal], ["Belum absen · tanpa jadwal", belum.filter(g => g.jadwal === 0)]];
  const baris = susun(aktif === "belum" ? kelompokBelum : aktif === "sudah" ? [["Sudah absen", sudah]] : [...kelompokBelum, ["Sudah absen", sudah]]);
  const lebar = (n: number) => (guru.length ? `${(100 * n) / guru.length}%` : "0%") as `${number}%`;

  return (<View style={{ flex: 1 }}>
    <Daftar data={baris} refreshing={memuat} onRefresh={muat}
      onViewableItemsChanged={saatTerlihat} extraData={terlihat}
      contentContainerStyle={{ padding: 16, gap: 0, paddingBottom: 24 }}
      renderItem={({ item }) => {
        if (item.judul) return <T tebal ukuran={12} style={s.judulKelompok}>{item.judul}</T>;
        const g = item.guru!;
        const a = g.absen;
        const peta = a?.lat != null && a?.lng != null;
        const sub = a
          ? [jamDiZona(zona, a.waktuMasuk), a.dalamRadius === false ? "di luar area" : a.jarakMeter != null ? `±${a.jarakMeter} m` : null, a.keterangan].filter(Boolean).join(" · ")
          : g.jadwal > 0 ? `${g.jadwal} jadwal · catatan ${g.jurnal}/${g.jadwal}` : "Tidak ada jadwal";
        const isi = <>
          {a ? <View style={[s.foto, { backgroundColor: a.dalamRadius === false ? W.kuningMuda : W.utamaMuda }]}>
            {a.adaFoto ? terlihat.has(g.id) && <FotoAman absenId={a.id} label={`Foto ${g.nama}`} style={{ width: 40, height: 48 }} /> : <Siluet />}
          </View> : <Avatar nama={g.nama} size={38} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <T numberOfLines={1} tebal>{g.nama}</T>
            <T numberOfLines={1} ukuran={12} style={{ color: a?.dalamRadius === false ? W.merah : W.redup }}>{sub}</T>
          </View>
          <TitikStatus teks={a ? LABEL_STATUS_GURU[a.status] : "Belum"} warna={a ? WARNA_STATUS[a.status] : g.jadwal > 0 ? W.merah : "#8A9A93"} />
          {peta && <Ionicons name="location-outline" size={18} color={W.utama} />}
        </>;
        const gaya = [s.baris, item.awal && s.awal, item.akhir && s.akhir, !item.akhir && s.garis];
        const label = `${g.nama}, ${a ? LABEL_STATUS_GURU[a.status] : "belum absen"}, ${sub}`;
        return peta
          ? <Pressable accessibilityRole="link" accessibilityLabel={`${label}. Buka lokasi di peta`} style={({ pressed }) => [...gaya, pressed && { opacity: 0.7 }]}
            onPress={() => Linking.openURL(`https://www.google.com/maps?q=${a!.lat},${a!.lng}`)}>{isi}</Pressable>
          : <View accessible accessibilityLabel={label} style={gaya}>{isi}</View>;
      }}>
      <HeroSub judul="Kehadiran guru" sub={formatTanggal(tanggal)}
        kanan={<Pressable accessibilityRole="button" accessibilityLabel={"Ganti tanggal, " + formatTanggal(tanggal)}
          accessibilityState={{ expanded: pilihTanggal }} onPress={() => setPilihTanggal(!pilihTanggal)} style={s.ganti}>
          <Ionicons name="calendar-outline" size={16} color={W.putih} /><T tebal ukuran={12} style={{ color: W.putih }}>Ganti</T>
        </Pressable>}>
        {data && <View accessible accessibilityLabel={`${sudah.length} dari ${guru.length} guru sudah absen. ${hadir} hadir, ${tidakHadir} izin, sakit, atau dinas, ${belum.length} belum`}
          style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
          <View>
            <T tebal ukuran={34} style={{ color: W.putih, lineHeight: 38 }}>{sudah.length}<T tebal ukuran={16} style={{ color: "#BFE0D3" }}>/{guru.length}</T></T>
            <T ukuran={12} style={{ color: "#CFE8DD" }}>sudah absen</T>
          </View>
          <View style={{ flex: 1, gap: 6, paddingBottom: 4 }}>
            <View style={s.jalur}>
              <View style={{ width: lebar(hadir), backgroundColor: "#7FD1AE" }} />
              <View style={{ width: lebar(tidakHadir), backgroundColor: "#9DB8FF" }} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 10 }}>
              <T ukuran={11} style={{ color: "#CFE8DD" }}><T ukuran={11} style={{ color: "#7FD1AE" }}>●</T> {hadir} hadir</T>
              <T ukuran={11} style={{ color: "#CFE8DD" }}><T ukuran={11} style={{ color: "#9DB8FF" }}>●</T> {tidakHadir} izin/sakit</T>
              <T ukuran={11} style={{ color: "#CFE8DD" }}>{belum.length} belum</T>
            </View>
          </View>
        </View>}
      </HeroSub>
      <View style={{ gap: 10, paddingTop: 12 }}>
        {pilihTanggal && <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={t => { setTanggal(t); setSaring(null); }} />}
        {data && <Segmen<Saring> nilai={aktif} onUbah={setSaring} pilihan={[
          { kunci: "belum", label: `Belum ${belum.length}` }, { kunci: "sudah", label: `Sudah ${sudah.length}` }, { kunci: "semua", label: "Semua" },
        ]} />}
        {data && aktif !== "sudah" && belumBerjadwal.length > 0 && <View accessibilityRole="alert" style={s.banner}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: W.merah }} />
          <T tebal ukuran={12} style={{ color: "#7A1A12", flex: 1 }}>{belumBerjadwal.length} guru berjadwal {tanggal === hariIni ? "hari ini" : "pada tanggal ini"} belum absen</T>
        </View>}
        {data && baris.length === 0 && <View style={s.kosong}><T redup>{aktif === "belum" ? "Semua guru sudah absen." : "Belum ada guru yang absen."}</T></View>}
        {memuat && !data && <Kerangka baris={5} />}
        {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
      </View>
    </Daftar>
    <LatarStatus />
  </View>);
}

const s = StyleSheet.create({
  ganti: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#1B7258" },
  jalur: { height: 8, borderRadius: 4, backgroundColor: "#1B7258", flexDirection: "row", overflow: "hidden" },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, backgroundColor: W.merahMuda },
  kosong: { backgroundColor: W.putih, borderRadius: 18, padding: 16 },
  judulKelompok: { color: W.redup, paddingTop: 16, paddingBottom: 8, paddingHorizontal: 4 },
  baris: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: W.putih },
  awal: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  akhir: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  garis: { borderBottomWidth: 1, borderBottomColor: "#EDF2EF" },
  foto: { width: 40, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
});
