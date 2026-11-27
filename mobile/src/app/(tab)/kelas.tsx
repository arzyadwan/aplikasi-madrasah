import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_SISWA, type ResponsWali } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Judul, Kartu, Layar, Lencana, Memuat, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

export default function KelasSaya() {
  const { pengguna: u, zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const [tanggal, setTanggal] = useState(hariIni);
  const [kelasId, setKelasId] = useState(u.kelasWali[0]?.id ?? "");
  const { data, galat, memuat, muat } = useMuat<ResponsWali>(`/api/m/wali?kelas=${kelasId}&tanggal=${tanggal}`);

  const [jadwalId, setJadwalId] = useState("");
  const jam = data?.jadwal.find(j => j.id === jadwalId) ?? data?.jadwal[0];

  return (
    <Layar segarkan={muat} memuat={memuat}>
      <Judul>Kelas {data?.kelas.nama ?? ""}</Judul>
      {u.kelasWali.length > 1 && (
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {u.kelasWali.map((k) => <Tombol key={k.id} terpilih={k.id === kelasId} jenis={k.id === kelasId ? "utama" : "garis"} judul={k.nama} onPress={() => setKelasId(k.id)} />)}
        </View>
      )}
      <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={setTanggal} />
      {memuat && <Memuat />}
      {galat && <><Pesan jenis="galat" teks={galat} /><Tombol judul="Coba lagi" onPress={muat} /></>}
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
                <T ukuran={13}>Diisi {j.pertemuan.namaGuru}{j.pertemuan.pengganti ? " (pengganti)" : ""} · Hadir {j.pertemuan.rekap.H} · Sakit {j.pertemuan.rekap.S} · Izin {j.pertemuan.rekap.I} · Alpa {j.pertemuan.rekap.A}</T>
              ) : tanggal === hariIni ? (
                <Tombol jenis="teks" judul={j.guru.id === u.id ? "Isi jadwal saya" : "Isi sebagai guru pengganti"} onPress={() => router.push({ pathname: "/isi/[jadwalId]", params: { jadwalId: j.id } })} />
              ) : <Lencana teks="Tidak diisi" jenis="merah" />}
            </Kartu>
          ))}

          {jam && (
            <Kartu>
              <Judul kecil>Kehadiran per jam pelajaran</Judul>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {data.jadwal.map(j => <Tombol key={j.id} terpilih={jam.id === j.id} judul={`Jam ${j.jamMulai}`} jenis={jam.id === j.id ? "utama" : "garis"} onPress={() => setJadwalId(j.id)} />)}
              </View>
              <T tebal>Jam ke-{jam.jamMulai} · {jam.mapel.nama}</T>
              {data.siswa.map(s => {
                const kode = data.status[s.id]?.[jam.id];
                const status = kode ? LABEL_STATUS_SISWA[kode] : "Belum diisi";
                return <View key={s.id} accessible accessibilityLabel={`${s.nama}, jam ke-${jam.jamMulai}, ${status}`}
                  style={{ borderTopWidth: 1, borderColor: W.garis, paddingVertical: 6 }}>
                  <T tebal>{s.nama}</T><T>{status}</T>
                </View>;
              })}
            </Kartu>
          )}
          <T redup ukuran={12}>Rekap bulanan (Excel) bisa diunduh dari versi web, menu Kelas Saya.</T>
        </>
      )}
    </Layar>
  );
}
