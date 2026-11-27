import { expect, test } from "@playwright/test";
import { hariMinggu, masuk } from "./bantuan";

test.skip(hariMinggu(), "Tidak ada jadwal pada hari Minggu");

test("pantauan harian menampilkan ringkasan", async ({ page }) => {
  await masuk(page, "kepala");
  await expect(page.getByRole("heading", { name: "Pantauan harian" })).toBeVisible();
  await expect(page.getByText("Guru sudah absen")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Guru belum absen/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Jurnal belum diisi/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kehadiran siswa per kelas" })).toBeVisible();
});

test("kepala memeriksa jurnal, guru melihat catatan, jurnal terkunci", async ({ page, browser }) => {
  await masuk(page, "kepala");
  await page.goto("/kepala/jurnal");
  const kartu = page.locator("li.kartu").filter({ hasText: "mad wajib" });
  await expect(kartu).toBeVisible();
  await kartu.getByPlaceholder("Catatan untuk guru (opsional)").fill("Bagus, lanjutkan latihan tajwid.");
  await kartu.getByRole("button", { name: "Sudah diperiksa" }).click();
  await expect(page.locator("li.kartu").filter({ hasText: "mad wajib" }).getByText(/^Diperiksa/)).toBeVisible();

  const ctx = await browser.newContext();
  const guru = await ctx.newPage();
  await masuk(guru, "guru01");
  await guru.goto("/guru/riwayat");
  await expect(guru.getByText("Bagus, lanjutkan latihan tajwid.")).toBeVisible();
  await guru.goto("/guru");
  await guru.locator('a[href^="/guru/isi?jadwal="]').first().click();
  await expect(guru.getByText(/Sudah diperiksa kepala madrasah/)).toBeVisible();
  await expect(guru.getByRole("button", { name: "Simpan perubahan" })).toHaveCount(0);
  await ctx.close();
});

test("kehadiran guru menampilkan foto dan jarak", async ({ page }) => {
  await masuk(page, "kepala");
  await page.goto("/kepala/guru");
  const baris = page.locator("tbody tr").filter({ has: page.getByAltText(/^Foto /) }).first();
  await expect(baris).toContainText("Hadir");
  await expect(baris).toContainText(/±\d+ m/);
});
