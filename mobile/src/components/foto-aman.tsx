import { useEffect, useState } from "react";
import { Image, View, type ImageStyle, type StyleProp } from "react-native";
import { alamatServer, headerAuth } from "@/lib/api";

/** Foto absen dari server (butuh token), diunduh lalu ditampilkan */
export function FotoAman({ absenId, label, style }: { absenId: string; label: string; style: StyleProp<ImageStyle> }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    fetch(`${alamatServer()}/api/foto/${absenId}`, { headers: headerAuth() })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("gagal"))))
      .then((blob) => new Promise<string>((ok, gagal) => {
        const baca = new FileReader();
        baca.onloadend = () => (typeof baca.result === "string" ? ok(baca.result) : gagal(new Error("gagal")));
        baca.onerror = () => gagal(new Error("gagal"));
        baca.readAsDataURL(blob);
      }))
      .then((d) => { if (!batal) setUri(d); })
      .catch(() => {});
    return () => { batal = true; };
  }, [absenId]);
  if (!uri) return <View style={[{ backgroundColor: "#e2e8f0" }, style as object]} />;
  return <Image alt={label} accessibilityLabel={label} source={{ uri }} style={style} />;
}
