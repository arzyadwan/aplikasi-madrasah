// Zona waktu Indonesia tidak memakai jam musim panas, jadi selisih UTC tetap.
const SELISIH: Record<string, number> = {
  "Asia/Jakarta": 7, "Asia/Pontianak": 7, "Asia/Makassar": 8, "Asia/Jayapura": 9,
};

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function geser(zona: string, d: Date) {
  return new Date(d.getTime() + (SELISIH[zona] ?? 8) * 3600000);
}

/** YYYY-MM-DD di zona madrasah */
export function tanggalDiZona(zona: string, d: Date = new Date()): string {
  return geser(zona, d).toISOString().slice(0, 10);
}

/** HH:MM di zona madrasah */
export function jamDiZona(zona: string, iso: string | Date): string {
  return geser(zona, typeof iso === "string" ? new Date(iso) : iso).toISOString().slice(11, 16);
}

export function formatTanggal(tgl: string, denganHari = true): string {
  const d = new Date(`${tgl}T00:00:00Z`);
  const s = `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return denganHari ? `${HARI[d.getUTCDay()]}, ${s}` : s;
}

export function tambahHari(tgl: string, n: number): string {
  const d = new Date(`${tgl}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Jarak dua titik GPS dalam meter (haversine) */
export function jarakMeter(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
