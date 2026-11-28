import Ionicons from "@expo/vector-icons/Ionicons";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { Alert, AppState, FlatList, Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hapusDariAntrean, isiAntrean, sinkronkan, useAntrean, useTerkirim } from "@/lib/antrean";

import { router } from "expo-router";
import { Judul, Kartu, T, Tombol, W } from "./ui";
import { useSaya } from "@/lib/sesi";
import { tanggalDiZona } from "@/lib/waktu";

/** Penanda di header: offline / jumlah isian yang menunggu dikirim. Kirim otomatis saat online. */
export function StatusSinkron() {
  const insets = useSafeAreaInsets();
  const antrean = useAntrean();
  const terakhir = useTerkirim();
  const { zona } = useSaya();
  const [rincian, setRincian] = useState("");
  const [buka, setBuka] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const coba = () => { if (isiAntrean().some((x) => !x.galat)) void sinkronkan().catch(() => Alert.alert("Gagal membaca atau menyimpan antrean di HP.")); };
    const hentiNet = NetInfo.addEventListener((s) => {
      const ada = s.isConnected !== false && s.isInternetReachable !== false;
      setOnline(ada);
      if (ada) coba();
    });
    const hentiApp = AppState.addEventListener("change", (st) => { if (st === "active") coba(); });
    const t = setInterval(coba, 60000);
    return () => { hentiNet(); hentiApp.remove(); clearInterval(t); };
  }, []);

  const gagal = antrean.filter(x => x.galat).length;
  const tunggu = antrean.length - gagal;
  const teks = [online ? "" : "Offline", tunggu ? `${tunggu} menunggu` : "", gagal ? `${gagal} perlu diperbaiki` : ""].filter(Boolean).join(" · ") || "Terkirim";
  if (online && !antrean.length && !terakhir && !buka) return null;
  return <>
    <Pressable accessibilityRole="button" onPress={() => setBuka(true)} accessibilityLabel={`Antrean pengiriman. ${teks}`} style={{ minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
      <Ionicons name={gagal ? "alert-circle-outline" : !online ? "cloud-offline-outline" : antrean.length ? "cloud-upload-outline" : "checkmark-circle-outline"} size={22} color={W.putih} />
      {antrean.length > 0 && <Text maxFontSizeMultiplier={1.2} style={{ color: W.putih }}>{antrean.length}</Text>}
    </Pressable>
    <Modal visible={buka} onRequestClose={() => setBuka(false)} animationType="slide">
      <FlatList data={antrean} keyExtractor={x => x.id} style={{ backgroundColor: W.latar }}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, gap: 12 }}
        ListHeaderComponent={<View style={{ gap: 10 }}>
          <Judul>Antrean pengiriman</Judul>
          {terakhir && <T>Terkirim · {terakhir}</T>}
          <Tombol jenis="garis" judul="Tutup" onPress={() => setBuka(false)} />
        </View>}
        renderItem={({ item: x }) => <Kartu>
          <T tebal>{x.label}</T>
          <T>{x.galat ? `Perlu diperbaiki. ${x.galat}` : `Tersimpan di HP, menunggu dikirim. ${x.alasanTunda ?? ""}`}</T>
          {x.galat && <>
            {x.body.tanggal === tanggalDiZona(zona) ? <Tombol judul="Perbaiki isian" onPress={() => {
              setBuka(false);
              if (x.path === "/api/absen-guru") router.navigate({ pathname: "/absen", params: { antreanId: x.id } });
              else router.push({ pathname: "/isi/[jadwalId]", params: { jadwalId: String(x.body.jadwalId), antreanId: x.id } });
            }} /> : <>
              <T>Tanggal sudah lewat. Isian hanya dapat dikoreksi pada hari yang sama.</T>
              <Tombol jenis="garis" judul="Lihat isian" onPress={() => setRincian(rincian === x.id ? "" : x.id)} />
              {rincian === x.id && <>
                {[["Materi", "materi"], ["KD", "kd"], ["Catatan", "catatan"], ["Status", "status"], ["Keterangan", "keterangan"], ["Lintang", "lat"], ["Bujur", "lng"]].map(([label, key]) =>
                  x.body[key] != null && <T key={key}>{label}: {String(x.body[key])}</T>)}
                {Array.isArray(x.body.absensi) && x.body.absensi.map(a => <T key={a.siswaId}>{x.jadwal?.siswa.find(s => s.id === a.siswaId)?.nama ?? a.siswaId} · {a.status} {a.keterangan}</T>)}
                {typeof x.body.foto === "string" && <Image accessibilityLabel="Foto absen" source={{ uri: x.body.foto }} style={{ width: 140, height: 180 }} />}
              </>}
            </>}
            <Tombol jenis="teks" judul="Buang isian" onPress={() => Alert.alert("Buang isian ini?", x.label, [
              { text: "Batal" }, { text: "Buang", style: "destructive", onPress: () => { void hapusDariAntrean(x.id).catch(() => Alert.alert("Gagal membuang isian.")); } },
            ])} />
          </>}
        </Kartu>}
        ListFooterComponent={tunggu ? <Tombol judul="Kirim sekarang" onPress={() => { void sinkronkan().catch(() => Alert.alert("Gagal menyimpan antrean.")); }} /> : undefined} />
    </Modal>
  </>;
}
