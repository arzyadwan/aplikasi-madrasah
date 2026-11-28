import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Hero } from "@/components/v2";
import { Pressable, View } from "react-native";
import { minta } from "@/lib/api";
import { useAntrean } from "@/lib/antrean";
import { konfirmasi } from "@/lib/konfirmasi";
import { useSaya, useSesi } from "@/lib/sesi";
import { LABEL_PERAN } from "@/lib/tipe";
import { namaPanggilan } from "@/lib/nama";
import { Baris, Kartu, Layar, Masukan, Pesan, T, Tombol, W, type JenisPesan } from "@/components/ui";

export default function Akun() {
  const { pengguna: u, madrasah } = useSaya();
  const { alamat, keluar, gantiToken } = useSesi();
  const antrean = useAntrean();
  const gagal = antrean.filter(x => x.galat).length;
  const [buka, setBuka] = useState(false);
  const [lihatAntrean, setLihatAntrean] = useState(false);
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: JenisPesan; teks: string } | null>(null);

  async function ganti() {
    setPesan(null);
    if (baru.length < 8) { setPesan({ jenis: "galat", teks: "Kata sandi baru minimal 8 karakter." }); return; }
    if (baru !== ulang) { setPesan({ jenis: "galat", teks: "Ulangi kata sandi baru dengan benar." }); return; }
    setProses(true);
    try {
      const r = await minta<{ token: string }>("/api/m/sandi", { body: { lama, baru } });
      await gantiToken(r.token);
      setLama(""); setBaru(""); setUlang("");
      setPesan({ jenis: "ok", teks: "Kata sandi berhasil diganti. Perangkat lain otomatis keluar." });
    } catch (e) {
      setPesan({ jenis: "galat", teks: e instanceof Error ? e.message : "Gagal mengganti kata sandi." });
    } finally {
      setProses(false);
    }
  }

  async function prosesKeluar() {
    const pesanKeluar = antrean.length
      ? `Ada ${antrean.length} isian yang belum terkirim. Jika keluar sekarang, isian itu akan terhapus dari HP.`
      : "Anda akan keluar dari aplikasi di HP ini.";
    if (await konfirmasi("Keluar", pesanKeluar, "Keluar")) await keluar();
  }

  return (
    <Layar>
      <Hero style={{ marginHorizontal: -16, marginTop: -16, alignItems: "center", paddingBottom: 52 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kembali ke Beranda" onPress={() => router.navigate("/")}
          style={{ alignSelf: "flex-start", width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#1B7258" }}>
          <Ionicons name="chevron-back" color={W.putih} size={22} />
        </Pressable>
        <View importantForAccessibility="no-hide-descendants" style={{ minWidth: 76, minHeight: 76, padding: 8, borderRadius: 50, borderWidth: 3, borderColor: W.putih, alignItems: "center", justifyContent: "center", backgroundColor: W.emas }}>
          <T tebal ukuran={28} style={{ color: "#3D2600" }}>{namaPanggilan(u.nama).charAt(0).toUpperCase()}</T>
        </View>
        <T tebal ukuran={22} style={{ color: W.putih, textAlign: "center" }}>{u.nama}</T>
        <T style={{ color: "#D6EDE2" }}>@{u.username}</T>
      </Hero>
      <Kartu style={{ marginTop: -40, borderRadius: 20 }}>
        <Baris style={{ alignItems: "flex-start" }}>
          {[[LABEL_PERAN[u.peran], "Peran"], ...(u.kelasWali.length ? [[u.kelasWali.map(k => k.nama).join(", "), "Wali kelas"]] : []), [madrasah.nama, "Madrasah"]].map(([nilai, label]) =>
            <View key={label} style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <T tebal numberOfLines={2} ukuran={nilai.length > 12 ? 13 : 16} style={{ textAlign: "center" }}>{nilai}</T><T ringkas redup ukuran={12}>{label}</T>
            </View>)}
        </Baris>
      </Kartu>
      <Kartu style={{ gap: 6 }}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: buka }} onPress={() => setBuka(!buka)} style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#E1F2EA" }}><Ionicons name="key-outline" size={18} color={W.utama} /></View><T tebal style={{ flex: 1 }}>Ganti kata sandi</T>
          <Ionicons name={buka ? "chevron-up" : "chevron-down"} color={W.redup} size={18} />
        </Pressable>
        {buka && <View style={{ gap: 12 }}>
          <Masukan label="Kata sandi lama" value={lama} onChangeText={setLama} secureTextEntry />
          <Masukan label="Kata sandi baru (min. 8 karakter)" value={baru} onChangeText={setBaru} secureTextEntry />
          <Masukan label="Ulangi kata sandi baru" value={ulang} onChangeText={setUlang} secureTextEntry />
          {pesan && <Pesan jenis={pesan.jenis} teks={pesan.teks} />}
          <Tombol judul="Simpan" onPress={ganti} memuat={proses} />
        </View>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: lihatAntrean }} onPress={() => setLihatAntrean(!lihatAntrean)} style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderColor: W.garis }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF4D6" }}><Ionicons name="cloud-upload-outline" size={18} color="#8A5300" /></View>
          <View style={{ flex: 1 }}><T tebal>Antrean pengiriman</T><T redup ukuran={12}>{antrean.length ? `${antrean.length} belum terkirim` : "Semua terkirim"}</T></View>
          <Ionicons name={lihatAntrean ? "chevron-up" : "chevron-down"} size={18} color={W.redup} />
        </Pressable>
        {lihatAntrean && <T redup>{antrean.length
          ? `${antrean.length - gagal} menunggu pengiriman · ${gagal} perlu diperbaiki. Ketuk ikon antrean di bagian atas untuk melihat isian.`
          : "Tidak ada isian dalam antrean."}</T>}
        <Baris style={{ minHeight: 48, justifyContent: "flex-start", borderTopWidth: 1, borderColor: W.garis }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#E5EDFF" }}><Ionicons name="server-outline" color="#2F55C9" size={18} /></View>
          <View style={{ flex: 1 }}><T tebal>Server</T><T redup ukuran={12}>{alamat.replace(/^https?:\/\//, "")}</T></View>
        </Baris>
      </Kartu>

      <View style={{ gap: 8 }}>
        <Tombol jenis="bahaya" judul="Keluar" onPress={() => void prosesKeluar()} />
        <T redup ukuran={12} style={{ textAlign: "center" }}>Versi aplikasi {Constants.expoConfig?.version ?? "-"}</T>
      </View>
    </Layar>
  );
}
