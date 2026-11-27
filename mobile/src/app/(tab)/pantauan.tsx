import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import type { ResponsPantauan } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Baris, Judul, Kartu, Layar, Lencana, Memuat, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

function Angka({ judul, nilai, sub, warna }: { judul: string; nilai: string; sub?: string; warna?: string }) {
  return (
    <Kartu style={{ flexBasis: "47%", flexGrow: 1 }}>
      <T redup ukuran={13}>{judul}</T>
      <T tebal ukuran={24} style={{ color: warna ?? "#0f172a" }}>{nilai}</T>
      {sub && <T redup ukuran={12}>{sub}</T>}
    </Kartu>
  );
}

export default function Pantauan() {
  const { zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const [tanggal, setTanggal] = useState(hariIni);
  const { data: p, galat, memuat, muat } = useMuat<ResponsPantauan>(`/api/m/pantauan?tanggal=${tanggal}`);
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));

  if (!p && !galat) return <Memuat />;
  return (
    <Layar segarkan={muat} memuat={memuat}>
      <Judul>Pantauan harian</Judul>
      <NavTanggal tanggal={tanggal} teks={formatTanggal(tanggal)} maks={hariIni} onUbah={setTanggal} />
      {galat && <Pesan jenis="galat" teks={galat} />}
      {p && (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Angka judul="Guru sudah absen" nilai={`${p.guru.sudahAbsen}/${p.guru.total}`} sub={`${p.guru.hadir} hadir${p.guru.luarRadius ? ` · ${p.guru.luarRadius} di luar area` : ""}`} />
            <Angka judul="Jurnal terisi" nilai={`${p.jadwal.terisi}/${p.jadwal.total}`} sub={p.jadwal.total ? `${Math.round((p.jadwal.terisi / p.jadwal.total) * 100)}% jadwal` : "tidak ada jadwal"} />
            <Angka judul="Kehadiran siswa" nilai={p.siswa.persenHadir == null ? "–" : `${p.siswa.persenHadir}%`} sub="dari jam yang sudah diabsen" />
            <Angka judul="Belum diperiksa" nilai={String(p.jadwal.belumDiperiksa)} warna={p.jadwal.belumDiperiksa ? "#d97706" : undefined} sub="jurnal" />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><Tombol judul="Periksa jurnal" onPress={() => router.push({ pathname: "/jurnal", params: { tanggal } })} /></View>
            <View style={{ flex: 1 }}><Tombol jenis="garis" judul="Kehadiran guru" onPress={() => router.push({ pathname: "/kehadiran-guru", params: { tanggal } })} /></View>
          </View>

          <Kartu>
            <Judul kecil>Guru belum absen ({p.belumAbsen.length})</Judul>
            {p.belumAbsen.length === 0 && <T redup>Semua guru sudah absen.</T>}
            {p.belumAbsen.map((g) => (
              <Baris key={g.id} style={{ paddingVertical: 4 }}>
                <T>{g.nama}</T>
                {g.berjadwal && <Lencana teks="ada jadwal" jenis="kuning" />}
              </Baris>
            ))}
          </Kartu>

          <Kartu>
            <Judul kecil>Jurnal belum diisi ({p.belumJurnal.length})</Judul>
            {p.belumJurnal.length === 0 && <T redup>Semua jadwal sudah diisi.</T>}
            {p.belumJurnal.map((j) => (
              <Baris key={j.id} style={{ paddingVertical: 4, alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <T>{j.guru.nama}</T>
                  <T redup ukuran={12}>{j.kelas.nama} · {j.mapel.nama} · jam {j.jamMulai}–{j.jamSelesai}</T>
                </View>
                <Lencana teks={j.lewat ? "terlambat" : "belum waktunya"} jenis={j.lewat ? "merah" : "abu"} />
              </Baris>
            ))}
          </Kartu>

          <Kartu>
            <Judul kecil>Kehadiran siswa per kelas</Judul>
            {p.perKelas.map((k) => (
              <View key={k.id} style={{ paddingVertical: 6, borderTopWidth: 1, borderColor: "#f1f5f9", gap: 2 }}>
                <Baris>
                  <T tebal>{k.nama}</T>
                  <T redup ukuran={12}>Jurnal {k.terisi}/{k.jadwal}</T>
                </Baris>
                <T ukuran={13}>H {k.rekap.H} · S {k.rekap.S} · I {k.rekap.I} · <T ukuran={13} tebal style={{ color: k.rekap.A ? W.merah : W.teks }}>A {k.rekap.A}</T></T>
                {k.tidakHadir.length > 0 && <T redup ukuran={12}>{k.tidakHadir.map((s) => `${s.nama}: ${s.status.join(", ")}`).join("; ")}</T>}
              </View>
            ))}
          </Kartu>
        </>
      )}
    </Layar>
  );
}
