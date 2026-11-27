import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import { useMuat } from "@/lib/muat";
import type { ItemRiwayat } from "@/lib/tipe";
import { formatTanggal } from "@/lib/waktu";
import { Baris, Judul, Kartu, Daftar, Lencana, Memuat, Pesan, T } from "@/components/ui";

export default function Riwayat() {
  const { data, galat, memuat, muat } = useMuat<{ riwayat: ItemRiwayat[] }>("/api/m/riwayat");
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));
  if (!data && !galat) return <Memuat />;
  return (
    <Daftar data={data?.riwayat ?? []} refreshing={memuat} onRefresh={muat}
      renderItem={({ item: p }) => (
        <Kartu key={p.id}>
          <Baris style={{ alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <T redup ukuran={12}>{formatTanggal(p.tanggal)} · jam ke-{p.jamMulai}–{p.jamSelesai}</T>
              <T tebal>{p.mapel} · {p.kelas}{p.pengganti ? " (pengganti)" : ""}</T>
            </View>
            <Lencana teks={p.diperiksa ? "Diperiksa" : "Belum diperiksa"} jenis={p.diperiksa ? "hijau" : "abu"} />
          </Baris>
          <T>{p.materi}</T>
          {p.kd && <T redup ukuran={13}>KD: {p.kd}</T>}
          <T redup ukuran={13}>Hadir {p.rekap.H} · Sakit {p.rekap.S} · Izin {p.rekap.I} · Alpa {p.rekap.A}</T>
          {p.catatanKepala && <Pesan jenis="info" teks={`Catatan ${p.diperiksaOleh ?? "kepala madrasah"}: ${p.catatanKepala}`} />}
        </Kartu>
      )}>
      <View>
        <Judul>Riwayat jurnal</Judul>
        <T redup>30 hari terakhir{data ? ` · ${data.riwayat.length} pertemuan` : ""}</T>
      </View>
      {galat && <Pesan jenis="galat" teks={galat} />}
      {data?.riwayat.length === 0 && <Kartu><T redup>Belum ada jurnal.</T></Kartu>}

    </Daftar>
  );
}
