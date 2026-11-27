import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rapikanAlamat } from "@/lib/api";
import { useSesi } from "@/lib/sesi";
import { Kartu, Masukan, Pesan, T, Tombol, W } from "@/components/ui";

export default function Login() {
  const { masuk, alamat: alamatTersimpan } = useSesi();
  const [alamat, setAlamat] = useState(alamatTersimpan);
  const [username, setUsername] = useState("");
  const [sandi, setSandi] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [aturServer, setAturServer] = useState(!alamatTersimpan);

  async function kirim() {
    setGalat(null);
    if (!alamat.trim()) { setGalat("Isi alamat server madrasah."); setAturServer(true); return; }
    if (!username.trim() || !sandi) { setGalat("Isi nama pengguna dan kata sandi."); return; }
    setProses(true);
    try {
      await masuk(alamat, username.trim().toLowerCase(), sandi);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal masuk.");
    } finally {
      setProses(false);
    }
  }

  const tidakAman = rapikanAlamat(alamat).startsWith("http://");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: W.utamaLatar }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", gap: 6 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: W.utama, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: W.putih, fontSize: 30, fontWeight: "800" }}>M</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>Aplikasi Madrasah</Text>
            <T redup>Kehadiran dan jurnal mengajar</T>
          </View>
          <Kartu style={{ gap: 14, padding: 18 }}>
            {aturServer ? (
              <Masukan label="Alamat server madrasah" value={alamat} onChangeText={setAlamat} placeholder="contoh: absen.madrasah.sch.id"
                autoCapitalize="none" autoCorrect={false} keyboardType="url" testID="alamat" />
            ) : (
              <Tombol jenis="teks" judul={`Server: ${alamat.replace(/^https?:\/\//, "")} (ubah)`} onPress={() => setAturServer(true)} />
            )}
            {aturServer && tidakAman && <Pesan jenis="info" teks="Alamat memakai http (tidak terenkripsi). Gunakan https untuk pemakaian sehari-hari." />}
            <Masukan label="Nama pengguna" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} testID="username" />
            <Masukan label="Kata sandi" value={sandi} onChangeText={setSandi} secureTextEntry testID="sandi" onSubmitEditing={kirim} />
            {galat && <Pesan jenis="galat" teks={galat} />}
            <Tombol judul={proses ? "Memeriksa…" : "Masuk"} onPress={kirim} memuat={proses} testID="tombol-masuk" />
          </Kartu>
          <T redup ukuran={12} style={{ textAlign: "center" }}>Lupa kata sandi? Hubungi operator atau TU madrasah.</T>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
