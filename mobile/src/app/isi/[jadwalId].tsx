import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { GalatJaringan, GalatServer, minta } from "@/lib/api";
import { idBaru, isiAntrean, useAntrean, kirimAtauAntre, type ItemAntrean } from "@/lib/antrean";
import { cacheHariIni } from "@/lib/hari-ini";
import { konfirmasi } from "@/lib/konfirmasi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { bacaJson, hapus, simpanJson } from "@/lib/penyimpanan";
import { useSaya } from "@/lib/sesi";
import { LABEL_STATUS_SISWA, type ItemJadwal, type ResponsHariIni, type StatusSiswa } from "@/lib/tipe";
import { tanggalDiZona } from "@/lib/waktu";
import { Judul, Kartu, Layar, Masukan, Memuat, Pesan, T, Tombol, W, type JenisPesan } from "@/components/ui";

const URUTAN: StatusSiswa[] = ["H", "S", "I", "A"];
function akhiriKalimat(teks: string) {
  const kalimat = teks.trimEnd();
  return /[.!?]$/.test(kalimat) ? kalimat : kalimat + ".";
}
const WARNA: Record<StatusSiswa, string> = { H: W.utama, S: W.biru, I: W.kuning, A: W.merah };

export default function IsiPertemuan() {
  const { jadwalId, antreanId } = useLocalSearchParams<{ jadwalId: string; antreanId?: string }>();
  const { pengguna, zona } = useSaya();
  const hari = tanggalDiZona(zona);
  const prefix = `draf_v1/${encodeURIComponent(pengguna.id)}/`;
  const kunci = `${prefix}${hari}/${jadwalId}`;
  const [muatan, setMuatan] = useState<{ kunci: string; item?: ItemJadwal; tanggal: string; offline: boolean; galat?: string; draf?: Draf | null; lokal?: ItemAntrean }>();
  useEffect(() => {
    let aktif = true;
    async function buka() {
      const lama = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(prefix) && !k.startsWith(prefix + hari + "/"));
      if (lama.length) await hapus(...lama);
      const lokal = [...isiAntrean()].reverse().find(x => (!antreanId || x.id === antreanId) && x.path === "/api/pertemuan" && x.body.jadwalId === jadwalId && x.body.tanggal === hari);
      const draf = await bacaJson<Draf>(kunci);
      const cache = await cacheHariIni();
      let r = cache;
      let offline = false;
      let galat;
      if (!lokal?.jadwal && (!lokal || !cache?.data.jadwal.some(j => j.id === jadwalId) || cache.data.tanggal !== hari)) {
        try {
          r = await minta<ResponsHariIni>(`/api/m/hari-ini?jadwal=${encodeURIComponent(jadwalId)}`);
          if (r.data.jadwal.some(j => j.id === jadwalId && j.milikSaya)) await simpanJson("cache_hari_ini", r);
        } catch (e) {
          if (e instanceof GalatServer && e.status < 500) r = null;
          offline = e instanceof GalatJaringan;
          galat = e instanceof Error ? e.message : "Gagal memuat jadwal.";
        }
      }
      if (aktif) setMuatan({ kunci, item: lokal?.jadwal ?? r?.data.jadwal.find(j => j.id === jadwalId), tanggal: lokal?.jadwal ? hari : r?.data.tanggal ?? "", offline, galat, draf, lokal });
    }
    buka().catch(() => { if (aktif) setMuatan({ kunci, tanggal: "", offline: false, galat: "Penyimpanan HP tidak dapat dibaca." }); });
    return () => { aktif = false; };
  }, [jadwalId, antreanId, kunci, prefix, hari]);

  if (muatan?.kunci !== kunci) return <Memuat />;
  if (!muatan.item) {
    return (
      <Layar>
        <Pesan jenis="galat" teks={muatan.offline ? "Jadwal ini belum tersimpan di HP. Sambungkan internet lalu coba lagi." : muatan.galat ?? "Jadwal tidak ditemukan untuk hari ini."} />
        <Tombol jenis="garis" judul="Kembali" onPress={() => router.back()} />
      </Layar>
    );
  }
  return <Form key={kunci} kunci={kunci} lokal={muatan.lokal} draf={muatan.tanggal === hari ? muatan.draf : null} item={muatan.item} tanggal={muatan.tanggal} offline={muatan.offline} />;
}

