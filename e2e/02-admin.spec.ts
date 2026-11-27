import { expect, test } from "@playwright/test";
import { masuk } from "./bantuan";

test.beforeEach(async ({ page }) => { await masuk(page, "admin"); });

test("atur lokasi madrasah dan radius", async ({ page }) => {
  await page.goto("/admin/pengaturan");
  await page.locator('input[name="lat"]').fill("-4.0712");
  await page.locator('input[name="lng"]').fill("122.0451");
  await page.locator('input[name="radiusMeter"]').fill("200");
  await page.getByRole("button", { name: "Simpan" }).first().click();
  await expect(page.getByText("Pengaturan disimpan.")).toBeVisible();
});

test("tambah guru baru dan login dengan kata sandi awal", async ({ page, browser }) => {
  await page.goto("/admin/pengguna");
  await page.getByLabel("Nama lengkap *").fill("Hasnah Uji Coba");
  await page.getByLabel("Nama pengguna (untuk login) *").fill("hasnah.uji");
  await page.getByLabel(/Kata sandi awal/).fill("sandiawal1");
  await page.getByRole("button", { name: "Tambah" }).click();
  await expect(page.getByText(/Akun hasnah.uji dibuat/)).toBeVisible();

  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await masuk(p2, "hasnah.uji", "sandiawal1");
  await expect(p2).toHaveURL(/\/guru$/);
  await expect(p2.getByText("Tidak ada jadwal mengajar hari ini.")).toBeVisible();
  await ctx.close();
});

test("impor siswa dari salinan Excel", async ({ page }) => {
  await page.goto("/admin/siswa");
  await page.locator('textarea[name="data"]').fill(
    "NIS\tNISN\tNama\tL/P\tKelas\n9901\t0099000001\tUji Impor Satu\tL\tVII A\n9902\t0099000002\tUji Impor Dua\tP\tVII A",
  );
  await page.getByRole("button", { name: "Impor" }).click();
  await expect(page.getByText("Impor selesai: 2 siswa baru, 0 diperbarui.")).toBeVisible();
  // impor ulang dengan NIS sama → diperbarui, bukan dobel
  await page.locator('textarea[name="data"]').fill("9901\t0099000001\tUji Impor Satu Revisi\tL\tVII A");
  await page.getByRole("button", { name: "Impor" }).click();
  await expect(page.getByText("Impor selesai: 0 siswa baru, 1 diperbarui.")).toBeVisible();
});

test("impor dengan kelas tidak dikenal ditolak tanpa menyimpan apa pun", async ({ page }) => {
  await page.goto("/admin/siswa");
  await page.locator('textarea[name="data"]').fill("9903\t\tUji Salah\tL\tX Z");
  await page.getByRole("button", { name: "Impor" }).click();
  await expect(page.getByText(/kelas "X Z" tidak ada/)).toBeVisible();
});

test("jadwal bentrok ditolak", async ({ page }) => {
  await page.goto("/admin/jadwal");
  // jadwal contoh sudah mengisi Senin jam 1–2 untuk setiap kelas
  await page.locator('select[name="hari"]').selectOption("1");
  await page.locator('select[name="jamMulai"]').selectOption("1");
  await page.locator('select[name="jamSelesai"]').selectOption("2");
  await page.getByRole("button", { name: "Tambah" }).click();
  await expect(page.getByText(/^Bentrok:/)).toBeVisible();
});
