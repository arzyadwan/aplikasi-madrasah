import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Pengganti as Ilustrasi } from "@/components/ilustrasi";
import { useMuat } from "@/lib/muat";
import type { JadwalUmum } from "@/lib/tipe";
import { Baris, Daftar, Kartu, Layar, Pesan, T, Tombol, W } from "@/components/ui";
import { HeroSub, Kerangka, LatarStatus, Segmen } from "@/components/v2";

export default function Pengganti() {
  const { data, galat, memuat, muat } = useMuat<{ jadwal: JadwalUmum[] }>("/api/m/pengganti");
  const [semua, setSemua] = useState(false);
  const jadwal = data?.jadwal ?? [];
  const kosong = jadwal.filter(j => !j.pertemuan);
  const tampil = semua ? jadwal : kosong;

  if (!data && !galat) return <Layar><HeroSub judul="Guru pengganti" sub="Memuat jadwal…" /><Kerangka baris={4} /></Layar>;
  return (<View style={{ flex: 1 }}>
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
      <HeroSub judul="Guru pengganti" sub="Gantikan guru yang berhalangan" />
      <Kartu style={{ backgroundColor: "#E5EDFF", flexDirection: "row", alignItems: "center", borderRadius: 20, marginTop: 4 }}>
        <Ilustrasi width={76} height={68} />
        <View style={{ flex: 1, gap: 4 }}><T tebal>Ada guru berhalangan?</T><T>Pilih jadwalnya, lalu isi absen &amp; catatan mengajar sebagai pengganti.</T></View>
      </Kartu>
      <Segmen<"kosong" | "semua"> nilai={semua ? "semua" : "kosong"} onUbah={k => setSemua(k === "semua")} pilihan={[
        { kunci: "kosong", label: `Belum diisi ${kosong.length}` }, { kunci: "semua", label: `Semua ${jadwal.length}` },
      ]} />
      {galat && <Pesan jenis="galat" teks={galat} />}
      {data && !tampil.length && <Kartu><T redup>{jadwal.length ? "Semua jadwal sudah diisi." : "Tidak ada jadwal lain hari ini."}</T></Kartu>}
    </Daftar>
    <LatarStatus />
  </View>);
}
