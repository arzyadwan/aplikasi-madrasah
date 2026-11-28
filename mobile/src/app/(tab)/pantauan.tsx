import { BarisDaftar, getar, Hero, Kerangka, KartuDaftar } from "@/components/v2";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Judul, Kartu, Layar, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ResponsPantauan } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";

function Angka({ label, nilai, total, sub, ikon, onPress }: {
  label: string; nilai: number; total: number; sub: string; ikon: "people-outline" | "document-text-outline"; onPress: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  const guru = ikon === "people-outline";
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${nilai} dari ${total}. ${sub}`} onPress={onPress}
    style={({ pressed }) => [s.metrik, { minWidth: 120 * fontScale }, pressed && { opacity: 0.8 }]}>
    <View style={[s.ikonKotak, { backgroundColor: guru ? W.utamaMuda : "#FFE8DC" }]}>
      <Ionicons name={ikon} size={18} color={guru ? W.utama : "#B24A12"} />
    </View>
    <T ringkas tebal ukuran={24}>{nilai}<T tebal ukuran={13} redup>/{total}</T></T>
    <T ringkas tebal ukuran={12} redup>{label}</T>
    <T ringkas ukuran={11} redup>{sub}</T>
  </Pressable>;
}

function Titik({ warna }: { warna: string }) {
  return <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: warna }} />;
}

const Panah = () => <Ionicons name="chevron-forward" size={16} color="#8A9A93" />;

function KehadiranKelas({ kelas }: { kelas: ResponsPantauan["perKelas"] }) {
  const [pilihan, pilih] = useState("");
  return <Kartu style={{ gap: 10 }}>
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
      <Judul kecil>Kehadiran per kelas</Judul>
      {kelas.length > 0 && <T ukuran={11} redup>ketuk untuk rincian</T>}
    </View>
    {kelas.length === 0 && <T redup>Belum ada data kelas.</T>}
    <View>{kelas.map(k => {
      const { H, S, I, A } = k.rekap;
      const total = H + S + I + A;
      const nilai = total ? Math.round(100 * H / total) : null;
      const buka = pilihan === k.id;
      return <View key={k.id}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: buka }}
          accessibilityLabel={`${k.nama}, ${nilai == null ? "belum ada data" : nilai + "% hadir"}`}
          onPress={() => { getar(); pilih(buka ? "" : k.id); }} style={s.barisKelas}>
          <T ringkas tebal ukuran={12} style={{ width: 52, color: nilai == null ? "#8A9A93" : W.teks }}>{k.nama}</T>
          <View style={s.jalurKelas}>
            {nilai != null && <View style={{ width: `${nilai}%`, height: 10, borderRadius: 5, backgroundColor: nilai < 90 ? W.emas : W.utama }} />}
          </View>
          <T ringkas tebal={nilai != null} ukuran={12} style={{ width: 40, textAlign: "right", color: nilai == null ? "#8A9A93" : nilai < 90 ? W.kuning : W.teks }}>{nilai == null ? "belum" : nilai}</T>
        </Pressable>
        {buka && <View style={s.rincianKelas}>
          <T tebal ukuran={13}>Jurnal {k.terisi}/{k.jadwal} · {k.jumlahSiswa} siswa</T>
          <T ukuran={12}>Hadir {H} · Sakit {S} · Izin {I} · Alpa {A}</T>
          {k.tidakHadir.map((siswa, i) => <T key={i} redup ukuran={12}>{siswa.nama} · {siswa.status.join(", ")}</T>)}
        </View>}
      </View>;
    })}</View>
  </Kartu>;
}

/** "Sabtu, 28 November 2026" -> "Sab, 28 Nov" */
function tanggalPendek(teks: string) {
  const [hari, tgl, bulan] = teks.replace(",", "").split(" ");
  return `${hari.slice(0, 3)}, ${tgl} ${bulan.slice(0, 3)}`;
}

function trenPekanLalu(kini: number | null, lalu?: number | null) {
  if (kini == null || lalu == null) return null;
  const beda = kini - lalu;
  return beda === 0 ? { teks: "sama dengan pekan lalu", panah: "" } : { teks: `${Math.abs(beda)}% dari pekan lalu`, panah: beda > 0 ? "▲ " : "▼ " };
}

export default function Pantauan() {
  const { zona, madrasah } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const [tanggal, setTanggal] = useState(hariIni);
  const [detailJurnal, setDetailJurnal] = useState(false);
  const [pilihTanggal, setPilihTanggal] = useState(false);
  const { data: p, galat, memuat, muat } = useMuat<ResponsPantauan>(`/api/m/pantauan?tanggal=${tanggal}`);
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));
  const keGuru = () => router.push({ pathname: "/kehadiran-guru", params: { tanggal } });
  const keJurnal = () => router.push({ pathname: "/jurnal", params: { tanggal } });
  const terlambat = p?.belumJurnal.filter(j => j.lewat).length ?? 0;
  const berjadwal = p?.belumAbsen.filter(g => g.berjadwal).length ?? 0;
  const rekap = p?.perKelas.reduce((r, k) => ({ S: r.S + k.rekap.S, I: r.I + k.rekap.I, A: r.A + k.rekap.A }), { S: 0, I: 0, A: 0 });
  const tren = p ? trenPekanLalu(p.siswa.persenHadir, p.siswa.persenPekanLalu) : null;
  const ada = p ? p.belumAbsen.length + p.belumJurnal.length + p.guru.luarRadius > 0 : false;

  return <Layar segarkan={muat} memuat={memuat}>
    <Hero style={s.kepala}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <T ringkas ukuran={12} style={{ color: "#CFE8DD" }}>{madrasah.nama}</T>
          <T tebal ukuran={22} style={s.putih}>{tanggal === hariIni ? "Pantauan hari ini" : "Pantauan"}</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={"Ganti tanggal, " + formatTanggal(tanggal)}
          accessibilityState={{ expanded: pilihTanggal }} onPress={() => setPilihTanggal(!pilihTanggal)} style={s.tanggal}>
          <Ionicons name="calendar-outline" color={W.putih} size={16} />
          <T tebal ukuran={12} style={s.putih}>{tanggalPendek(formatTanggal(tanggal))}</T>
        </Pressable>
      </View>
      {pilihTanggal && <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={t => { setTanggal(t); setDetailJurnal(false); }} />}
      {p && <View accessible accessibilityLabel={`${p.siswa.persenHadir ?? "belum ada data"} persen siswa hadir${tren ? ", " + (tren.panah.includes("▲") ? "naik " : tren.panah ? "turun " : "") + tren.teks : ""}`}
        style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <View>
          <T tebal ukuran={12} style={{ color: "#CFE8DD" }}>Siswa hadir</T>
          <T tebal ukuran={44} style={[s.putih, { lineHeight: 50 }]}>{p.siswa.persenHadir == null ? "—" : p.siswa.persenHadir + "%"}</T>
          {tren && <T ukuran={12} style={{ color: "#CFE8DD" }}><T tebal ukuran={12} style={{ color: "#7FD1AE" }}>{tren.panah}</T>{tren.teks}</T>}
        </View>
        {rekap && (rekap.S + rekap.I + rekap.A > 0) && <T ukuran={11} style={{ color: "#CFE8DD", textAlign: "right" }}>{rekap.S} sakit · {rekap.I} izin · {rekap.A} alpa</T>}
      </View>}
    </Hero>
    {p && <View style={[s.angka, { marginTop: -30 }]}>
      <Angka ikon="people-outline" label="Guru sudah absen" nilai={p.guru.sudahAbsen} total={p.guru.total}
        sub={`${p.guru.hadir} hadir · ${p.guru.sudahAbsen - p.guru.hadir} izin/sakit`} onPress={keGuru} />
      <Angka ikon="document-text-outline" label="Jurnal terisi" nilai={p.jadwal.terisi} total={p.jadwal.total}
        sub={`${p.jadwal.belumDiperiksa} belum diperiksa`} onPress={keJurnal} />
    </View>}
    {memuat && !p && <Kerangka baris={3} />}
    {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
    {p && <>
      {ada ? <KartuDaftar>
        {p.belumAbsen.length > 0 && <BarisDaftar kiri={<Titik warna={W.merah} />} judul={`${p.belumAbsen.length} guru belum absen`}
          sub={berjadwal ? `${berjadwal} punya jadwal ${tanggal === hariIni ? "hari ini" : ""}`.trim() : "tidak ada yang berjadwal"}
          kanan={<Panah />} onPress={keGuru} label={`${p.belumAbsen.length} guru belum absen, ${berjadwal} punya jadwal. Buka kehadiran guru`}
          akhir={!p.belumJurnal.length && !p.guru.luarRadius} />}
        {p.belumJurnal.length > 0 && <BarisDaftar kiri={<Titik warna="#D99A1E" />}
          judul={terlambat ? `${terlambat} jurnal terlambat` : `${p.belumJurnal.length} jurnal belum diisi`}
          sub={[...new Set(p.belumJurnal.filter(j => !terlambat || j.lewat).map(j => j.kelas.nama))].slice(0, 4).join(", ")}
          kanan={<Ionicons name={detailJurnal ? "chevron-up" : "chevron-down"} size={16} color="#8A9A93" />}
          onPress={() => { getar(); setDetailJurnal(!detailJurnal); }} label="Jurnal belum diisi, ketuk untuk rincian"
          akhir={!p.guru.luarRadius && !detailJurnal} />}
        {detailJurnal && p.belumJurnal.map((j, i) => <BarisDaftar key={j.id} judul={j.guru.nama}
          sub={`${j.kelas.nama} · ${j.mapel.nama} · jam ${j.jamMulai}–${j.jamSelesai} · ${j.lewat ? "terlambat" : "belum waktunya"}`}
          subWarna={j.lewat ? W.kuning : undefined} akhir={!p.guru.luarRadius && i === p.belumJurnal.length - 1} />)}
        {p.guru.luarRadius > 0 && <BarisDaftar kiri={<Titik warna={W.biru} />} judul={`${p.guru.luarRadius} absen di luar area`}
          sub="lihat lokasi di daftar kehadiran" kanan={<Panah />} onPress={keGuru} akhir />}
      </KartuDaftar> : <Kartu><T redup>Semua guru sudah absen dan semua jadwal sudah diisi.</T></Kartu>}
      <KehadiranKelas key={tanggal} kelas={p.perKelas} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Periksa jurnal, ${p.jadwal.belumDiperiksa} belum diperiksa`}
        style={({ pressed }) => [s.aksi, pressed && { opacity: 0.85 }]} onPress={keJurnal}>
        <T tebal style={[s.putih, { flexShrink: 1 }]}>{tanggal === hariIni ? "Periksa jurnal hari ini" : "Periksa jurnal"}</T>
        {p.jadwal.belumDiperiksa > 0 && <T tebal style={s.lencanaEmas}>{p.jadwal.belumDiperiksa}</T>}
      </Pressable>
    </>}
  </Layar>;
}

const s = StyleSheet.create({
  kepala: { backgroundColor: W.utama, marginHorizontal: -16, marginTop: -16, padding: 16, paddingBottom: 44, gap: 12 },
  putih: { color: W.putih },
  tanggal: { flexDirection: "row", minHeight: 44, gap: 6, alignItems: "center", paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#1B7258" },
  angka: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metrik: { flex: 1, backgroundColor: W.putih, padding: 14, borderRadius: 20, gap: 4, elevation: 4, shadowColor: "#0C3C2D", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  ikonKotak: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  barisKelas: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
  jalurKelas: { flex: 1, height: 10, borderRadius: 5, backgroundColor: "#EDF2EF", overflow: "hidden" },
  rincianKelas: { backgroundColor: W.latar, borderRadius: 12, padding: 10, gap: 3, marginBottom: 6 },
  aksi: { backgroundColor: W.teks, borderRadius: 16, minHeight: 52, padding: 12, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  lencanaEmas: { backgroundColor: W.emas, color: "#3D2600", borderRadius: 8, paddingHorizontal: 8, overflow: "hidden" },
});
