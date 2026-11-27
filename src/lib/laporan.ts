import "server-only";
import ExcelJS from "exceljs";
import { db } from "./db";
import { dariDbDate, formatTanggal, hariSekolah, keDbDate, nomorHari, rentangTanggal, tanggalLokal } from "./waktu";

const HIJAU = "FF18734F";

async function bukuBaru(judul: string, dari: string, sampai: string) {
  const p = await db.pengaturan.findUnique({ where: { id: 1 } });
  const wb = new ExcelJS.Workbook();
  wb.creator = "Aplikasi Madrasah";
  wb.created = new Date();
  const kop = [p?.namaMadrasah ?? "Madrasah", judul, `Periode: ${formatTanggal(dari, false)} s.d. ${formatTanggal(sampai, false)}`];
  return { wb, kop };
}

function lembar(wb: ExcelJS.Workbook, nama: string, kop: string[], header: string[], lebar: number[]) {
  const ws = wb.addWorksheet(nama, { views: [{ state: "frozen", ySplit: kop.length + 2 }] });
  kop.forEach((t, i) => {
    const r = ws.addRow([t]);
    r.font = { bold: i < 2, size: i === 0 ? 13 : 11 };
  });
  ws.addRow([]);
  const h = ws.addRow(header);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  h.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HIJAU } };
    c.border = { bottom: { style: "thin" } };
  });
  lebar.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  return ws;
}

function garis(ws: ExcelJS.Worksheet, dariBaris: number) {
  for (let r = dariBaris; r <= ws.rowCount; r++) {
    ws.getRow(r).eachCell({ includeEmpty: true }, (c) => {
      c.border = { top: { style: "hair" }, bottom: { style: "hair" }, left: { style: "hair" }, right: { style: "hair" } };
    });
  }
}

/** Rekap kehadiran siswa satu kelas (dihitung per jam pelajaran) */
export async function laporanSiswa(kelasId: string, dari: string, sampai: string) {
  const kelas = await db.kelas.findUniqueOrThrow({ where: { id: kelasId }, include: { waliKelas: { select: { nama: true } } } });
  const siswa = await db.siswa.findMany({ where: { kelasId, aktif: true }, orderBy: { nama: "asc" } });
  const absensi = await db.absensiSiswa.findMany({
    where: { siswa: { kelasId }, pertemuan: { tanggal: { gte: keDbDate(dari), lte: keDbDate(sampai) } } },
    select: { siswaId: true, status: true, pertemuan: { select: { tanggal: true } } },
  });

  const { wb, kop } = await bukuBaru(`Rekap Kehadiran Siswa Kelas ${kelas.nama}`, dari, sampai);
  kop.push(`Wali kelas: ${kelas.waliKelas?.nama ?? "-"}`);

  const ws = lembar(wb, "Rekap", kop, ["No", "NIS", "Nama siswa", "Hadir", "Sakit", "Izin", "Alpa", "Total jam", "% Hadir"], [5, 12, 32, 9, 9, 9, 9, 10, 10]);
  const awalData = ws.rowCount + 1;
  siswa.forEach((s, i) => {
    const r = { H: 0, S: 0, I: 0, A: 0 };
    absensi.filter((a) => a.siswaId === s.id).forEach((a) => r[a.status]++);
    const total = r.H + r.S + r.I + r.A;
    const row = ws.addRow([i + 1, s.nis ?? "", s.nama, r.H, r.S, r.I, r.A, total, total ? r.H / total : null]);
    row.getCell(9).numFmt = "0%";
  });
  garis(ws, awalData);
  ws.addRow([]);
  ws.addRow(["Keterangan: angka adalah jumlah jam pelajaran. Satu hari bisa terdiri dari beberapa jam pelajaran."]).font = { italic: true, size: 9 };

  // Lembar harian: satu kode per hari (A bila ada alpa, lalu S, I, H)
  const tanggal = rentangTanggal(dari, sampai).filter(hariSekolah);
  const wh = lembar(wb, "Harian", kop, ["No", "Nama siswa", ...tanggal.map((t) => t.slice(8))], [5, 30, ...tanggal.map(() => 4.5)]);
  const awalHarian = wh.rowCount + 1;
  siswa.forEach((s, i) => {
    const perHari = tanggal.map((t) => {
      const st = new Set(absensi.filter((a) => a.siswaId === s.id && dariDbDate(a.pertemuan.tanggal) === t).map((a) => a.status));
      return st.has("A") ? "A" : st.has("S") ? "S" : st.has("I") ? "I" : st.has("H") ? "H" : "";
    });
    const row = wh.addRow([i + 1, s.nama, ...perHari]);
    row.eachCell((c, col) => {
      if (col > 2) {
        c.alignment = { horizontal: "center" };
        if (c.value === "A") c.font = { bold: true, color: { argb: "FFC00000" } };
      }
    });
  });
  garis(wh, awalHarian);
  return { wb, nama: `rekap-siswa-${kelas.nama.replace(/\s+/g, "")}-${dari}_${sampai}.xlsx` };
}

