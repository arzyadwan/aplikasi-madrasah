import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ResponsWali, StatusSiswa } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Baris, Judul, Kartu, Layar, Lencana, Memuat, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

const WARNA: Record<StatusSiswa, [string, string]> = {
  H: ["transparent", W.utama], S: [W.biruMuda, W.biru], I: [W.kuningMuda, W.kuning], A: [W.merahMuda, W.merah],
};

export default function KelasSaya() {
  const { pengguna: u, zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const [tanggal, setTanggal] = useState(hariIni);
  const [kelasId, setKelasId] = useState(u.kelasWali[0]?.id ?? "");
  const { data, galat, memuat, muat } = useMuat<ResponsWali>(`/api/m/wali?kelas=${kelasId}&tanggal=${tanggal}`);

  if (!data && !galat) return <Memuat />;
  return (
    <Layar segarkan={muat} memuat={memuat}>
      <Judul>Kelas {data?.kelas.nama ?? ""}</Judul>
      {u.kelasWali.length > 1 && (
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {u.kelasWali.map((k) => <Tombol key={k.id} jenis={k.id === kelasId ? "utama" : "garis"} judul={k.nama} onPress={() => setKelasId(k.id)} />)}
        </View>
      )}
      <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={setTanggal} />
      {galat && <Pesan jenis="galat" teks={galat} />}
      {data && (
        <>
          <Judul kecil>Jadwal dan jurnal</Judul>
          {data.jadwal.length === 0 && <Kartu><T redup>Tidak ada jadwal.</T></Kartu>}
          {data.jadwal.map((j) => (
            <Kartu key={j.id}>
              <T redup ukuran={12}>Jam {j.jamMulai}–{j.jamSelesai} · {j.waktu}</T>
              <T tebal>{j.mapel.nama}</T>
              <T redup>{j.guru.nama}</T>
              {j.pertemuan ? (
                <T ukuran={13}>Diisi {j.pertemuan.namaGuru}{j.pertemuan.pengganti ? " (pengganti)" : ""} · H {j.pertemuan.rekap.H} · S {j.pertemuan.rekap.S} · I {j.pertemuan.rekap.I} · A {j.pertemuan.rekap.A}</T>
              ) : tanggal === hariIni ? (
                <Tombol jenis="teks" judul="Belum diisi · isi sebagai wali kelas" onPress={() => router.push({ pathname: "/isi/[jadwalId]", params: { jadwalId: j.id } })} />
              ) : <Lencana teks="Tidak diisi" jenis="merah" />}
            </Kartu>
          ))}

          {data.jadwal.length > 0 && (
            <Kartu>
              <Judul kecil>Kehadiran per jam pelajaran</Judul>
              <ScrollView horizontal>
                <View>
                  <Baris style={{ justifyContent: "flex-start", gap: 0 }}>
                    <Text style={{ width: 150, fontWeight: "700", color: W.redup, fontSize: 12 }}>Siswa</Text>
                    {data.jadwal.map((j) => <Text key={j.id} style={{ width: 44, textAlign: "center", fontWeight: "700", color: W.redup, fontSize: 12 }}>Jam {j.jamMulai}</Text>)}
                  </Baris>
                  {data.siswa.map((s) => (
                    <Baris key={s.id} style={{ justifyContent: "flex-start", gap: 0, paddingVertical: 4, borderTopWidth: 1, borderColor: "#f1f5f9" }}>
                      <Text numberOfLines={1} style={{ width: 150, fontSize: 13, color: W.teks }}>{s.nama}</Text>
                      {data.jadwal.map((j) => {
                        const st = data.status[s.id]?.[j.id];
                        return (
                          <View key={j.id} style={{ width: 44, alignItems: "center" }}>
                            <Text style={{ fontWeight: "800", fontSize: 12, paddingHorizontal: 6, borderRadius: 4,
                              backgroundColor: st ? WARNA[st][0] : "transparent", color: st ? WARNA[st][1] : "#cbd5e1" }}>{st ?? "·"}</Text>
                          </View>
                        );
                      })}
                    </Baris>
                  ))}
                </View>
              </ScrollView>
            </Kartu>
          )}
          <T redup ukuran={12}>Rekap bulanan (Excel) bisa diunduh dari versi web, menu Kelas Saya.</T>
        </>
      )}
    </Layar>
  );
}
