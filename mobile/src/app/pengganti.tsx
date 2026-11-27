import { router } from "expo-router";
import { View } from "react-native";
import { useMuat } from "@/lib/muat";
import type { JadwalUmum } from "@/lib/tipe";
import { Baris, Kartu, Layar, Lencana, Memuat, Pesan, T, Tombol } from "@/components/ui";

export default function Pengganti() {
  const { data, galat, memuat, muat } = useMuat<{ jadwal: JadwalUmum[] }>("/api/m/pengganti");
  const jadwal = data?.jadwal ?? null;

  if (!jadwal && !galat) return <Memuat />;
  return (
    <Layar segarkan={muat} memuat={memuat}>
      <T redup>Pilih jadwal guru yang Anda gantikan hari ini.</T>
      {galat && <Pesan jenis="galat" teks={galat} />}
      {jadwal?.length === 0 && <Kartu><T redup>Tidak ada jadwal lain hari ini.</T></Kartu>}
      {jadwal?.map((j) => (
        <Kartu key={j.id}>
          <Baris>
            <View style={{ flex: 1, gap: 2 }}>
              <T redup ukuran={12}>Jam {j.jamMulai}–{j.jamSelesai} · {j.waktu}</T>
              <T tebal>{j.mapel.nama} · {j.kelas.nama}</T>
              <T redup>{j.guru.nama}</T>
            </View>
            {j.pertemuan ? <Lencana teks={`Diisi ${j.pertemuan.namaGuru}`} jenis="hijau" />
              : <Tombol jenis="garis" judul="Gantikan" onPress={() => router.push({ pathname: "/isi/[jadwalId]", params: { jadwalId: j.id } })} />}
          </Baris>
        </Kartu>
      ))}
    </Layar>
  );
}
