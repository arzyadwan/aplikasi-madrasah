import { type PropsWithChildren, type ReactNode } from "react";
import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator, FlatList, type FlatListProps, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";

export const W = {
  utama: "#18734f", utamaTua: "#135c40", utamaMuda: "#d7f2e6", utamaLatar: "#effaf6",
  teks: "#1e293b", redup: "#475569", garis: "#e2e8f0", latar: "#f8fafc", putih: "#ffffff",
  merah: "#b91c1c", merahMuda: "#fee2e2", kuning: "#92400e", kuningMuda: "#fef3c7",
  biru: "#075985", biruMuda: "#e0f2fe",
};

export function Layar({ children, segarkan, memuat }: PropsWithChildren<{ segarkan?: () => void; memuat?: boolean }>) {
  const { bottom } = useSafeAreaInsets();
  const [grup] = useSegments();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: W.latar }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 + (grup === "(tab)" ? 0 : bottom) }}
      keyboardShouldPersistTaps="handled"
      refreshControl={segarkan ? <RefreshControl refreshing={!!memuat} onRefresh={segarkan} colors={[W.utama]} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

/** Satu permukaan gulir untuk formulir dan baris yang dirender sesuai kebutuhan. */
export function Daftar<T extends { id: string }>({ children, ...props }: PropsWithChildren<FlatListProps<T>>) {
  const { bottom } = useSafeAreaInsets();
  const [grup] = useSegments();
  return <FlatList {...props} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
    style={{ flex: 1, backgroundColor: W.latar }}
    contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 + (grup === "(tab)" ? 0 : bottom) }}
    ListHeaderComponent={<View style={{ gap: 12 }}>{children}</View>} />;
}

export function Kartu({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[s.kartu, style]}>{children}</View>;
}

export function Judul({ children, kecil }: PropsWithChildren<{ kecil?: boolean }>) {
  return <Text style={kecil ? s.judulKecil : s.judul}>{children}</Text>;
}

export function T({ children, redup, tebal, style, ukuran }: PropsWithChildren<{ redup?: boolean; tebal?: boolean; ukuran?: number; style?: StyleProp<TextStyle> }>) {
  return (
    <Text style={[{ color: redup ? W.redup : W.teks, fontSize: ukuran ?? 15, fontWeight: tebal ? "600" : "400" }, style]}>
      {children}
    </Text>
  );
}

type JenisTombol = "utama" | "garis" | "bahaya" | "teks";

export function Tombol({ judul, onPress, jenis = "utama", memuat, nonaktif, terpilih, ikon, testID }: {
  judul: string; onPress: () => void; jenis?: JenisTombol; memuat?: boolean; nonaktif?: boolean; terpilih?: boolean; ikon?: ReactNode; testID?: string;
}) {
  const mati = nonaktif || memuat;
  const gaya = jenis === "utama" ? s.tombolUtama : jenis === "garis" ? s.tombolGaris : jenis === "bahaya" ? s.tombolBahaya : s.tombolTeks;
  const warnaTeks = jenis === "utama" ? W.putih : jenis === "bahaya" ? W.merah : W.utama;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={judul} accessibilityState={{ selected: terpilih, disabled: !!mati }} disabled={mati} onPress={onPress}
      style={({ pressed }) => [s.tombol, gaya, mati && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}>
      {memuat ? <ActivityIndicator color={warnaTeks} /> : ikon}
      <Text style={{ flexShrink: 1, color: warnaTeks, fontWeight: "700", fontSize: 15 }}>{judul}</Text>
    </Pressable>
  );
}

export function Masukan({ label, sembunyikanLabel, ...props }: TextInputProps & { label: string; sembunyikanLabel?: boolean }) {
  return (
    <View style={{ gap: 4 }}>
      {!sembunyikanLabel && <Text style={{ color: W.teks, fontSize: 14, fontWeight: "500" }}>{label}</Text>}
      <TextInput accessibilityLabel={label} placeholderTextColor={W.redup} style={[s.masukan, props.multiline && { minHeight: 64, textAlignVertical: "top" }]} {...props} />
    </View>
  );
}

type JenisLencana = "hijau" | "kuning" | "merah" | "abu" | "biru";
const WARNA_LENCANA: Record<JenisLencana, [string, string]> = {
  hijau: [W.utamaMuda, W.utamaTua], kuning: [W.kuningMuda, W.kuning], merah: [W.merahMuda, W.merah],
  abu: ["#f1f5f9", "#475569"], biru: [W.biruMuda, W.biru],
};

export function Lencana({ teks, jenis = "abu" }: { teks: string; jenis?: JenisLencana }) {
  const [bg, fg] = WARNA_LENCANA[jenis];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: "700" }}>{teks}</Text>
    </View>
  );
}

export type JenisPesan = "ok" | "galat" | "antre" | "info";
export function Pesan({ jenis, teks }: { jenis: JenisPesan; teks: string }) {
  const [bg, fg] = jenis === "ok" ? [W.utamaLatar, W.utamaTua] : jenis === "galat" ? [W.merahMuda, W.merah] : jenis === "antre" ? [W.kuningMuda, W.kuning] : [W.biruMuda, W.biru];
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: bg, borderRadius: 10, padding: 12 }}>
      <Text style={{ color: fg, fontSize: 14 }}>{teks}</Text>
    </View>
  );
}

export function Memuat({ teks = "Memuat data…" }: { teks?: string }) {
  return <View style={{ padding: 32, alignItems: "center" }}><ActivityIndicator size="large" color={W.utama} /><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: W.teks }}>{teks}</Text></View>;
}

export function Baris({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, style]}>{children}</View>;
}

export function NavTanggal({ tanggal, teks, maks, onUbah }: { tanggal: string; teks: string; maks: string; onUbah: (t: string) => void }) {
  const geser = (n: number) => {
    const d = new Date(`${tanggal}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    onUbah(d.toISOString().slice(0, 10));
  };
  return (
    <Baris style={s.kartu}>
      <Pressable accessibilityRole="button" accessibilityLabel="Hari sebelumnya" onPress={() => geser(-1)} style={s.panah}><Text style={s.panahTeks}>‹</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={teks + ", kembali ke hari ini"} onPress={() => onUbah(maks)} style={{ minHeight: 48, justifyContent: "center", flex: 1, alignItems: "center" }}>
        <T tebal>{teks}</T>
        {tanggal !== maks && <T redup ukuran={12}>Ketuk untuk kembali ke hari ini</T>}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Hari berikutnya" disabled={tanggal >= maks} onPress={() => geser(1)} style={[s.panah, tanggal >= maks && { opacity: 0.3 }]}>
        <Text style={s.panahTeks}>›</Text>
      </Pressable>
    </Baris>
  );
}

const s = StyleSheet.create({
  kartu: { backgroundColor: W.putih, borderRadius: 14, borderWidth: 1, borderColor: W.garis, padding: 14, gap: 6 },
  judul: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  judulKecil: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  tombol: { minHeight: 48, minWidth: 48, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  tombolUtama: { backgroundColor: W.utama },
  tombolGaris: { backgroundColor: W.putih, borderWidth: 1, borderColor: "#cbd5e1" },
  tombolBahaya: { backgroundColor: W.putih, borderWidth: 1, borderColor: "#fecaca" },
  tombolTeks: { backgroundColor: "transparent", paddingVertical: 6, paddingHorizontal: 0, justifyContent: "flex-start" },
  masukan: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: W.teks, backgroundColor: W.putih },
  panah: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  panahTeks: { fontSize: 28, color: W.utama, fontWeight: "700" },
});
