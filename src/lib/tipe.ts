// Tipe data yang dipakai bersama oleh server dan klien (harus bisa di-JSON-kan).

export type StatusSiswa = "H" | "S" | "I" | "A";
export type StatusGuru = "HADIR" | "IZIN" | "SAKIT" | "DINAS";

export const LABEL_STATUS_SISWA: Record<StatusSiswa, string> = { H: "Hadir", S: "Sakit", I: "Izin", A: "Alpa" };
export const LABEL_STATUS_GURU: Record<StatusGuru, string> = { HADIR: "Hadir", IZIN: "Izin", SAKIT: "Sakit", DINAS: "Dinas luar" };

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
  waktu: string; // "07:30–08:50"
  kelas: { id: string; nama: string };
  mapel: { id: string; nama: string };
  guru: { id: string; nama: string };
  milikSaya: boolean;
  siswa: SiswaRingkas[];
  pertemuan: PertemuanRingkas | null;
  /** Materi pertemuan terakhir untuk kelas dan mapel yang sama (sebelum tanggal ini) */
  materiLalu?: { tanggal: string; materi: string } | null;
};

export type DataHariIni = {
  tanggal: string;
  tanggalTeks: string;
  penggunaId: string;
  jadwal: ItemJadwal[];
};
