import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSaya } from "@/lib/sesi";
import { StatusSinkron } from "@/components/status-sinkron";
import { W } from "@/components/ui";

type NamaIkon = keyof typeof Ionicons.glyphMap;
function ikon(nama: NamaIkon) {
  return function IkonTab({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={nama} color={color as string} size={size} />;
  };
}

export default function LayoutTab() {
  const { pengguna: u, madrasah } = useSaya();
  const mengajar = u.peran === "GURU" || u.mengajar;
  const pimpinan = u.peran === "KEPALA" || u.peran === "ADMIN";
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: W.utamaTua },
        headerTintColor: W.putih,
        headerTitleStyle: { fontWeight: "700", fontSize: 16 },
        headerTitle: madrasah.nama,
        headerRight: () => <StatusSinkron />,
        tabBarActiveTintColor: W.utama,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Hari Ini", tabBarIcon: ikon("today-outline"), href: mengajar ? undefined : null }} />
      <Tabs.Screen name="pantauan" options={{ title: "Pantauan", tabBarIcon: ikon("stats-chart-outline"), href: pimpinan ? undefined : null }} />
      <Tabs.Screen name="absen" options={{ title: "Absen Saya", tabBarIcon: ikon("location-outline") }} />
      <Tabs.Screen name="riwayat" options={{ title: "Riwayat", tabBarIcon: ikon("time-outline"), href: mengajar ? undefined : null }} />
      <Tabs.Screen name="kelas" options={{ title: "Kelas Saya", tabBarIcon: ikon("people-outline"), href: u.kelasWali.length ? undefined : null }} />
      <Tabs.Screen name="akun" options={{ title: "Akun", tabBarIcon: ikon("person-circle-outline") }} />
    </Tabs>
  );
}
