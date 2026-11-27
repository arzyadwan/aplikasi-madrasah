import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** Token login disimpan terenkripsi di HP (SecureStore). Di web (untuk pengujian) memakai localStorage. */
export async function simpanRahasia(kunci: string, nilai: string | null) {
  if (Platform.OS === "web") {
    if (nilai === null) localStorage.removeItem(kunci); else localStorage.setItem(kunci, nilai);
    return;
  }
  if (nilai === null) await SecureStore.deleteItemAsync(kunci);
  else await SecureStore.setItemAsync(kunci, nilai);
}

export async function bacaRahasia(kunci: string): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(kunci);
  return SecureStore.getItemAsync(kunci);
}

export async function simpanJson<T>(kunci: string, nilai: T) {
  await AsyncStorage.setItem(kunci, JSON.stringify(nilai));
}

export async function bacaJson<T>(kunci: string): Promise<T | null> {
  const s = await AsyncStorage.getItem(kunci);
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

export async function hapus(...kunci: string[]) {
  await AsyncStorage.multiRemove(kunci);
}
