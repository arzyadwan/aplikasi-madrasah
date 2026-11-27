import { tanggalLokal } from "./waktu";

/**
 * Aturan pengisian (kuesioner 5.6, 7.8, 3.7):
 * - Absen dan jurnal hanya untuk hari yang sama. Isian yang sudah lewat harinya tidak boleh diubah.
 * - Isian yang dibuat saat offline tetap sah jika diisi di perangkat pada tanggal tersebut
 *   dan terkirim paling lambat `batasSinkronJam` jam setelahnya.
 */
export function bolehIsi(
  tanggal: string,
  diisiDiPerangkat: Date | null,
  batasSinkronJam: number,
  sekarang: Date = new Date(),
): { boleh: true } | { boleh: false; alasan: string } {
  const hariIni = tanggalLokal(sekarang);
  if (tanggal > hariIni) return { boleh: false, alasan: "Tanggal belum tiba." };
  if (tanggal === hariIni) return { boleh: true };
  if (!diisiDiPerangkat || isNaN(diisiDiPerangkat.getTime())) {
    return { boleh: false, alasan: "Isian untuk hari yang sudah lewat tidak bisa diisi atau diubah." };
  }
  if (tanggalLokal(diisiDiPerangkat) !== tanggal) {
    return { boleh: false, alasan: "Isian offline harus dibuat pada tanggal yang sama." };
  }
  if (diisiDiPerangkat.getTime() > sekarang.getTime() + 5 * 60 * 1000) {
    return { boleh: false, alasan: "Waktu di perangkat tidak sesuai. Periksa jam HP." };
  }
  const selisihJam = (sekarang.getTime() - diisiDiPerangkat.getTime()) / 3600000;
  if (selisihJam > batasSinkronJam) {
    return { boleh: false, alasan: `Isian offline terlambat dikirim (lebih dari ${batasSinkronJam} jam).` };
  }
  return { boleh: true };
}
