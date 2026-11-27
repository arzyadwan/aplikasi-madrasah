import { expect, test } from "@playwright/test";
import { hariMinggu, masuk } from "./bantuan";

test.skip(hariMinggu(), "Tidak ada jadwal pada hari Minggu");

test("isi absen saat offline lalu terkirim otomatis saat online", async ({ page, context }) => {
  await masuk(page, "guru04");
  // tunggu service worker aktif dan halaman tersimpan
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.ready).active);
  await page.reload();
  const tautan = page.locator('a[href^="/guru/isi?jadwal="]');
  const jumlah = await tautan.count();
  test.skip(jumlah < 1, "guru04 tidak punya jadwal hari ini");
  const hrefTerakhir = await tautan.nth(jumlah - 1).getAttribute("href");
  // buka sekali halaman isian agar tersimpan di cache
  await page.goto(await tautan.first().getAttribute("href") ?? "/guru");
  await expect(page.getByRole("heading", { level: 2, name: "Kehadiran siswa" })).toBeVisible();
  await page.goto("/guru");

  await context.setOffline(true);
  await page.goto(hrefTerakhir!);
  await expect(page.getByRole("heading", { level: 2, name: "Kehadiran siswa" })).toBeVisible();
  await page.getByLabel("Materi yang diajarkan *").fill("Materi diisi saat offline");
  await page.getByRole("button", { name: "Simpan absen & jurnal" }).click();
  await expect(page.getByText(/Tidak ada internet. Data disimpan di HP/)).toBeVisible();
  await expect(page.getByRole("button", { name: /1 menunggu/ })).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByRole("button", { name: /menunggu/ })).toBeHidden({ timeout: 20_000 });
  await page.goto("/guru/riwayat");
  await expect(page.getByText("Materi diisi saat offline")).toBeVisible();
});
