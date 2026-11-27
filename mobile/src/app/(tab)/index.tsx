import { Link, Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";
import { useAntrean } from "@/lib/antrean";
import { useHariIni } from "@/lib/hari-ini";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_GURU } from "@/lib/tipe";
import { jamDiZona, tanggalDiZona } from "@/lib/waktu";
import { Baris, Judul, Kartu, Layar, Lencana, Memuat, Pesan, T, Tombol, W } from "@/components/ui";

export default function HariIni() {
  const { pengguna: u, zona } = useSaya();
  const { data, memuat, offline, galat, muat } = useHariIni();
  const antrean = useAntrean();
  useFocusEffect(useCallback(() => { void muat(); }, [muat]));

  const tanggal = data?.data.tanggal;
  const menunggu = useMemo(() => new Set(antrean
    .filter((x) => x.path === "/api/pertemuan" && x.body.tanggal === tanggal)
    .map((x) => String(x.body.jadwalId))), [antrean, tanggal]);
  const absenTertunda = antrean.some((x) => x.path === "/api/absen-guru" && x.body.tanggal === tanggal);

  if (!(u.peran === "GURU" || u.mengajar)) return <Redirect href="/pantauan" />;
  if (!data) return memuat ? <Memuat /> : <Layar segarkan={muat}><Pesan jenis="galat" teks={galat ?? "Gagal memuat jadwal."} /></Layar>;

  const kedaluwarsa = data.data.tanggal !== tanggalDiZona(zona);
  const jadwal = data.data.jadwal.filter((j) => j.milikSaya);
  const selesai = jadwal.filter((j) => j.pertemuan || menunggu.has(j.id)).length;
  const a = data.absenSaya;

  return (
    <Layar segarkan={muat} memuat={memuat}>
      <View>
        <Judul>Assalamu&apos;alaikum, {u.nama.split(" ")[0]}</Judul>
        <T redup>{data.data.tanggalTeks}</T>
      </View>
      {offline && <Pesan jenis="antre" teks="Sedang offline. Menampilkan jadwal yang tersimpan di HP." />}
      {kedaluwarsa && <Pesan jenis="galat" teks={`Jadwal ini dari ${data.data.tanggalTeks}. Sambungkan internet lalu tarik layar ke bawah untuk memuat jadwal hari ini.`} />}
      {galat && <Pesan jenis="galat" teks={galat} />}

      <Kartu style={!a && !absenTertunda ? { borderColor: "#fcd34d", backgroundColor: "#fffbeb" } : undefined}>
        <Baris>
          <View style={{ flex: 1 }}>
            <T tebal>Absen Saya</T>
            <T redup>
              {a ? `${LABEL_STATUS_GURU[a.status]} · tercatat ${jamDiZona(zona, a.waktuMasuk)}`
                : absenTertunda ? "Tersimpan di HP, menunggu dikirim." : "Anda belum absen hari ini."}
            </T>
          </View>
          {!a && !absenTertunda && <Tombol judul="Absen" onPress={() => router.navigate("/absen")} />}
        </Baris>
      </Kartu>

      <Baris>
        <Judul kecil>Jadwal mengajar</Judul>
        {jadwal.length > 0 && <T redup ukuran={13}>{selesai} dari {jadwal.length} sudah diisi</T>}
      </Baris>
      {jadwal.length === 0 && <Kartu><T redup>Tidak ada jadwal mengajar hari ini.</T></Kartu>}
      {jadwal.map((j) => {
        const st = j.pertemuan ? "terisi" : menunggu.has(j.id) ? "menunggu" : "belum";
        return (
          <Link key={j.id} href={{ pathname: "/isi/[jadwalId]", params: { jadwalId: j.id } }} asChild>
            <Pressable accessibilityRole="button" testID={`jadwal-${j.id}`}>
              <Kartu>
                <Baris>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T redup ukuran={12}>Jam ke-{j.jamMulai}{j.jamSelesai > j.jamMulai ? `–${j.jamSelesai}` : ""} · {j.waktu}</T>
                    <T tebal ukuran={16}>{j.mapel.nama}</T>
                    <T redup>Kelas {j.kelas.nama} · {j.siswa.length} siswa</T>
                  </View>
                  {st === "terisi" && <Lencana teks="Sudah diisi" jenis="hijau" />}
                  {st === "menunggu" && <Lencana teks="Menunggu dikirim" jenis="kuning" />}
                  {st === "belum" && <Lencana teks="Isi absen" />}
                </Baris>
              </Kartu>
            </Pressable>
          </Link>
        );
      })}

      <Kartu>
        <T tebal>Menggantikan guru lain?</T>
        <T redup>Bila ada guru berhalangan, Anda bisa mengisi absen dan jurnal kelasnya sebagai guru pengganti.</T>
        <View style={{ marginTop: 6 }}>
          <Tombol jenis="garis" judul="Lihat jadwal hari ini" onPress={() => router.push("/pengganti")} />
        </View>
      </Kartu>
      <T redup ukuran={12} style={{ textAlign: "center", color: W.redup }}>Tarik layar ke bawah untuk memperbarui.</T>
    </Layar>
  );
}
