import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Hero } from "@/components/v2";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ItemRiwayat } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Baris, Daftar, Kartu, Memuat, Pesan, T, W } from "@/components/ui";

const status = [
  ["H", "hadir", W.hadir, W.utamaMuda], ["S", "sakit", W.biru, W.biruMuda],
  ["I", "izin", W.kuning, W.izinMuda], ["A", "alpa", W.merah, W.merahMuda],
] as const;

export default function Riwayat() {
  const { data, galat, memuat, muat } = useMuat<{ riwayat: ItemRiwayat[] }>("/api/m/riwayat");
  const { zona } = useSaya();
  const [kelas, setKelas] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));
  const semua = data?.riwayat ?? [];
  const pilihan = Array.from(new Set(semua.map(p => p.kelas))).sort();
  const aktif = kelas && pilihan.includes(kelas) ? kelas : null;
  const tampil = aktif ? semua.filter(p => p.kelas === aktif) : semua;
  const hadir = tampil.reduce((n, p) => n + p.rekap.H, 0);
  const total = tampil.reduce((n, p) => n + p.rekap.H + p.rekap.S + p.rekap.I + p.rekap.A, 0);
  const statistik = [[tampil.length, "Pertemuan"]];
  if (tampil.every(p => typeof p.diperiksa === "boolean")) {
    statistik.push([tampil.filter(p => p.diperiksa).length, "Diperiksa"]);
  }
  if (total) statistik.push([`${Math.round(100 * hadir / total)}%`, "Siswa hadir"]);
  const hariIni = tanggalDiZona(zona);

  if (!data && !galat) return <Memuat />;
  return (
    <Daftar data={tampil} refreshing={memuat} onRefresh={muat} renderItem={({ item: p, index }) => {
      const [hari, bulan] = formatTanggal(p.tanggal, false).split(" ");
      return <View style={{ gap: 8 }}>
        {tampil[index - 1]?.tanggal !== p.tanggal && <T tebal>{p.tanggal === hariIni ? "Hari ini" : formatTanggal(p.tanggal)}</T>}
        <Kartu style={{ borderRadius: 18 }}>
          <Baris style={{ alignItems: "flex-start", gap: 12 }}>
            <View style={{ minWidth: 44, minHeight: 48, padding: 4, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: p.diperiksa ? "#E5EDFF" : W.utamaMuda }}>
              <T tebal ukuran={18}>{hari}</T><T ukuran={12}>{bulan.slice(0, 3)}</T>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <T tebal>{p.mapel} · {p.kelas}{p.pengganti ? " (pengganti)" : ""}</T>
              {typeof p.diperiksa === "boolean" && <T tebal ukuran={12} style={{ color: p.diperiksa ? W.utama : W.kuning }}>{p.diperiksa ? "Diperiksa" : "Menunggu periksa"}</T>}
              <T>{p.materi}</T>
              {p.kd && <T redup ukuran={13}>KD: {p.kd}</T>}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                {status.map(([kode, label, color, backgroundColor]) => (kode === "H" || p.rekap[kode] > 0) &&
                  <T key={kode} ringkas ukuran={13} style={{ color, backgroundColor, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>{p.rekap[kode]} {label}</T>)}
                <T ringkas redup ukuran={13}>Jam {p.jamMulai}–{p.jamSelesai}</T>
              </View>
            </View>
          </Baris>
          {p.catatanKepala && <View style={{ borderRadius: 12, padding: 12, backgroundColor: W.latar }}>
            <T><T tebal>{p.diperiksaOleh ?? "Kepala madrasah"}: </T>{p.catatanKepala}</T>
          </View>}
        </Kartu>
      </View>;
    }}>
      <Hero style={{ marginHorizontal: -16, marginTop: -16 }}>
        <T tebal ukuran={22} style={{ color: W.putih }}>Riwayat mengajar</T>
        {data && <Baris style={{ alignItems: "stretch" }}>
          {statistik.map(([nilai, label]) => <View key={label} style={{ flex: 1, gap: 3, backgroundColor: "#1B7258", padding: 10, borderRadius: 14 }}>
            <T ringkas tebal ukuran={20} style={{ color: W.putih }}>{nilai}</T><T ringkas ukuran={12} style={{ color: W.putih }}>{label}</T>
          </View>)}
        </Baris>}
      </Hero>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 5, gap: 8 }}>
        {[null, ...pilihan].map(k => <Pressable key={k ?? "semua-kelas"} accessibilityRole="button" accessibilityState={{ selected: aktif === k }}
          accessibilityLabel={k ?? "Semua kelas, 30 hari terakhir"} onPress={() => setKelas(k)}
          hitSlop={{ top: 5, bottom: 5 }} style={{ minWidth: 48, minHeight: 38, justifyContent: "center", borderRadius: 24, paddingHorizontal: 15, backgroundColor: aktif === k ? W.teks : W.putih }}>
          <T ringkas tebal ukuran={13} style={{ color: aktif === k ? W.putih : W.teks }}>{k ?? "30 hari"}</T>
        </Pressable>)}
      </ScrollView>
      {galat && <Pesan jenis="galat" teks={galat} />}
      {data && !tampil.length && <Kartu><T redup>Belum ada catatan mengajar.</T></Kartu>}
    </Daftar>
  );
}
