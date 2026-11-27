import { expect, test } from "@playwright/test";
import { masuk } from "./bantuan";

test("halaman awal mengarah ke login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "MTs Al-Ikhlas Amberi" })).toBeVisible();
});

test("kata sandi salah ditolak", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Nama pengguna").fill("guru01");
  await page.getByLabel("Kata sandi").fill("salah-sekali");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.locator("p[role=alert]")).toHaveText("Nama pengguna atau kata sandi salah.");
});

test("setiap peran diarahkan ke halaman masing-masing", async ({ page }) => {
  await masuk(page, "guru02");
  await expect(page).toHaveURL(/\/guru$/);
  await page.getByRole("button", { name: "Keluar" }).click();
  await masuk(page, "kepala");
  await expect(page).toHaveURL(/\/kepala$/);
  await page.getByRole("button", { name: "Keluar" }).click();
  await masuk(page, "admin");
  await expect(page).toHaveURL(/\/admin$/);
});

test("guru tidak bisa membuka halaman admin, pantauan, atau laporan", async ({ page }) => {
  await masuk(page, "guru02");
  await page.goto("/admin/pengguna");
  await expect(page).toHaveURL(/\/guru$/);
  await page.goto("/kepala");
  await expect(page).toHaveURL(/\/guru$/);
  const res = await page.request.get("/api/laporan?jenis=guru&dari=2026-11-01&sampai=2026-11-30");
  expect(res.status()).toBe(403);
});

test("API menolak permintaan tanpa login dan dari situs lain", async ({ request, page }) => {
  const tanpaLogin = await request.post("/api/pertemuan", { data: {} });
  expect(tanpaLogin.status()).toBe(401);
  await masuk(page, "guru02");
  const situsLain = await page.request.post("/api/absen-guru", { data: {}, headers: { Origin: "https://jahat.example" } });
  expect(situsLain.status()).toBe(403);
});
