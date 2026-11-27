import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { FotoAman } from "@/components/foto-aman";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_GURU, type ItemKehadiranGuru } from "@/lib/tipe";
import { formatTanggal, jamDiZona, tanggalDiZona } from "@/lib/waktu";
import { Baris, Kartu, Layar, Lencana, Memuat, NavTanggal, Pesan, T, W } from "@/components/ui";

export default function KehadiranGuru() {
  const { zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const awal = useLocalSearchParams<{ tanggal?: string }>().tanggal;
  const [tanggal, setTanggal] = useState(awal && awal <= hariIni ? awal : hariIni);
  const { data, galat, memuat, muat } = useMuat<{ guru: ItemKehadiranGuru[] }>(`/api/m/kehadiran-guru?tanggal=${tanggal}`);

  if (!data && !galat) return <Memuat />;
  const sudah = data?.guru.filter((g) => g.absen).length ?? 0;
  return (
    <Layar segarkan={muat} memuat={memuat}>
      <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={setTanggal} />
      {galat && <Pesan jenis="galat" teks={galat} />}
      {data && <T redup>{sudah} dari {data.guru.length} sudah absen</T>}
      {data?.guru.map((g) => {
        const a = g.absen;
        return (
          <Kartu key={g.id}>
            <Baris style={{ alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T tebal>{g.nama}</T>
                {a ? (
                  <>
                    <T redup ukuran={13}>{jamDiZona(zona, a.waktuMasuk)}{a.jarakMeter != null ? ` · ±${a.jarakMeter} m` : ""}</T>
                    {a.dalamRadius === false && <T ukuran={13} tebal style={{ color: W.merah }}>Di luar area madrasah</T>}
                    {a.keterangan && <T redup ukuran={13}>{a.keterangan}</T>}
                    {a.lat != null && (
                      <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps?q=${a.lat},${a.lng}`)}>
                        <T ukuran={13} style={{ color: W.utama, textDecorationLine: "underline" }}>Lihat di peta</T>
                      </Pressable>
                    )}
                  </>
                ) : null}
                {g.jadwal > 0 && <T redup ukuran={12}>Jurnal {g.jurnal}/{g.jadwal}</T>}
                <View style={{ marginTop: 4 }}>
                  <Lencana teks={a ? LABEL_STATUS_GURU[a.status] : "Belum absen"} jenis={!a ? "merah" : a.status === "HADIR" ? "hijau" : "biru"} />
                </View>
              </View>
              {a?.adaFoto && (
                <FotoAman absenId={a.id} label={`Foto ${g.nama}`} style={{ width: 64, height: 80, borderRadius: 8 }} />
              )}
            </Baris>
          </Kartu>
        );
      })}
    </Layar>
  );
}
