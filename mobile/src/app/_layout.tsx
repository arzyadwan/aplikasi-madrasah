import { useEffect } from "react";
import { useFonts } from "expo-font";
import { PlusJakartaSans_400Regular as Jakarta400 } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium as Jakarta500 } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold as Jakarta600 } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold as Jakarta700 } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PenyediaSesi, useSesi } from "@/lib/sesi";
import { StatusSinkron } from "@/components/status-sinkron";
import { huruf, W } from "@/components/ui";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Akar() {
  return (
    <PenyediaSesi>
      <Navigasi />
    </PenyediaSesi>
  );
}

function Navigasi() {
  const { memuat, token, saya } = useSesi();
  const [fontSiap, galatFont] = useFonts({ Jakarta400, Jakarta500, Jakarta600, Jakarta700 });
  const siap = !memuat && (fontSiap || !!galatFont);
  useEffect(() => { if (siap) SplashScreen.hide(); }, [siap]);
  if (!siap) return null;
  const login = !!token && !!saya;
  return (
    <><StatusBar style="light" />
    <Stack screenOptions={{
      headerStyle: { backgroundColor: W.utamaTua }, headerTintColor: W.putih, headerTitleStyle: { ...huruf(700), fontSize: 20 }, headerShadowVisible: false,
      headerRight: () => <StatusSinkron />,
    }}>
      <Stack.Protected guard={login}>
        <Stack.Screen name="(tab)" options={{ headerShown: false }} />
        <Stack.Screen name="isi/[jadwalId]" options={{ title: "Absen & Catatan", headerShown: false }} />
        <Stack.Screen name="pengganti" options={{ title: "Guru Pengganti", headerShown: false }} />
        <Stack.Screen name="jurnal" options={{ title: "Periksa Catatan", headerShown: false }} />
        <Stack.Screen name="kehadiran-guru" options={{ title: "Kehadiran Guru", headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!login}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack></>
  );
}
