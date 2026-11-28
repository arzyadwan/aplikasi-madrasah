import { Avatar, Hero } from "@/components/v2";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useMuat } from "@/lib/muat";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_SISWA, type ResponsWali } from "@/lib/tipe";
import { formatTanggal, tanggalDiZona } from "@/lib/waktu";
import { Baris, Daftar, Judul, Kartu, Lencana, Memuat, NavTanggal, Pesan, T, Tombol, W } from "@/components/ui";

export default function KelasSaya() {
  const { pengguna: u, zona } = useSaya();
  const hariIni = tanggalDiZona(zona);
  const [tanggal, setTanggal] = useState(hariIni);
  const [kelasId, setKelasId] = useState(u.kelasWali[0]?.id ?? "");
  const { data, galat, memuat, muat } = useMuat<ResponsWali>(`/api/m/wali?kelas=${kelasId}&tanggal=${tanggal}`);

  const [jadwalId, setJadwalId] = useState("");
  const jam = data?.jadwal.find(j => j.id === jadwalId) ?? data?.jadwal[0];

  const absen = data?.siswa.flatMap(siswa => {
    const jamAbsen = data.jadwal.flatMap(j => {
      const kode = data.status[siswa.id]?.[j.id];
      return kode && kode !== "H" ? [{ kode, jam: j.jamMulai === j.jamSelesai ? String(j.jamMulai) : j.jamMulai + "–" + j.jamSelesai }] : [];
    });
    return jamAbsen.length ? [{ ...siswa, jamAbsen }] : [];
  }) ?? [];
  const grafik = data?.jadwal.flatMap(j => {
    const r = j.pertemuan?.rekap;
    const total = r ? r.H + r.S + r.I + r.A : 0;
    return r && total ? [{ id: j.id, jam: j.jamMulai, persen: Math.round(100 * r.H / total) }] : [];
  }) ?? [];
  return (
    <Daftar data={jam ? data?.siswa ?? [] : []} refreshing={memuat} onRefresh={muat}
      renderItem={({ item }) => {
        const kode = jam && data?.status[item.id]?.[jam.id];
        const status = kode ? LABEL_STATUS_SISWA[kode] : "Belum diisi";
        return <View accessible accessibilityLabel={item.nama + ", jam ke-" + jam?.jamMulai + ", " + status}>
          <Kartu><Baris><Avatar nama={item.nama} status={kode} size={36} /><T tebal style={{ flex: 1 }}>{item.nama}</T><T>{status}</T></Baris></Kartu>
        </View>;
      }}
      ListFooterComponent={<T redup ukuran={12}>Rekap bulanan (Excel) bisa diunduh dari versi web, menu Kelas Saya.</T>}>
      <Hero style={{ marginHorizontal: -16, marginTop: -16 }}>
        <T ukuran={12} style={{ color: W.putih }}>Wali kelas</T>
        <Baris style={{ marginTop: 4, paddingRight: 8 }}><T ringkas tebal ukuran={24} style={{ color: W.putih, flex: 1 }}>Kelas {data?.kelas.nama ?? u.kelasWali.find(k => k.id === kelasId)?.nama}</T>
          {data && <T tebal style={{ backgroundColor: "#1B7258", color: W.putih, padding: 8, borderRadius: 10 }}>{data.siswa.length} siswa</T>}
        </Baris>
        {grafik.length === 1 && <T ukuran={13} style={{ color: W.putih }}>{grafik[0].persen}% hadir · 1 dari {data?.jadwal.length} jam terisi</T>}
        {grafik.length >= 2 && <>
          <T ukuran={12} style={{ color: W.putih }}>Kehadiran per jam pelajaran</T>
          <ScrollView horizontal contentContainerStyle={{ alignItems: "flex-end", gap: 6 }}>
            {grafik.map(g => <View key={g.id} accessible accessibilityLabel={`Jam ${g.jam}, ${g.persen}% hadir`}
              style={{ width: 52, alignItems: "center", gap: 3 }}>
              <T ukuran={12} style={{ color: W.putih }}>{g.persen}%</T>
              <View style={{ width: 16, height: Math.max(2, g.persen * .44), borderRadius: 6, backgroundColor: g.id === jam?.id ? W.emas : "#2E8A6C" }} />
              <T ukuran={12} style={{ color: W.putih }}>Jam {g.jam}</T>
            </View>)}
          </ScrollView>
        </>}
        {(data?.sepekan?.filter(h => h.persen != null).length ?? 0) >= 2 && <>
          <T ukuran={12} style={{ color: W.putih, marginTop: 6 }}>Kehadiran 6 hari sekolah terakhir</T>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 6 }}>
            {data!.sepekan!.map(h => {
              const label = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][new Date(h.tanggal + "T00:00:00Z").getUTCDay()];
              return <View key={h.tanggal} accessible accessibilityLabel={`${label}, ${h.persen == null ? "belum ada data" : h.persen + "% hadir"}`}
                style={{ flex: 1, alignItems: "center", gap: 3 }}>
                <T ukuran={11} style={{ color: W.putih }}>{h.persen == null ? "–" : h.persen}</T>
                <View style={{ alignSelf: "stretch", height: h.persen == null ? 2 : Math.max(4, h.persen * .44), borderRadius: 6,
                  backgroundColor: h.persen == null ? "#2E8A6C" : h.tanggal === tanggal ? W.emas : "#3FA07F" }} />
                <T ukuran={11} style={{ color: "#CFE8DD" }}>{label}</T>
              </View>;
            })}
          </View>
        </>}
      </Hero>
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
          <Judul kecil>{tanggal === hariIni ? "Tidak hadir hari ini" : "Tidak hadir pada tanggal ini"}</Judul>
          <Kartu>{absen.length ? absen.map(siswa => <Baris key={siswa.id} style={{ paddingVertical: 4 }}>
            <Avatar nama={siswa.nama} status={siswa.jamAbsen[0].kode} size={36} />
            <View style={{ flex: 1 }}><T tebal>{siswa.nama}</T><T redup ukuran={12}>{siswa.jamAbsen.map(j => LABEL_STATUS_SISWA[j.kode] + " · jam " + j.jam).join(", ")}</T></View>
          </Baris>) : <T redup>Belum ada ketidakhadiran tercatat.</T>}</Kartu>
          <Baris><Judul kecil>Jurnal kelas</Judul><T redup ukuran={12}>{data.jadwal.filter(j => j.pertemuan).length} dari {data.jadwal.length} terisi</T></Baris>
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
            </Kartu>
          )}
        </>
      )}
    </Daftar>
  );
}
