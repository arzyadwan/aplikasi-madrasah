import { type ComponentProps, type PropsWithChildren, type ReactNode } from "react";
import { isLoaded } from "expo-font";
import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator, FlatList, type FlatListProps, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";

export const W = {
  utama: "#0F5C45", utamaTua: "#0F5C45", utamaTerang: "#1E7A5E", utamaMuda: "#DDF1E7", utamaLatar: "#E6F3ED",
  teks: "#12211C", redup: "#52635D", garis: "#D6DFDB", latar: "#F2F5F3", putih: "#FFFFFF",
  merah: "#B42318", merahMuda: "#FDE7E4", kuning: "#8A5300", kuningMuda: "#FFF1D2",
  biru: "#2F55C9", biruMuda: "#E5EDFF", hadir: "#11714F", emas: "#F2B544", izinMuda: "#FFF4D6",
};

const keluarga = { 400: "Jakarta400", 500: "Jakarta500", 600: "Jakarta600", 700: "Jakarta700" };
export function huruf(bobot: keyof typeof keluarga): TextStyle {
  const nama = keluarga[bobot];
  return isLoaded(nama) ? { fontFamily: nama } : { fontWeight: bobot };
}

export function Layar({ children, segarkan, memuat, scrollRef }: PropsWithChildren<{ segarkan?: () => void; memuat?: boolean; scrollRef?: ComponentProps<typeof ScrollView>["ref"] }>) {
  const { bottom } = useSafeAreaInsets();
  const [grup] = useSegments();
  return (
    <ScrollView
      ref={scrollRef}
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
  return <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={[kecil ? s.judulKecil : s.judul, huruf(700)]}>{children}</Text>;
}

export function T({ children, redup, tebal, style, ukuran, ringkas, ...baris }: PropsWithChildren<Pick<ComponentProps<typeof Text>, "numberOfLines" | "ellipsizeMode"> & { ringkas?: boolean; redup?: boolean; tebal?: boolean; ukuran?: number; style?: StyleProp<TextStyle> }>) {
  return (
    <Text numberOfLines={ringkas ? 1 : undefined} adjustsFontSizeToFit={ringkas} minimumFontScale={0.8} {...baris} maxFontSizeMultiplier={ringkas || tebal || (ukuran && ukuran <= 13) ? 1.2 : 1.3} style={[{ flexShrink: 1, color: redup ? W.redup : W.teks, fontSize: ukuran ?? 14, ...huruf(tebal ? (ukuran && ukuran >= 16 ? 700 : 600) : 400) }, style]}>
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
    <Pressable hitSlop={2} testID={testID} accessibilityRole="button" accessibilityLabel={judul} accessibilityState={{ selected: terpilih, disabled: !!mati }} disabled={mati} onPress={onPress}
      style={({ pressed }) => [s.tombol, gaya, mati && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}>
      {memuat ? <ActivityIndicator color={warnaTeks} /> : ikon}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.2} style={{ flexShrink: 1, color: warnaTeks, ...huruf(600), fontSize: 14 }}>{judul}</Text>
    </Pressable>
  );
}

export function Masukan({ label, sembunyikanLabel, style, ...props }: TextInputProps & { label: string; sembunyikanLabel?: boolean }) {
  return (
    <View style={{ gap: 4 }}>
      {!sembunyikanLabel && <Text maxFontSizeMultiplier={1.2} style={{ color: W.teks, fontSize: 14, ...huruf(600) }}>{label}</Text>}
      <TextInput maxFontSizeMultiplier={1.3} accessibilityLabel={label} placeholderTextColor={W.redup} style={[s.masukan, huruf(500), props.multiline && { minHeight: 64, textAlignVertical: "top" }, style]} {...props} />
    </View>
  );
}

type JenisLencana = "hijau" | "kuning" | "merah" | "abu" | "biru";
const WARNA_LENCANA: Record<JenisLencana, string> = {
  hijau: W.utama, kuning: W.kuning, merah: W.merah, abu: W.redup, biru: W.biru,
};

export function Lencana({ teks, jenis = "abu" }: { teks: string; jenis?: JenisLencana }) {
  return <T tebal ukuran={12} style={{ color: WARNA_LENCANA[jenis], maxWidth: "48%" }}>{teks}</T>;
}

export type JenisPesan = "ok" | "galat" | "antre" | "info";
export function Pesan({ jenis, teks }: { jenis: JenisPesan; teks: string }) {
  const [bg, fg] = jenis === "ok" ? [W.utamaLatar, W.utamaTua] : jenis === "galat" ? [W.merahMuda, W.merah] : jenis === "antre" ? [W.kuningMuda, W.kuning] : [W.biruMuda, W.biru];
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: bg, borderRadius: 12, padding: 12 }}>
      <Text maxFontSizeMultiplier={1.3} style={{ color: fg, fontSize: 14, ...huruf(500) }}>{teks}</Text>
    </View>
  );
}

export function Memuat({ teks = "Memuat data…" }: { teks?: string }) {
  return <View style={{ padding: 16, alignItems: "center" }}><ActivityIndicator size="large" color={W.utama} /><Text maxFontSizeMultiplier={1.3} accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: W.teks }}>{teks}</Text></View>;
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
      <Pressable accessibilityRole="button" accessibilityLabel="Hari sebelumnya" onPress={() => geser(-1)} style={s.panah}><Text maxFontSizeMultiplier={1.2} style={s.panahTeks}>‹</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={teks + ", kembali ke hari ini"} onPress={() => onUbah(maks)} style={{ minHeight: 48, justifyContent: "center", flex: 1, alignItems: "center" }}>
        <T ringkas tebal>{new Date(tanggal + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</T>
        {tanggal !== maks && <T redup ukuran={12}>Ketuk untuk kembali ke hari ini</T>}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Hari berikutnya" disabled={tanggal >= maks} onPress={() => geser(1)} style={[s.panah, tanggal >= maks && { opacity: 0.3 }]}>
        <Text maxFontSizeMultiplier={1.2} style={s.panahTeks}>›</Text>
      </Pressable>
    </Baris>
  );
}

const s = StyleSheet.create({
  kartu: { backgroundColor: W.putih, borderRadius: 18, elevation: 2, shadowColor: "#0C3C2D", padding: 14, gap: 8 },
  judul: { fontSize: 20, color: W.teks },
  judulKecil: { flexShrink: 1, fontSize: 16, color: W.teks },
  tombol: { minHeight: 48, minWidth: 48, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  tombolUtama: { backgroundColor: W.utama },
  tombolGaris: { backgroundColor: W.putih, borderWidth: 1, borderColor: W.garis },
  tombolBahaya: { backgroundColor: W.putih, borderWidth: 1, borderColor: W.merahMuda },
  tombolTeks: { backgroundColor: "transparent", paddingVertical: 6, paddingHorizontal: 0, justifyContent: "flex-start" },
  masukan: { minHeight: 48, borderWidth: 1, borderColor: W.garis, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: W.teks, backgroundColor: W.putih },
  panah: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  panahTeks: { fontSize: 28, color: W.utama, fontWeight: "700" },
});
