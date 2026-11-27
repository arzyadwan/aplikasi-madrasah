import { Alert, Platform } from "react-native";

/** Dialog ya/tidak yang juga berfungsi di web (Alert.alert tidak bekerja di web) */
export function konfirmasi(judul: string, pesan: string, ya = "Lanjutkan"): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(`${judul}\n\n${pesan}`));
  return new Promise((selesai) => {
    Alert.alert(judul, pesan, [
      { text: "Batal", style: "cancel", onPress: () => selesai(false) },
      { text: ya, onPress: () => selesai(true) },
    ], { cancelable: true, onDismiss: () => selesai(false) });
  });
}