/** Rekap kehadiran guru dan keterisian jurnal */
export async function laporanGuru(dari: string, sampai: string) {
  const batas = sampai > tanggalLokal() ? tanggalLokal() : sampai;
  const tanggal = rentangTanggal(dari, batas).filter(hariSekolah);
  const [guru, absen, jadwal, pertemuan] = await Promise.all([
    db.pengguna.findMany({ where: { aktif: true }, orderBy: { nama: "asc" } }),
    db.absensiGuru.findMany({ where: { tanggal: { gte: keDbDate(dari), lte: keDbDate(sampai) } } }),
    db.jadwal.findMany({ select: { guruId: true, hari: true } }),
    db.pertemuan.groupBy({ by: ["guruId"], where: { tanggal: { gte: keDbDate(dari), lte: keDbDate(sampai) } }, _count: true }),
  ]);
  const jurnal = new Map(pertemuan.map((p) => [p.guruId, p._count]));

  const { wb, kop } = await bukuBaru("Rekap Kehadiran Guru", dari, sampai);
  const ws = lembar(wb, "Rekap", kop,
    ["No", "Nama", "Hadir", "Izin", "Sakit", "Dinas", "Tidak absen", "Di luar area", "Jurnal diisi", "Jadwal", "% Jurnal"],
    [5, 30, 8, 8, 8, 8, 11, 11, 11, 9, 10]);
  const awal = ws.rowCount + 1;
  guru.forEach((g, i) => {
    const a = absen.filter((x) => x.penggunaId === g.id);
    const c = (s: string) => a.filter((x) => x.status === s).length;
    const terjadwal = tanggal.reduce((n, t) => n + jadwal.filter((j) => j.guruId === g.id && j.hari === nomorHari(t)).length, 0);
    const tercatat = new Set(a.map((x) => dariDbDate(x.tanggal)));
    const tidakAbsen = tanggal.filter((t) => !tercatat.has(t)).length;
    const diisi = jurnal.get(g.id) ?? 0;
    const row = ws.addRow([i + 1, g.nama, c("HADIR"), c("IZIN"), c("SAKIT"), c("DINAS"), tidakAbsen,
      a.filter((x) => x.dalamRadius === false).length, diisi, terjadwal, terjadwal ? Math.min(1, diisi / terjadwal) : null]);
    row.getCell(11).numFmt = "0%";
  });
  garis(ws, awal);
  ws.addRow([]);
  ws.addRow([`Hari sekolah dihitung Senin–Sabtu sampai ${formatTanggal(batas, false)}. Jurnal diisi termasuk saat menjadi guru pengganti.`]).font = { italic: true, size: 9 };

  const kode: Record<string, string> = { HADIR: "H", IZIN: "I", SAKIT: "S", DINAS: "D" };
  const wh = lembar(wb, "Harian", kop, ["No", "Nama", ...tanggal.map((t) => t.slice(8))], [5, 30, ...tanggal.map(() => 4.5)]);
  const awalH = wh.rowCount + 1;
  guru.forEach((g, i) => {
    const row = wh.addRow([i + 1, g.nama, ...tanggal.map((t) => {
      const a = absen.find((x) => x.penggunaId === g.id && dariDbDate(x.tanggal) === t);
      return a ? kode[a.status] : "-";
    })]);
    row.eachCell((c, col) => { if (col > 2) c.alignment = { horizontal: "center" }; });
  });
  garis(wh, awalH);
  wh.addRow([]);
  wh.addRow(["H = hadir, I = izin, S = sakit, D = dinas luar, - = tidak absen"]).font = { italic: true, size: 9 };
  return { wb, nama: `rekap-guru-${dari}_${sampai}.xlsx` };
}

/** Daftar jurnal mengajar */
export async function laporanJurnal(dari: string, sampai: string, kelasId?: string) {
  const daftar = await db.pertemuan.findMany({
    where: { tanggal: { gte: keDbDate(dari), lte: keDbDate(sampai) }, ...(kelasId ? { kelasId } : {}) },
    include: {
      kelas: { select: { nama: true } }, mapel: { select: { nama: true } }, guru: { select: { nama: true } },
      jadwal: { select: { guru: { select: { nama: true } } } },
      absensi: { select: { status: true } }, diperiksaOleh: { select: { nama: true } },
    },
    orderBy: [{ tanggal: "asc" }, { jamMulai: "asc" }, { kelas: { nama: "asc" } }],
  });
  const { wb, kop } = await bukuBaru("Jurnal Mengajar", dari, sampai);
  const ws = lembar(wb, "Jurnal", kop,
    ["Tanggal", "Jam", "Kelas", "Mata pelajaran", "Guru", "Materi", "KD / tujuan", "Catatan", "H", "S", "I", "A", "Diperiksa", "Catatan kepala"],
    [12, 7, 9, 24, 24, 40, 28, 28, 5, 5, 5, 5, 14, 28]);
  const awal = ws.rowCount + 1;
  for (const p of daftar) {
    const r = { H: 0, S: 0, I: 0, A: 0 };
    p.absensi.forEach((a) => r[a.status]++);
    const row = ws.addRow([
      dariDbDate(p.tanggal), `${p.jamMulai}-${p.jamSelesai}`, p.kelas.nama, p.mapel.nama,
      p.guru.nama + (p.pengganti && p.jadwal ? ` (pengganti ${p.jadwal.guru.nama})` : ""),
      p.materi, p.kd ?? "", p.catatan ?? "", r.H, r.S, r.I, r.A,
      p.diperiksaPada ? `Ya${p.diperiksaOleh ? ` (${p.diperiksaOleh.nama})` : ""}` : "Belum", p.catatanKepala ?? "",
    ]);
    row.alignment = { vertical: "top", wrapText: true };
  }
  garis(ws, awal);
  return { wb, nama: `jurnal-${dari}_${sampai}.xlsx` };
}
