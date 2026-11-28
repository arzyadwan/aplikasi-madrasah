import { Hero } from "@/components/v2";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Baris, Judul, Kartu, Layar, Lencana, Memuat, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ResponsPantauan } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";

function Angka({ label, nilai, ikon }: { label: string; nilai: string; ikon: "people" | "book" }) {
  const { fontScale } = useWindowDimensions();
  return <View style={[s.metrik, { minWidth: 80 * fontScale }]}>
    <Ionicons name={ikon} size={20} color={W.utama} /><T ringkas tebal ukuran={22}>{nilai}</T>
    <T ringkas ukuran={13} redup>{label}</T>
  </View>;
}

function Perhatian({ judul, sub, nilai, warna, buka, onPress }: {
  judul: string; sub: string; nilai: number; warna: "merah" | "kuning";
  buka: boolean; onPress: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  return <Pressable accessibilityRole="button" accessibilityState={{ expanded: buka }}
    accessibilityLabel={nilai + " " + judul + ", " + sub}
    onPress={onPress} style={[s.perhatian, { minWidth: Math.min(180, 124 * fontScale), backgroundColor: warna === "merah" ? W.merahMuda : W.izinMuda }]}>
    <T tebal ukuran={26} style={{ color: warna === "merah" ? W.merah : W.kuning }}>{nilai}</T>
    <T tebal>{judul}</T>
    <T redup ukuran={12}>{sub}</T>
  </Pressable>;
}

function GrafikKelas({ kelas }: { kelas: ResponsPantauan["perKelas"] }) {
  const [pilihan, pilih] = useState("");
  const terpilih = kelas.find(k => k.id === pilihan);
  const { fontScale } = useWindowDimensions();
  return <Kartu>
    <Judul kecil>Kehadiran per kelas</Judul>
    {kelas.length === 0 && <T redup>Belum ada data kelas.</T>}
    <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, gap: 6, alignItems: "flex-end" }}>
      {kelas.map(k => {
        const { H, S, I, A } = k.rekap;
        const total = H + S + I + A;
        const nilai = total ? Math.round(100 * H / total) : null;
        return <Pressable key={k.id} accessibilityRole="button" accessibilityState={{ expanded: pilihan === k.id }}
          accessibilityLabel={k.nama + ", " + (nilai == null ? "belum ada data" : nilai + "% hadir")}
          onPress={() => pilih(pilihan === k.id ? "" : k.id)}
          style={{ alignItems: "center", minHeight: 48, minWidth: 48 * fontScale, flex: 1, gap: 4 }}>
          <T tebal ukuran={12}>{nilai == null ? "—" : nilai + "%"}</T>
          <View style={{ alignSelf: "stretch", height: nilai == null ? 1 : Math.max(2, nilai * .68), borderRadius: 7, backgroundColor: nilai == null ? W.garis : nilai < 90 ? W.emas : W.utama }} />
          <T ringkas redup ukuran={12}>{k.nama}</T>
        </Pressable>;
      })}
    </ScrollView>
    {terpilih && <View style={{ gap: 4 }}>
      <T tebal>{terpilih.nama} · Jurnal {terpilih.terisi}/{terpilih.jadwal}</T>
      <T>Hadir {terpilih.rekap.H} · Sakit {terpilih.rekap.S} · Izin {terpilih.rekap.I} · Alpa {terpilih.rekap.A}</T>
      {terpilih.tidakHadir.map((siswa, i) => <T key={i} redup>{siswa.nama} · {siswa.status.join(", ")}</T>)}
    </View>}
  </Kartu>;
}

