import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { FotoAman } from "@/components/foto-aman";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_GURU, type ItemKehadiranGuru } from "@/lib/tipe";
import { formatTanggal, jamDiZona, tanggalDiZona } from "@/lib/waktu";
import { Baris, Kartu, Daftar, Lencana, Memuat, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

export default function KehadiranGuru() {
  const { zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const awal = useLocalSearchParams<{ tanggal?: string }>().tanggal;
  const [tanggal, setTanggal] = useState(awal && awal <= hariIni ? awal : hariIni);
  const { data, galat, memuat, muat } = useMuat<{ guru: ItemKehadiranGuru[] }>(`/api/m/kehadiran-guru?tanggal=${tanggal}`);

  const [terlihat, setTerlihat] = useState<Set<string>>(new Set());
  const saatTerlihat = useCallback(({ viewableItems }: { viewableItems: { item: ItemKehadiranGuru }[] }) => {
    setTerlihat(new Set(viewableItems.map(v => v.item.id)));
  }, []);
  const sudah = data?.guru.filter((g) => g.absen).length ?? 0;
  return (
    <Daftar data={data?.guru ?? []} refreshing={memuat} onRefresh={muat}
      onViewableItemsChanged={saatTerlihat} extraData={terlihat}
      renderItem={({ item: g }) => {
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
                      <Pressable accessibilityRole="link" accessibilityLabel={`Lihat lokasi ${g.nama} di peta`} style={{ minHeight: 48, minWidth: 48, justifyContent: "center" }} onPress={() => Linking.openURL(`https://www.google.com/maps?q=${a.lat},${a.lng}`)}>
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
                <View style={{ width: 64, height: 80 }}>
                  {terlihat.has(g.id) && (
                    <FotoAman absenId={a.id} label={`Foto ${g.nama}`} style={{ width: 64, height: 80, borderRadius: 8 }} />
                  )}
                </View>
              )}
            </Baris>
          </Kartu>
        );
      }}>
      <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={setTanggal} />
      {memuat && <Memuat />}
      {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
      {data && <T redup>{sudah} dari {data.guru.length} sudah absen</T>}

    </Daftar>
  );
}
