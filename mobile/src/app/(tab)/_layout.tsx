import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { useSaya } from "@/lib/sesi";
import { StatusSinkron } from "@/components/status-sinkron";
import { huruf, W } from "@/components/ui";
import { getar } from "@/components/v2";

type NamaIkon = keyof typeof Ionicons.glyphMap;
function ikon(nama: NamaIkon, aktif: NamaIkon) {
  return function IkonTab({ focused, color, size }: { focused: boolean; color: unknown; size: number }) {
    return <Ionicons name={focused ? aktif : nama} color={color as string} size={size} />;
  };
}

export default function LayoutTab() {
  const { pengguna: u } = useSaya();
  const mengajar = u.peran === "GURU" || u.mengajar;
  const pimpinan = u.peran === "KEPALA" || u.peran === "ADMIN";
  const insets = useSafeAreaInsets();
  const headerRingkas = () => <View style={{ paddingTop: insets.top, alignItems: "flex-end", backgroundColor: W.utama }}><StatusSinkron /></View>;
  const urutan = ["index", "absen", "kelas", "riwayat", "pantauan"].filter(nama =>
    nama === "riwayat" ? mengajar : nama === "kelas" ? u.kelasWali.length > 0 : nama === "pantauan" ? pimpinan : true);
  return (
    <Tabs tabBar={({ state, descriptors, emitter, navigateToTab }) => (
      <View style={{ backgroundColor: W.latar, paddingBottom: insets.bottom + 10,
        paddingLeft: insets.left + 12, paddingRight: insets.right + 12, paddingTop: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 68,
          backgroundColor: W.putih, borderRadius: 22, paddingHorizontal: 4, elevation: 5, shadowColor: "#0C3C2D" }}>
        {urutan.map(nama => {
          const route = state.routes.find(r => r.name === nama);
          if (!route) return null;
          const aktif = state.routes[state.index].key === route.key;
          const opsi = descriptors[route.key].options;
          const warna = aktif ? W.utama : W.redup;
          const label = typeof opsi.tabBarLabel === "string" ? opsi.tabBarLabel : opsi.title;
          return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: aktif }}
            accessibilityLabel={opsi.title} onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
            onPress={() => {
              const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!aktif && !event.defaultPrevented) { getar(); navigateToTab(route.key); }
            }}
            style={{ flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 3 }}>
            <View style={{ height: 30, alignItems: "center", justifyContent: "center" }}>
              {opsi.tabBarIcon?.({ focused: aktif, color: warna, size: aktif ? 25 : 23 })}
            </View>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.15} adjustsFontSizeToFit minimumFontScale={0.8}
              style={{ ...huruf(aktif ? 700 : 500), fontSize: 11, color: warna }}>{label}</Text>
          </Pressable>;
        })}
        </View>
      </View>
    )}
      screenOptions={{
        header: headerRingkas,
        headerStyle: { backgroundColor: W.utamaTua },
        headerTintColor: W.putih,
        headerTitleStyle: { fontWeight: "700", fontSize: 20 },
        headerRight: () => <StatusSinkron />,
        tabBarActiveTintColor: W.utama,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Beranda", header: headerRingkas, tabBarIcon: ikon("home-outline", "home") }} />
      <Tabs.Screen name="pantauan" options={{ title: "Pantauan", header: headerRingkas, tabBarIcon: ikon("stats-chart-outline", "stats-chart"), href: pimpinan ? undefined : null }} />
      <Tabs.Screen name="absen" options={{ title: "Absen Saya", header: headerRingkas, tabBarLabel: "Absen", tabBarIcon: ikon("location-outline", "location") }} />
      <Tabs.Screen name="riwayat" options={{ title: "Riwayat", tabBarIcon: ikon("time-outline", "time"), href: mengajar ? undefined : null }} />
      <Tabs.Screen name="kelas" options={{ title: "Kelas Saya", tabBarLabel: "Kelas", tabBarIcon: ikon("people-outline", "people"), href: u.kelasWali.length ? undefined : null }} />
      <Tabs.Screen name="akun" options={{ title: "Akun" }} />
    </Tabs>
  );
}
