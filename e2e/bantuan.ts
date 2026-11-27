import { expect, type Page } from "@playwright/test";

export const SANDI = "madrasah123";

export async function masuk(page: Page, username: string, sandi = SANDI) {
  await page.goto("/login");
  await page.getByLabel("Nama pengguna").fill(username);
  await page.getByLabel("Kata sandi").fill(sandi);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Foto JPEG kecil untuk simulasi selfie */
export async function fotoJpeg(page: Page): Promise<Buffer> {
  return page.screenshot({ type: "jpeg", quality: 50, clip: { x: 0, y: 0, width: 200, height: 200 } });
}

export function hariMinggu() {
  const hari = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Makassar", weekday: "short" }).format(new Date());
  return hari === "Sun";
}
