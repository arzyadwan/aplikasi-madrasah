import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Hero } from "@/components/v2";
import { Madrasah } from "@/components/ilustrasi";
import { SafeAreaView } from "react-native-safe-area-context";
import { rapikanAlamat } from "@/lib/api";
import { useSesi } from "@/lib/sesi";
import { Judul, Kartu, Masukan, Pesan, T, Tombol, W } from "@/components/ui";

export default function Login() {
  const { masuk, alamat: alamatTersimpan } = useSesi();
  const [alamat, setAlamat] = useState(alamatTersimpan);
  const [username, setUsername] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: W.utama }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={{ backgroundColor: W.latar }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          <Hero style={{ alignItems: "center", paddingTop: 28, paddingBottom: 62, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
            <Madrasah width={190} height={150} />
            <T tebal ukuran={22} style={{ color: W.putih }}>Aplikasi Madrasah</T>
            <T style={{ color: "#DBF1E7" }}>Kehadiran &amp; catatan mengajar</T>
          </Hero>
          <Kartu style={{ marginHorizontal: 16, marginTop: -36, borderRadius: 24, padding: 20, gap: 14 }}>
            <Judul kecil>Assalamu'alaikum</Judul>
            {aturServer && <Masukan label="Alamat server madrasah" value={alamat} onChangeText={setAlamat} placeholder="contoh: absen.madrasah.sch.id"
              autoCapitalize="none" autoCorrect={false} keyboardType="url" testID="alamat" />}
            {aturServer && tidakAman && <Pesan jenis="info" teks="Alamat memakai http (tidak terenkripsi). Gunakan https untuk pemakaian sehari-hari." />}
            <Masukan label="Nama pengguna" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" testID="username" />
            <View>
              <Masukan label="Kata sandi" value={sandi} onChangeText={setSandi} secureTextEntry={!lihat} autoComplete="current-password" testID="sandi" onSubmitEditing={kirim}
                style={{ minHeight: 48, borderRadius: 12, borderColor: W.garis, borderWidth: 1, paddingHorizontal: 12, paddingRight: 50, color: W.teks }} />
              <Pressable accessibilityRole="button" accessibilityLabel={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onPress={() => setLihat(!lihat)}
                style={{ position: "absolute", bottom: 0, right: 0, width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={lihat ? "eye-off-outline" : "eye-outline"} size={20} color={W.redup} />
              </Pressable>
            </View>
            {galat && <Pesan jenis="galat" teks={galat} />}
            <Tombol judul={proses ? "Memeriksa…" : "Masuk"} onPress={kirim} memuat={proses} testID="tombol-masuk" />
            <T redup ukuran={12} style={{ textAlign: "center" }}>Lupa kata sandi? Hubungi operator atau TU madrasah.</T>
          </Kartu>
          {!aturServer && <View style={{ alignItems: "center", paddingHorizontal: 16 }}>
            <Tombol jenis="teks" judul={`Server: ${alamat.replace(/^https?:\/\//, "")} · Ubah`} onPress={() => setAturServer(true)} />
          </View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
