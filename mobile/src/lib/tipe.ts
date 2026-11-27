// Tipe data dari server (lihat src/lib/tipe.ts di aplikasi web)

export type Peran = "ADMIN" | "KEPALA" | "GURU";
export type StatusSiswa = "H" | "S" | "I" | "A";
export type StatusGuru = "HADIR" | "IZIN" | "SAKIT" | "DINAS";

export const LABEL_STATUS_SISWA: Record<StatusSiswa, string> = { H: "Hadir", S: "Sakit", I: "Izin", A: "Alpa" };
export const LABEL_STATUS_GURU: Record<StatusGuru, string> = { HADIR: "Hadir", IZIN: "Izin", SAKIT: "Sakit", DINAS: "Dinas luar" };
export const LABEL_PERAN: Record<Peran, string> = { ADMIN: "Operator / TU", KEPALA: "Kepala Madrasah", GURU: "Guru" };

export type Rekap = { H: number; S: number; I: number; A: number };

export type Pengguna = {
  id: string;
  nama: string;
  username: string;
  peran: Peran;
  kelasWali: { id: string; nama: string }[];
  mengajar: boolean;
};

export type Saya = {
  pengguna: Pengguna;
  madrasah: { nama: string; lat: number | null; lng: number | null; radiusMeter: number };
  zona: string;
  tanggal: string;
  batasSinkronJam: number;
};

export type SiswaRingkas = { id: string; nama: string; nis: string | null; jk: "L" | "P" };

export type PertemuanRingkas = {
  id: string;
  idKlien: string;
  materi: string;
  kd: string | null;
  catatan: string | null;
  namaGuru: string;
  guruId: string;
  pengganti: boolean;
  diperiksa: boolean;
  absensi: Record<string, { status: StatusSiswa; keterangan: string | null }>;
};

export type ItemJadwal = {
  id: string;
  hari: number;
  jamMulai: number;
  jamSelesai: number;
  waktu: string;
  kelas: { id: string; nama: string };
  mapel: { id: string; nama: string };
  guru: { id: string; nama: string };
  milikSaya: boolean;
  siswa: SiswaRingkas[];
  pertemuan: PertemuanRingkas | null;
};

export type DataHariIni = { tanggal: string; tanggalTeks: string; penggunaId: string; jadwal: ItemJadwal[] };

export type AbsenSaya = {
  id: string;
  status: StatusGuru;
  waktuMasuk: string;
  jarakMeter: number | null;
  dalamRadius: boolean | null;
  keterangan: string | null;
  adaFoto: boolean;
};

export type ResponsHariIni = { data: DataHariIni; absenSaya: AbsenSaya | null };

export type JadwalUmum = {
  id: string;
  jamMulai: number;
  jamSelesai: number;
  waktu: string;
  kelas: { id: string; nama: string };
  mapel: { id: string; nama: string };
  guru: { id: string; nama: string };
  pertemuan: { id: string; namaGuru: string; pengganti: boolean; diperiksa: boolean; rekap: Rekap } | null;
};

export type ItemRiwayat = {
  id: string; tanggal: string; jamMulai: number; jamSelesai: number; jadwalId: string | null;
  kelas: string; mapel: string; pengganti: boolean; materi: string; kd: string | null; catatan: string | null;
  rekap: Rekap; diperiksa: boolean; diperiksaOleh: string | null; catatanKepala: string | null;
};

export type ResponsWali = {
  kelasWali: { id: string; nama: string }[];
  kelas: { id: string; nama: string };
  tanggal: string;
  jadwal: JadwalUmum[];
  siswa: { id: string; nama: string; nis: string | null }[];
  status: Record<string, Record<string, StatusSiswa>>;
};

export type ResponsPantauan = {
  tanggal: string;
  guru: { total: number; sudahAbsen: number; hadir: number; luarRadius: number };
  belumAbsen: { id: string; nama: string; berjadwal: boolean }[];
  jadwal: { total: number; terisi: number; belumDiperiksa: number };
  belumJurnal: (JadwalUmum & { lewat: boolean })[];
  siswa: { persenHadir: number | null };
  perKelas: { id: string; nama: string; jumlahSiswa: number; jadwal: number; terisi: number; rekap: Rekap; tidakHadir: { nama: string; status: string[] }[] }[];
};

export type ItemJurnal = {
  id: string; jamMulai: number; jamSelesai: number; kelas: string; mapel: string; guru: string; menggantikan: string | null;
  materi: string; kd: string | null; catatan: string | null; rekap: Rekap;
  tidakHadir: { nama: string; status: StatusSiswa; keterangan: string | null }[];
  diperiksa: boolean; diperiksaOleh: string | null; catatanKepala: string | null;
};

export type ItemKehadiranGuru = {
  id: string; nama: string; jadwal: number; jurnal: number;
  absen: { id: string; status: StatusGuru; waktuMasuk: string; jarakMeter: number | null; dalamRadius: boolean | null;
    keterangan: string | null; adaFoto: boolean; lat: number | null; lng: number | null } | null;
};
