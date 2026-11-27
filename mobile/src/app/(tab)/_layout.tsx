import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const { pengguna: u } = useSaya();
  const mengajar = u.peran === "GURU" || u.mengajar;
  const pimpinan = u.peran === "KEPALA" || u.peran === "ADMIN";
  const insets = useSafeAreaInsets();
  const urutan = ["index", "absen", "kelas", "pantauan", "riwayat", "akun"].filter(nama =>
    nama === "index" || nama === "riwayat" ? mengajar : nama === "kelas" ? u.kelasWali.length > 0 : nama === "pantauan" ? pimpinan : true);
  return (
    <Tabs tabBar={({ state, descriptors, emitter, navigateToTab }) => (
      <View style={{ flexDirection: "row", paddingBottom: insets.bottom, paddingLeft: insets.left,
        paddingRight: insets.right, backgroundColor: W.putih, borderTopColor: W.garis, borderTopWidth: 1 }}>
        {urutan.map(nama => {
          const route = state.routes.find(r => r.name === nama);
          if (!route) return null;
          const aktif = state.routes[state.index].key === route.key;
          const opsi = descriptors[route.key].options;
          const warna = aktif ? W.utamaTua : W.redup;
          return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: aktif }}
            accessibilityLabel={opsi.title} onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
            onPress={() => {
              const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!aktif && !event.defaultPrevented) navigateToTab(route.key);
            }}
            style={{ flex: 1, minWidth: 48, height: 60, gap: 2, alignItems: "center", justifyContent: "center",
              backgroundColor: aktif ? W.utamaLatar : W.putih }}>
            {opsi.tabBarIcon?.({ focused: aktif, color: warna, size: 20 })}
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} adjustsFontSizeToFit
              style={{ width: "100%", fontSize: 12, textAlign: "center", color: warna }}>
              {typeof opsi.tabBarLabel === "string" ? opsi.tabBarLabel : opsi.title}
            </Text>
          </Pressable>;
        })}
      </View>
    )}
      screenOptions={{
        headerStyle: { backgroundColor: W.utamaTua },
        headerTintColor: W.putih,
        headerTitleStyle: { fontWeight: "700", fontSize: 16 },
        headerRight: () => <StatusSinkron />,
        tabBarActiveTintColor: W.utama,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Hari Ini", tabBarIcon: ikon("today-outline"), href: mengajar ? undefined : null }} />
      <Tabs.Screen name="pantauan" options={{ title: "Pantauan", tabBarIcon: ikon("stats-chart-outline"), href: pimpinan ? undefined : null }} />
      <Tabs.Screen name="absen" options={{ title: "Absen Saya", tabBarLabel: "Absen", tabBarIcon: ikon("location-outline") }} />
      <Tabs.Screen name="riwayat" options={{ title: "Riwayat", tabBarIcon: ikon("time-outline"), href: mengajar ? undefined : null }} />
      <Tabs.Screen name="kelas" options={{ title: "Kelas Saya", tabBarLabel: "Kelas", tabBarIcon: ikon("people-outline"), href: u.kelasWali.length ? undefined : null }} />
      <Tabs.Screen name="akun" options={{ title: "Akun", tabBarIcon: ikon("person-circle-outline") }} />
    </Tabs>
  );
}