export default function Pantauan() {
  const { zona, madrasah } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const [tanggal, setTanggal] = useState(hariIni);
  const [detail, setDetail] = useState<"guru" | "jurnal" | null>(null);
  const [pilihTanggal, setPilihTanggal] = useState(false);
  const { data: p, galat, memuat, muat } = useMuat<ResponsPantauan>(`/api/m/pantauan?tanggal=${tanggal}`);
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));
  const keGuru = () => router.push({ pathname: "/kehadiran-guru", params: { tanggal } });
  const terlambat = p?.belumJurnal.filter(j => j.lewat).length ?? 0;
  const kategori = p ? [p.belumAbsen.length, p.belumJurnal.length, p.guru.luarRadius].filter(Boolean).length : 0;

  return <Layar segarkan={muat} memuat={memuat}>
    <Hero style={s.kepala}>
      <T ukuran={12} style={s.putih}>{tanggal === hariIni ? "Pantauan hari ini" : "Pantauan madrasah"}</T>
      <T tebal ukuran={20} style={s.putih}>{madrasah.nama}</T>
      <Pressable accessibilityRole="button" accessibilityLabel={"Pilih tanggal, " + formatTanggal(tanggal)}
        accessibilityState={{ expanded: pilihTanggal }} onPress={() => setPilihTanggal(!pilihTanggal)} style={s.tanggal}>
        <Ionicons name="calendar-outline" color="white" size={18} />
        <T style={[s.putih, { flexShrink: 1 }]}>{formatTanggal(tanggal)}</T>
        <Ionicons name="chevron-down" color="white" size={16} />
      </Pressable>
      {pilihTanggal && <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={t => { setTanggal(t); setDetail(null); }} />}
      {p && <View><T tebal ukuran={40} style={s.putih}>{p.siswa.persenHadir == null ? "—" : p.siswa.persenHadir + "%"}</T><T style={s.putih}>siswa hadir</T></View>}
    </Hero>
    {p && <View style={[s.angka, { marginTop: -28 }]}>
      <Angka ikon="people" label="Guru hadir" nilai={p.guru.hadir + "/" + p.guru.total} />
      <Angka ikon="book" label="Jurnal terisi" nilai={p.jadwal.terisi + "/" + p.jadwal.total} />
    </View>}
    {memuat && <Memuat />}
    {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
    {p && <>
      <Baris><Judul kecil>Perlu perhatian</Judul><Lencana teks={String(kategori)} jenis={kategori ? "merah" : "hijau"} /></Baris>
      {!kategori && <Kartu><T redup>Semua guru sudah absen dan semua jadwal sudah diisi.</T></Kartu>}
      {(p.belumAbsen.length > 0 || p.belumJurnal.length > 0) && <View style={s.angka}>
        {p.belumAbsen.length > 0 && <Perhatian nilai={p.belumAbsen.length} warna="merah" judul="Guru belum absen"
          sub={p.belumAbsen.slice(0, 2).map(g => g.nama).join(", ")}
          buka={detail === "guru"} onPress={() => setDetail(detail === "guru" ? null : "guru")} />}
        {p.belumJurnal.length > 0 && <Perhatian nilai={terlambat || p.belumJurnal.length} warna="kuning"
          judul={terlambat ? "Jurnal terlambat" : "Jurnal belum diisi"}
          sub={[...new Set(p.belumJurnal.filter(j => !terlambat || j.lewat).map(j => j.kelas.nama))].slice(0, 3).join(", ")}
          buka={detail === "jurnal"} onPress={() => setDetail(detail === "jurnal" ? null : "jurnal")} />}
      </View>}
      {detail === "guru" && p.belumAbsen.length > 0 && <Kartu>
        {p.belumAbsen.map(g => <T key={g.id}>{g.nama}{g.berjadwal ? " · Ada jadwal" : ""}</T>)}
      </Kartu>}
      {detail === "jurnal" && p.belumJurnal.length > 0 && <Kartu>
        {p.belumJurnal.map(j => <View key={j.id} style={{ paddingVertical: 4 }}>
          <T tebal>{j.guru.nama}</T><T redup>{j.kelas.nama} · {j.mapel.nama} · jam {j.jamMulai}–{j.jamSelesai}</T>
          <T>{j.lewat ? "Terlambat" : "Belum waktunya"}</T>
        </View>)}
      </Kartu>}
      {p.guru.luarRadius > 0 && <Tombol jenis="garis" judul={p.guru.luarRadius + " absen di luar area · Lihat lokasi"} onPress={keGuru} />}
      <GrafikKelas key={tanggal} kelas={p.perKelas} />
      <Tombol jenis="garis" judul={`Kehadiran guru · ${p.guru.sudahAbsen}/${p.guru.total} absen`} onPress={keGuru} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Periksa jurnal, ${p.jadwal.belumDiperiksa} belum diperiksa`}
        style={s.aksi} onPress={() => router.push({ pathname: "/jurnal", params: { tanggal } })}>
        <T tebal style={[s.putih, { flexShrink: 1 }]}>{tanggal === hariIni ? "Periksa jurnal hari ini" : "Periksa jurnal"}</T>
        <T tebal style={{ backgroundColor: W.emas, color: W.teks, borderRadius: 8, paddingHorizontal: 8 }}>{p.jadwal.belumDiperiksa}</T>
      </Pressable>
    </>}
  </Layar>;
}

const s = StyleSheet.create({
  kepala: { backgroundColor: W.utama, marginHorizontal: -16, marginTop: -16, padding: 16, paddingBottom: 32, gap: 8 },
  putih: { color: W.putih },
  tanggal: { flexDirection: "row", minHeight: 48, gap: 8, alignItems: "center" },
  angka: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metrik: { flex: 1, backgroundColor: W.putih, padding: 14, borderRadius: 16, borderColor: W.garis, borderWidth: 1, gap: 3 },
  perhatian: { flex: 1, minHeight: 48, padding: 14, gap: 3, borderRadius: 16 },
  aksi: { backgroundColor: W.teks, borderRadius: 12, minHeight: 48, padding: 12, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
});
