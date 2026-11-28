import { Avatar, Hero } from "@/components/v2";
import { Siluet } from "@/components/ilustrasi";
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
  const [pilihTanggal, setPilihTanggal] = useState(false);
  const [tanggal, setTanggal] = useState(awal && awal <= hariIni ? awal : hariIni);
  const { data, galat, memuat, muat } = useMuat<{ guru: ItemKehadiranGuru[] }>(`/api/m/kehadiran-guru?tanggal=${tanggal}`);

  const [terlihat, setTerlihat] = useState<Set<string>>(new Set());
  const saatTerlihat = useCallback(({ viewableItems }: { viewableItems: { item: ItemKehadiranGuru }[] }) => {
    setTerlihat(new Set(viewableItems.map(v => v.item.id)));
  }, []);
  const sudah = data?.guru.filter((g) => g.absen).length ?? 0;
  const belum = data?.guru.filter(g => !g.absen) ?? [];
  const daftar = [...belum, ...(data?.guru.filter(g => g.absen) ?? [])];
  return (
    <Daftar data={daftar} refreshing={memuat} onRefresh={muat}
      onViewableItemsChanged={saatTerlihat} extraData={terlihat}
      renderItem={({ item: g, index }) => {
        const a = g.absen;
        return (
          <View style={{ gap: 8 }}>
            {(index === 0 || index === belum.length) && <T tebal style={{ color: a ? W.redup : W.merah }}>{a ? "Sudah absen" : "Belum absen"}</T>}
            <Kartu style={!a && { backgroundColor: W.merahMuda, borderColor: "#EBC4C0" }}>
            <Baris style={{ alignItems: "flex-start" }}>
              {a ? <View style={{ width: 46, height: 56, alignItems: "center", justifyContent: "flex-end", overflow: "hidden",
                borderRadius: 12, backgroundColor: a.dalamRadius === false ? W.kuningMuda : W.utamaMuda }}>
                {a.adaFoto ? terlihat.has(g.id) && <FotoAman absenId={a.id} label={`Foto ${g.nama}`} style={{ width: 46, height: 56 }} /> : <Siluet />}
              </View> : <Avatar nama={g.nama} size={40} />}
              <View style={{ flex: 1, gap: 2 }}>
                <T tebal>{g.nama}</T>
                {a ? (
                  <>
                    <T redup ukuran={13}>{jamDiZona(zona, a.waktuMasuk)}{a.jarakMeter != null ? ` · ±${a.jarakMeter} m` : ""}</T>
                    {a.dalamRadius === false && <T ukuran={13} tebal style={{ color: W.merah }}>Di luar area madrasah</T>}
                    {a.keterangan && <T redup ukuran={13}>{a.keterangan}</T>}
                    {a.lat != null && a.lng != null && (
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
            </Baris>
          </Kartu>
          </View>
        );
      }}>
      <Hero style={{ marginHorizontal: -16, marginTop: -16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={"Pilih tanggal, " + formatTanggal(tanggal)}
          accessibilityState={{ expanded: pilihTanggal }} onPress={() => setPilihTanggal(!pilihTanggal)}
          style={{ minHeight: 48, alignSelf: "flex-start", flexDirection: "row", gap: 8, alignItems: "center" }}>
          <T tebal ukuran={16} style={{ color: W.putih }}>{formatTanggal(tanggal)}</T><T style={{ color: W.putih }}>⌄</T>
        </Pressable>
        {data && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {[
            ["Hadir", data.guru.filter(g => g.absen?.status === "HADIR").length],
            ["Izin/Sakit", data.guru.filter(g => g.absen?.status === "IZIN" || g.absen?.status === "SAKIT").length],
            ["Luar area", data.guru.filter(g => g.absen?.dalamRadius === false).length],
            ["Belum", belum.length],
          ].map(([label, nilai]) => <View key={label} accessible accessibilityLabel={nilai + " " + label}
            style={{ flex: 1, minWidth: 66, alignItems: "center", padding: 6, borderRadius: 12, backgroundColor: label === "Belum" ? W.emas : "#1B7258" }}>
            <T ringkas tebal ukuran={19} style={{ color: label === "Belum" ? W.teks : W.putih }}>{nilai}</T>
            <T ringkas ukuran={12} style={{ color: label === "Belum" ? W.teks : W.putih }}>{label}</T>
          </View>)}
        </View>}
      </Hero>
      {pilihTanggal && <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={setTanggal} />}
      {memuat && <Memuat />}
      {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
      {data && <T redup>{sudah} dari {data.guru.length} sudah absen</T>}

    </Daftar>
  );
}
