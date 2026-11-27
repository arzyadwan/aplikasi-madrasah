import { expect, test } from "@playwright/test";
import ExcelJS from "exceljs";
import { masuk } from "./bantuan";

function bulanIni() {
  const t = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());
  const [y, m] = t.split("-").map(Number);
  const akhir = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { dari: `${t.slice(0, 7)}-01`, sampai: akhir };
}

async function bukaExcel(buf: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb;
}

test("kepala mengunduh tiga jenis laporan Excel", async ({ page }) => {
  await masuk(page, "kepala");
  const { dari, sampai } = bulanIni();

  await page.goto("/laporan");
  const [unduhan] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Unduh Excel" }).click()]);
  expect(unduhan.suggestedFilename()).toMatch(/^rekap-siswa-.*\.xlsx$/);

  const guru = await page.request.get(`/api/laporan?jenis=guru&dari=${dari}&sampai=${sampai}`);
  expect(guru.status()).toBe(200);
  const wbGuru = await bukaExcel(await guru.body());
  expect(wbGuru.worksheets.map((w) => w.name)).toEqual(["Rekap", "Harian"]);
  const rekap = wbGuru.getWorksheet("Rekap")!;
  const isiRekap = rekap.getSheetValues().flat().map(String).join(" ");
  expect(isiRekap).toContain("Rekap Kehadiran Guru");

  const jurnal = await page.request.get(`/api/laporan?jenis=jurnal&dari=${dari}&sampai=${sampai}`);
  const wbJurnal = await bukaExcel(await jurnal.body());
  const teks = wbJurnal.getWorksheet("Jurnal")!.getSheetValues().flat().map(String).join(" ");
  expect(teks).toContain("mad wajib");
  expect(teks).toContain("Bagus, lanjutkan latihan tajwid.");
});

test("wali kelas hanya bisa mengunduh rekap kelasnya sendiri", async ({ page }) => {
  await masuk(page, "guru01");
  await page.getByRole("link", { name: "Kelas Saya" }).click();
  await expect(page.getByRole("heading", { name: /^Kelas / })).toBeVisible();
  const href = await page.getByRole("link", { name: "Unduh Excel" }).getAttribute("href");
  const milikSendiri = await page.request.get(href!);
  expect(milikSendiri.status()).toBe(200);
  const wb = await bukaExcel(await milikSendiri.body());
  expect(wb.getWorksheet("Rekap")!.rowCount).toBeGreaterThan(20);

  const kelasLain = await page.request.get(href!.replace(/kelas=[^&]+/, "kelas=bukan-kelas-saya"));
  expect([403, 404]).toContain(kelasLain.status());
});
