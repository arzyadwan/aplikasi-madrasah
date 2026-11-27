import Constants from "expo-constants";
import { useState } from "react";
import { View } from "react-native";
import { minta } from "@/lib/api";
import { useAntrean } from "@/lib/antrean";
import { konfirmasi } from "@/lib/konfirmasi";
import { useSaya, useSesi } from "@/lib/sesi";
import { LABEL_PERAN } from "@/lib/tipe";
import { Judul, Kartu, Layar, Masukan, Pesan, T, Tombol, type JenisPesan } from "@/components/ui";

export default function Akun() {
  const { pengguna: u, madrasah } = useSaya();
  const { alamat, keluar, gantiToken } = useSesi();
  const antrean = useAntrean();
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
      <Judul>Akun saya</Judul>
      <Kartu>
        <T><T redup>Nama: </T>{u.nama}</T>
        <T><T redup>Nama pengguna: </T>{u.username}</T>
        <T><T redup>Peran: </T>{LABEL_PERAN[u.peran]}</T>
        {u.kelasWali.length > 0 && <T><T redup>Wali kelas: </T>{u.kelasWali.map((k) => k.nama).join(", ")}</T>}
        <T><T redup>Madrasah: </T>{madrasah.nama}</T>
        <T redup ukuran={12}>Server: {alamat.replace(/^https?:\/\//, "")}</T>
      </Kartu>

      <Kartu style={{ gap: 12 }}>
        <Judul kecil>Ganti kata sandi</Judul>
        <Masukan label="Kata sandi lama" value={lama} onChangeText={setLama} secureTextEntry />
        <Masukan label="Kata sandi baru (min. 8 karakter)" value={baru} onChangeText={setBaru} secureTextEntry />
        <Masukan label="Ulangi kata sandi baru" value={ulang} onChangeText={setUlang} secureTextEntry />
        {pesan && <Pesan jenis={pesan.jenis} teks={pesan.teks} />}
        <Tombol judul="Simpan" onPress={ganti} memuat={proses} />
      </Kartu>

      <View style={{ gap: 8 }}>
        <Tombol jenis="bahaya" judul="Keluar" onPress={() => void prosesKeluar()} />
        <T redup ukuran={12} style={{ textAlign: "center" }}>Versi aplikasi {Constants.expoConfig?.version ?? "-"}</T>
      </View>
    </Layar>
  );
}
