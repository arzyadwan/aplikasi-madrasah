import { useEffect, useState } from "react";
import { Image, Platform, View, type ImageStyle, type StyleProp } from "react-native";
import { W } from "./ui";
import { alamatServer, headerAuth } from "@/lib/api";

/** Foto absen dari server (butuh token), diunduh lalu ditampilkan */
type Props = { absenId: string; label: string; style: StyleProp<ImageStyle> };

export function FotoAman(props: Props) {
  if (Platform.OS === "web") return <FotoWeb key={props.absenId} {...props} />;
  return <Image accessibilityLabel={props.label} resizeMethod="resize" resizeMode="cover" style={props.style}
    source={{ uri: `${alamatServer()}/api/foto/${props.absenId}`, headers: headerAuth() }} />;
}

function FotoWeb({ absenId, label, style }: Props) {
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
  if (!uri) return <View style={[{ backgroundColor: W.garis }, style as object]} />;
  return <Image alt={label} accessibilityLabel={label} source={{ uri }} style={style} />;
}
