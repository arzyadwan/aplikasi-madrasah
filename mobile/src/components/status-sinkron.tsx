import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { Alert, AppState, Pressable, Text } from "react-native";
import { hapusDariAntrean, isiAntrean, sinkronkan, useAntrean } from "@/lib/antrean";

/** Penanda di header: offline / jumlah isian yang menunggu dikirim. Kirim otomatis saat online. */
export function StatusSinkron() {
  const antrean = useAntrean();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const coba = () => { if (isiAntrean().some((x) => !x.galat)) void sinkronkan(); };
    const hentiNet = NetInfo.addEventListener((s) => {
      const ada = s.isConnected !== false && s.isInternetReachable !== false;
      setOnline(ada);
      if (ada) coba();
    });
    const hentiApp = AppState.addEventListener("change", (st) => { if (st === "active") coba(); });
    const t = setInterval(coba, 60000);
    return () => { hentiNet(); hentiApp.remove(); clearInterval(t); };
  }, []);

  if (online && antrean.length === 0) return null;
  const ditolak = antrean.filter((x) => x.galat);
  const teks = [!online ? "Offline" : "", antrean.length ? `${antrean.length} menunggu` : ""].filter(Boolean).join(" · ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={teks}
      onPress={() => {
        if (ditolak.length) {
          Alert.alert("Isian ditolak server", ditolak.map((x) => `• ${x.label}: ${x.galat}`).join("\n"),
            [{ text: "Tutup" }, { text: "Hapus yang ditolak", style: "destructive", onPress: () => ditolak.forEach((x) => void hapusDariAntrean(x.id)) }]);
        } else if (online) {
          void sinkronkan();
        } else {
          Alert.alert("Sedang offline", "Isian tersimpan di HP dan akan dikirim otomatis saat internet tersambung.");
        }
      }}
      style={{ backgroundColor: online ? "#fcd34d" : "#e2e8f0", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginRight: 12 }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: online ? "#451a03" : "#1e293b" }}>{teks}</Text>
    </Pressable>
  );
}