type Draf = { materi: string; kd: string; catatan: string; isian: Record<string, { status: StatusSiswa; keterangan: string }> };

function Form({ item, tanggal, offline, kunci, lokal, draf }: { kunci: string; lokal?: ItemAntrean; draf?: Draf | null; item: ItemJadwal; tanggal: string; offline: boolean }) {
  const { pengguna, zona } = useSaya();
  const p = item.pertemuan;
  const hariIni = tanggalDiZona(zona);
  const bisaUbah = (!p || (p.guruId === pengguna.id && !p.diperiksa)) && tanggal === hariIni;
  const pengganti = !item.milikSaya;
  const bolehIsi = bisaUbah && pengguna.peran !== "ADMIN";

  const antrean = useAntrean();
  const aktif = antrean.find(x => x.path === "/api/pertemuan" && x.body.tanggal === tanggal && x.body.jadwalId === item.id);
  const body = lokal?.body;
  const absen = (body?.absensi ?? []) as { siswaId: string; status: StatusSiswa; keterangan?: string }[];
  const [isian, setIsian] = useState<Draf["isian"]>(() => {
    const salinan = Object.fromEntries(absen.map(a => [a.siswaId, a]));
    return Object.fromEntries(item.siswa.map(s => {
      const nilai = draf?.isian[s.id] ?? salinan[s.id] ?? p?.absensi[s.id];
      return [s.id, { status: nilai?.status ?? "H", keterangan: nilai?.keterangan ?? "" }];
    }));
  });
  const [materi, setMateri] = useState(draf?.materi ?? String(body ? body.materi ?? "" : p?.materi ?? ""));
  const [kd, setKd] = useState(draf?.kd ?? String(body ? body.kd ?? "" : p?.kd ?? ""));
  const [catatan, setCatatan] = useState(draf?.catatan ?? String(body ? body.catatan ?? "" : p?.catatan ?? ""));
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ jenis: JenisPesan; teks: string } | null>(null);

  const nilai = useMemo(() => ({ materi, kd, catatan, isian }), [materi, kd, catatan, isian]);
  const awal = useRef(nilai);
  const tertunda = useRef<Draf | null>(null);
  const selesai = useRef(false);
  const sibuk = useRef(false);
  const tulis = useRef(Promise.resolve());
  const flush = useMemo(() => () => {
    const d = tertunda.current;
    if (!d || selesai.current) return;
    tertunda.current = null;
    tulis.current = tulis.current.then(() => simpanJson(kunci, d)).catch(() => setPesan({ jenis: "galat", teks: "Draf gagal disimpan di HP." }));
  }, [kunci]);
  useEffect(() => {
    if (!bolehIsi || selesai.current || nilai === awal.current) return;
    tertunda.current = nilai;
    const timer = setTimeout(flush, 350);
    return () => clearTimeout(timer);
  }, [nilai, bolehIsi, flush]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", state => { if (state !== "active") flush(); });
    return () => { sub.remove(); flush(); };
  }, [flush]);

  const rekap = useMemo(() => {
    const r: Record<StatusSiswa, number> = { H: 0, S: 0, I: 0, A: 0 };
    Object.values(isian).forEach((x) => r[x.status]++);
    return r;
  }, [isian]);

  async function kirim() {
    if (!materi.trim()) { setPesan({ jenis: "galat", teks: "Materi yang diajarkan wajib diisi." }); return; }
    if (tanggal !== tanggalDiZona(zona)) { setPesan({ jenis: "galat", teks: "Tanggal sudah berganti." }); return; }
    setProses(true);
    setPesan(null);
    const hasil = await kirimAtauAntre("/api/pertemuan", {
      idKlien: idBaru(), jadwalId: item.id, tanggal,
      materi: materi.trim(), kd: kd.trim() || null, catatan: catatan.trim() || null,
      diisiDiPerangkat: new Date().toISOString(),
      absensi: Object.entries(isian).map(([siswaId, x]) => ({ siswaId, status: x.status, keterangan: x.keterangan.trim() || null })),
    }, `${item.mapel.nama} · ${item.kelas.nama} (${tanggal})`, lokal?.id, item);
    if (hasil.status !== "ditolak") {
      selesai.current = true;
      await tulis.current;
      await hapus(kunci);
    }
    if (hasil.status === "terkirim") {
      setPesan({ jenis: "ok", teks: "Terkirim." });
      setTimeout(() => router.back(), 700);
    } else if (hasil.status === "diantre") {
      setPesan({ jenis: "antre", teks: `Tersimpan di HP, menunggu dikirim. ${hasil.pesan}` });
    } else {
      setPesan({ jenis: "galat", teks: hasil.pesan });
    }
  }

  async function simpan() {
    if (pengganti && !(await konfirmasi("Guru pengganti", akhiriKalimat(`Anda akan mengisi sebagai guru pengganti untuk ${item.guru.nama}`)))) return;
    if (sibuk.current || selesai.current) return;
    sibuk.current = true;
    try { await kirim(); }
    catch { setPesan({ jenis: "galat", teks: "Gagal menyimpan di HP. Coba lagi." }); }
    finally { sibuk.current = false; setProses(false); }
  }

  const [dibuka, setDibuka] = useState(false);
  const [sebelum, setSebelum] = useState<typeof isian | null>(null);
  const adaAbsen = rekap.H < item.siswa.length;
  const terbuka = dibuka || adaAbsen;
  const daftar = useMemo(() => terbuka && item.siswa.map((s, i) => (
          <View key={s.id} style={{ borderTopWidth: i ? 1 : 0, borderColor: W.garis, paddingVertical: 8, gap: 6 }}>
            <>
              <T ukuran={14}><Text style={{ color: W.redup }}>{i + 1}. </Text>{s.nama}</T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup">
                {URUTAN.map((st) => {
                  const pilih = isian[s.id].status === st;
                  return (
                    <Pressable key={st} disabled={!bolehIsi || proses || selesai.current} accessibilityRole="radio" accessibilityState={{ checked: pilih }}
                      accessibilityLabel={`${s.nama} ${LABEL_STATUS_SISWA[st]}`}
                      onPress={() => setIsian((x) => ({ ...x, [s.id]: { status: st, keterangan: st === "H" ? "" : x[s.id].keterangan } }))}
                      style={{ minWidth: 48, minHeight: 48, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center",
                        borderColor: pilih ? WARNA[st] : W.garis, backgroundColor: pilih ? WARNA[st] : W.putih }}>
                      <Text style={{ fontWeight: pilih ? "900" : "400", color: pilih ? W.putih : W.redup }}>{st}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
            {isian[s.id].status !== "H" && (
              <Masukan label={`Keterangan ${s.nama}`} sembunyikanLabel placeholder="Keterangan (opsional)" editable={bolehIsi && !proses && !selesai.current} value={isian[s.id].keterangan}
                onChangeText={(v) => setIsian((x) => ({ ...x, [s.id]: { ...x[s.id], keterangan: v } }))} />
            )}
          </View>
        )), [terbuka, item.siswa, isian, bolehIsi, proses, pesan]);
  const tombolSimpan = bolehIsi && pesan?.jenis !== "antre" && pesan?.jenis !== "ok" && (
        <Tombol judul={proses ? "Menyimpan…" : p ? "Simpan perubahan" : "Simpan absen & jurnal"} onPress={() => void simpan()} memuat={proses} nonaktif={item.siswa.length === 0} />
      );

  return (
    <Layar>
      <View>
        <Judul>{item.mapel.nama}</Judul>
        <T redup>Kelas {item.kelas.nama} · Jam ke-{item.jamMulai}{item.jamSelesai > item.jamMulai ? `–${item.jamSelesai}` : ""} · {item.waktu}</T>
      </View>
      {lokal && !pesan && <Pesan jenis={aktif?.galat ? "galat" : aktif ? "antre" : "ok"} teks={aktif?.galat ? `Perlu diperbaiki. ${aktif.galat}` : aktif ? "Tersimpan di HP, menunggu dikirim." : "Antrean sudah berubah. Buka kembali jadwal."} />}
      {offline && <Pesan jenis="antre" teks="Sedang offline. Isian akan disimpan di HP lalu dikirim otomatis." />}
      {pengganti && <Pesan jenis="info" teks={akhiriKalimat(`Jadwal ${item.guru.nama}`) + (bolehIsi ? " Anda mengisi sebagai guru pengganti." : "")} />}
      {p && <Pesan jenis="ok" teks={akhiriKalimat(`Sudah diisi oleh ${p.namaGuru}${p.pengganti ? " (pengganti)" : ""}`) + (bolehIsi ? " Anda masih bisa mengubahnya hari ini." : "")} />}

      <Kartu>
        <Judul kecil>Kehadiran siswa</Judul>
        <T>{rekap.H} hadir · {rekap.S} sakit · {rekap.I} izin · {rekap.A} alpa</T>
      </Kartu>
      {!bolehIsi && <Pesan jenis="info" teks={
        p?.diperiksa ? "Jurnal sudah diperiksa kepala madrasah, jadi tidak bisa diubah lagi."
        : tanggal < hariIni ? "Jadwal ini sudah lewat harinya, jadi tidak bisa diisi atau diubah lagi."
        : tanggal > hariIni ? "Jadwal ini belum tiba. Jurnal hanya bisa diisi pada hari yang dijadwalkan."
        : pengguna.peran === "ADMIN" ? "Admin hanya bisa melihat jurnal ini."
        : "Jurnal ini sudah diisi oleh guru lain. Hanya guru yang mengisinya yang bisa mengubahnya."
      } />}
      <Kartu style={{ gap: 12 }}>
        <Judul kecil>Jurnal mengajar</Judul>
        <Masukan label="Materi yang diajarkan *" value={materi} onChangeText={setMateri} editable={bolehIsi && !proses && !selesai.current} multiline />
        <Masukan label="KD / tujuan pembelajaran" value={kd} onChangeText={setKd} editable={bolehIsi && !proses && !selesai.current} />
        <Masukan label="Catatan kejadian (opsional)" value={catatan} onChangeText={setCatatan} editable={bolehIsi && !proses && !selesai.current} multiline />
      </Kartu>

      {pesan && (pesan.jenis === "antre"
        ? <Pesan jenis={aktif?.galat ? "galat" : aktif ? "antre" : "ok"} teks={aktif?.galat ? `Perlu diperbaiki. ${aktif.galat}` : aktif ? pesan.teks : "Terkirim."} />
        : <Pesan jenis={pesan.jenis} teks={pesan.teks} />)}
      {tombolSimpan}
      {pesan?.jenis === "antre" && <Tombol jenis="garis" judul="Kembali ke jadwal" onPress={() => router.back()} />}
      {item.siswa.length === 0 ? <T redup>Belum ada siswa di kelas ini.</T> : <Kartu>
        {adaAbsen ? <Judul kecil>Kehadiran per siswa</Judul> :
          <Tombol jenis="garis" judul={terbuka ? "Tutup daftar siswa" : `${bolehIsi ? "Ubah" : "Lihat"} kehadiran siswa (${item.siswa.length})`} onPress={() => { setDibuka(!dibuka); setSebelum(null); }} />}
        {bolehIsi && !proses && !selesai.current && adaAbsen && <Tombol jenis="garis" judul="Semua hadir" onPress={() => {
          setSebelum(isian);
          setDibuka(false);
          setIsian(Object.fromEntries(item.siswa.map(s => [s.id, { status: "H", keterangan: "" }])));
        }} />}
        {sebelum && !proses && !selesai.current && <><T>Semua siswa ditandai hadir.</T><Tombol jenis="teks" judul="Urungkan" onPress={() => {
          setIsian(sebelum);
          setSebelum(null);
        }} /></>}
        {daftar}
      </Kartu>}
      {terbuka && tombolSimpan}
    </Layar>
  );
}
