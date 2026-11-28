import { inisialNama } from "@/lib/nama";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, type PropsWithChildren, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusSinkron } from "./status-sinkron";
import Svg, { Circle } from "react-native-svg";
import { T, W } from "./ui";

export function Hero({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.hero, style]}>
    <View accessible={false} pointerEvents="none" style={styles.besar} />
    {children}
  </View>;
}

const palet = [
  ["#E1F2EA", "#0F5C45"], ["#E5EDFF", "#2F55C9"],
  ["#FFE8DC", "#A74410"], ["#EEE6FF", "#6A44C2"],
];
const absen: Record<string, [string, string, string]> = {
  S: ["#2F55C9", "#FFFFFF", "S"], I: ["#8A5300", "#FFFFFF", "I"], A: ["#A52922", "#FFFFFF", "A"],
};

export function Avatar({ nama, status, size = 40 }: { nama: string; status?: string; size?: number }) {
  let hash = 0;
  for (const huruf of nama) hash = (hash * 31 + huruf.charCodeAt(0)) >>> 0;
  const inisial = inisialNama(nama);
  const [backgroundColor, color, label] = absen[status?.toUpperCase().charAt(0) ?? ""] ?? [...palet[hash % palet.length], inisial];
  return <View importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 2,
    backgroundColor, alignItems: "center", justifyContent: "center" }}>
    <T tebal ukuran={size * 0.34} style={{ color }}>{label}</T>
  </View>;
}

export function Ring({ value, size = 76, children }: PropsWithChildren<{ value: number; size?: number }>) {
  const r = (size - 8) / 2;
  const keliling = 2 * Math.PI * r;
  const persen = Math.min(100, Math.max(0, value));
  return <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg accessible={false} width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D7E8DF" strokeWidth={7} />
      {persen > 0 && <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={W.emas} strokeWidth={7}
        strokeDasharray={[keliling, keliling]} strokeDashoffset={keliling * (1 - persen / 100)}
        rotation={-90} origin={[size / 2, size / 2]} strokeLinecap="round" />}
    </Svg>
    {children}
  </View>;
}

const styles = StyleSheet.create({
  hero: { backgroundColor: W.utama, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, padding: 16, gap: 8, overflow: "hidden" },
  besar: { position: "absolute", right: -40, top: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: "#14694F" },
  segmen: { flexDirection: "row", backgroundColor: "#E3EBE7", borderRadius: 14, padding: 3 },
  segmenItem: { flex: 1, minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  segmenAktif: { backgroundColor: W.putih, elevation: 2, shadowColor: "#0C3C2D", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  kartuDaftar: { backgroundColor: W.putih, borderRadius: 18, paddingHorizontal: 12 },
  baris: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  barisGaris: { borderBottomWidth: 1, borderBottomColor: "#EDF2EF" },
  kerangka: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: W.putih, borderRadius: 18, padding: 14 },
  kerangkaBulat: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E3EBE7" },
  kerangkaGaris: { height: 10, borderRadius: 5, backgroundColor: "#E3EBE7" },
});

/** Getaran halus untuk umpan balik ketukan (diam bila perangkat tidak mendukung). */
export function getar(jenis: "pilih" | "sukses" = "pilih") {
  const p = jenis === "sukses" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.selectionAsync();
  p.catch(() => {});
}

/** Hero untuk layar turunan: tombol kembali, judul, dan penanda antrean di dalam satu blok hijau. */
export function HeroSub({ judul, sub, kanan, children }: PropsWithChildren<{ judul: string; sub?: string; kanan?: ReactNode }>) {
  const { top } = useSafeAreaInsets();
  return <Hero style={{ marginHorizontal: -16, marginTop: -16, paddingTop: top + 14, paddingBottom: 18, gap: 14, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali" hitSlop={4}
        onPress={() => router.canGoBack() ? router.back() : router.navigate("/")}
        style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#1B7258", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="chevron-back" size={22} color={W.putih} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <T ringkas tebal ukuran={18} style={{ color: W.putih }}>{judul}</T>
        {!!sub && <T ringkas ukuran={12} style={{ color: "#BFE0D3" }}>{sub}</T>}
      </View>
      {kanan}
      <StatusSinkron />
    </View>
    {children}
  </Hero>;
}

/** Kontrol segmen: pilihan tunggal dalam satu jalur abu. */
export function Segmen<K extends string>({ pilihan, nilai, onUbah }: { pilihan: { kunci: K; label: string }[]; nilai: K; onUbah: (k: K) => void }) {
  return <View accessibilityRole="tablist" style={styles.segmen}>
    {pilihan.map(p => {
      const aktif = p.kunci === nilai;
      return <Pressable key={p.kunci} accessibilityRole="tab" accessibilityState={{ selected: aktif }}
        onPress={() => { if (!aktif) { getar(); onUbah(p.kunci); } }}
        style={[styles.segmenItem, aktif && styles.segmenAktif]}>
        <T ringkas tebal={aktif} ukuran={13} style={{ color: aktif ? W.teks : W.redup }}>{p.label}</T>
      </Pressable>;
    })}
  </View>;
}

/** Kartu putih berisi baris-baris padat dengan garis pemisah. */
export function KartuDaftar({ children }: PropsWithChildren) {
  return <View style={styles.kartuDaftar}>{children}</View>;
}

export function BarisDaftar({ kiri, judul, sub, subWarna, kanan, akhir, onPress, label }: {
  kiri?: ReactNode; judul: string; sub?: string; subWarna?: string; kanan?: ReactNode; akhir?: boolean; onPress?: () => void; label?: string;
}) {
  const isi = <>
    {kiri}
    <View style={{ flex: 1, minWidth: 0 }}>
      <T numberOfLines={1} tebal>{judul}</T>
      {!!sub && <T numberOfLines={1} ukuran={12} style={{ color: subWarna ?? W.redup }}>{sub}</T>}
    </View>
    {kanan}
  </>;
  const gaya = [styles.baris, !akhir && styles.barisGaris];
  return onPress
    ? <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [...gaya, pressed && { opacity: 0.7 }]}>{isi}</Pressable>
    : <View accessible accessibilityLabel={label} style={gaya}>{isi}</View>;
}

/** Titik status kecil + label (pengganti kartu berwarna penuh). */
export function TitikStatus({ teks, warna }: { teks: string; warna: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: warna }} />
    <T tebal ukuran={12} style={{ color: warna }}>{teks}</T>
  </View>;
}

/** Kerangka abu-abu berdenyut selama data dimuat. */
export function Kerangka({ baris = 3 }: { baris?: number }) {
  const nilai = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(nilai, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(nilai, { toValue: 0.55, duration: 650, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [nilai]);
  return <View accessibilityRole="progressbar" accessibilityLabel="Memuat data" style={{ gap: 10 }}>
    {Array.from({ length: baris }, (_, i) => <Animated.View key={i} style={[styles.kerangka, { opacity: nilai }]}>
      <View style={styles.kerangkaBulat} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.kerangkaGaris, { width: "70%" }]} />
        <View style={[styles.kerangkaGaris, { width: "45%" }]} />
      </View>
    </Animated.View>)}
  </View>;
}

/** Penutup area status bar berwarna hijau, untuk layar tanpa header bawaan yang isinya digulir. */
export function LatarStatus() {
  const { top } = useSafeAreaInsets();
  return <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: top, backgroundColor: W.utama, zIndex: 10 }} />;
}
