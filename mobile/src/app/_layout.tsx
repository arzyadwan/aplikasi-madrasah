import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PenyediaSesi, useSesi } from "@/lib/sesi";
import { StatusSinkron } from "@/components/status-sinkron";
import { W } from "@/components/ui";

SplashScreen.preventAutoHideAsync();

export default function Akar() {
  return (
    <PenyediaSesi>
      <StatusBar style="light" />
      <Navigasi />
    </PenyediaSesi>
  );
}

function Navigasi() {
  const { memuat, token, saya } = useSesi();
  if (memuat) return null;
  SplashScreen.hide();
  const login = !!token && !!saya;
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: W.utamaTua }, headerTintColor: W.putih, headerTitleStyle: { fontWeight: "700" },
      headerRight: () => <StatusSinkron />,
    }}>
      <Stack.Protected guard={login}>
        <Stack.Screen name="(tab)" options={{ headerShown: false }} />
        <Stack.Screen name="isi/[jadwalId]" options={{ title: "Absen & Jurnal" }} />
        <Stack.Screen name="pengganti" options={{ title: "Guru Pengganti" }} />
        <Stack.Screen name="jurnal" options={{ title: "Jurnal Mengajar" }} />
        <Stack.Screen name="kehadiran-guru" options={{ title: "Kehadiran Guru" }} />
      </Stack.Protected>
      <Stack.Protected guard={!login}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
