import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Pengganti as Ilustrasi } from "@/components/ilustrasi";
import { useMuat } from "@/lib/muat";
import type { JadwalUmum } from "@/lib/tipe";
import { Baris, Daftar, Kartu, Memuat, Pesan, T, Tombol, W } from "@/components/ui";

export default function Pengganti() {
  const { data, galat, memuat, muat } = useMuat<{ jadwal: JadwalUmum[] }>("/api/m/pengganti");
  const [semua, setSemua] = useState(false);
  const jadwal = data?.jadwal ?? [];
  const kosong = jadwal.filter(j => !j.pertemuan);
  const tampil = semua ? jadwal : kosong;

  if (!data && !galat) return <Memuat />;
  return (
    <Daftar data={tampil} refreshing={memuat} onRefresh={muat} renderItem={({ item: j, index }) => {
      const gantikan = <Tombol jenis={index ? "garis" : "utama"} judul="Gantikan" onPress={() => router.push({ pathname: "/isi/[jadwalId]", params: { jadwalId: j.id } })} />;
      const [bg, fg] = [["#FFE8DC", "#893508"], ["#EEE6FF", "#5836A1"], [W.utamaMuda, W.utama]][index % 3];
      return <Kartu style={{ borderRadius: 18 }}>
        <Baris style={{ flexWrap: "wrap" }}>
          <View style={{ minWidth: 48, minHeight: 48, borderRadius: 14, padding: 5, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
            <T ukuran={12} style={{ color: fg }}>Jam</T><T tebal style={{ color: fg }}>{j.jamMulai}–{j.jamSelesai}</T>
          </View>
          <View style={{ flexGrow: 1, flexBasis: 130, gap: 2 }}>
            <T tebal>{j.mapel.nama} · {j.kelas.nama}</T><T redup>{j.guru.nama}</T><T redup ukuran={12}>{j.waktu}</T>
          </View>
          {!!index && !j.pertemuan && gantikan}
        </Baris>
        {j.pertemuan ? <T tebal style={{ color: W.utama }}>Diisi {j.pertemuan.namaGuru}</T> : !index && gantikan}
      </Kartu>;
    }}>
      <Kartu style={{ backgroundColor: "#E5EDFF", flexDirection: "row", alignItems: "center", borderRadius: 20 }}>
        <Ilustrasi width={76} height={68} />
        <View style={{ flex: 1, gap: 4 }}><T tebal>Ada guru berhalangan?</T><T>Pilih jadwalnya, lalu isi absen &amp; jurnal sebagai pengganti.</T></View>
      </Kartu>
      <Baris style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
        {[false, true].map(v => <Pressable key={String(v)} accessibilityRole="button" accessibilityState={{ selected: semua === v }} onPress={() => setSemua(v)}
          style={{ minHeight: 48, justifyContent: "center", borderRadius: 24, paddingHorizontal: 15, backgroundColor: semua === v ? W.teks : W.putih }}>
          <T tebal style={{ color: semua === v ? W.putih : W.teks }}>{v ? "Semua" : "Belum diisi"} {data ? (v ? jadwal.length : kosong.length) : ""}</T>
        </Pressable>)}
      </Baris>
      {galat && <Pesan jenis="galat" teks={galat} />}
      {data && !tampil.length && <Kartu><T redup>{jadwal.length ? "Semua jadwal sudah diisi." : "Tidak ada jadwal lain hari ini."}</T></Kartu>}
    </Daftar>
  );
}
