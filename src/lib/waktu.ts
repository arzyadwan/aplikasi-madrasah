// Semua aturan "hari ini" memakai zona waktu madrasah (default WITA).
export const ZONA = process.env.APP_TZ || "Asia/Makassar";

export const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function bagian(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return p as Record<string, string>;
}

/** Tanggal (YYYY-MM-DD) di zona madrasah untuk waktu tertentu */
export function tanggalLokal(d: Date = new Date()): string {
  const p = bagian(d);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Jam:menit (HH:MM) di zona madrasah */
export function jamLokal(d: Date = new Date()): string {
  const p = bagian(d);
  return `${p.hour}:${p.minute}`;
}

/** Ubah "YYYY-MM-DD" menjadi Date untuk kolom @db.Date */
export function keDbDate(tgl: string): Date {
  return new Date(`${tgl}T00:00:00.000Z`);
}

/** Ubah Date dari kolom @db.Date menjadi "YYYY-MM-DD" */
export function dariDbDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Nomor hari: 0 = Minggu, 1 = Senin, ... 6 = Sabtu */
export function nomorHari(tgl: string): number {
  return keDbDate(tgl).getUTCDay();
}

export function tambahHari(tgl: string, n: number): string {
  const d = keDbDate(tgl);
  d.setUTCDate(d.getUTCDate() + n);
  return dariDbDate(d);
}

export function validTanggal(tgl: unknown): tgl is string {
  return typeof tgl === "string" && /^\d{4}-\d{2}-\d{2}$/.test(tgl) && !isNaN(keDbDate(tgl).getTime());
}

/** "Senin, 27 November 2026" */
export function formatTanggal(tgl: string, denganHari = true): string {
  const d = keDbDate(tgl);
  const s = `${d.getUTCDate()} ${NAMA_BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return denganHari ? `${NAMA_HARI[d.getUTCDay()]}, ${s}` : s;
}

/** Senin dari minggu yang memuat tanggal tsb. */
export function awalMinggu(tgl: string): string {
  const h = nomorHari(tgl);
  return tambahHari(tgl, h === 0 ? -6 : 1 - h);
}

export function awalBulan(tgl: string): string {
  return tgl.slice(0, 8) + "01";
}

export function akhirBulan(tgl: string): string {
  const d = keDbDate(awalBulan(tgl));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return dariDbDate(d);
}

/** Daftar tanggal dari a sampai b (inklusif) */
export function rentangTanggal(a: string, b: string): string[] {
  const out: string[] = [];
  for (let t = a; t <= b; t = tambahHari(t, 1)) out.push(t);
  return out;
}

/** Hari sekolah: Senin sampai Sabtu */
export function hariSekolah(tgl: string): boolean {
  return nomorHari(tgl) !== 0;
}
