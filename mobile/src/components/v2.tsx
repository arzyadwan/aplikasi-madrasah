import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
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
  const inisial = nama.split(",")[0].trim().split(/\s+/).slice(0, 2).map(kata => kata[0]).join("").toUpperCase();
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
});
