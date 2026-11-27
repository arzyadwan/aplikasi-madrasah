import { expect, test } from "@playwright/test";
import { fotoJpeg, hariMinggu, masuk } from "./bantuan";

test.skip(hariMinggu(), "Tidak ada jadwal pada hari Minggu");

test.describe("guru mengajar", () => {
  test.use({ permissions: ["geolocation"], geolocation: { latitude: -4.0716, longitude: 122.0449, accuracy: 15 } });

  test("absen hadir dengan GPS dan selfie", async ({ page }) => {
    await masuk(page, "guru01");
    await expect(page.getByText("Anda belum absen hari ini.")).toBeVisible();
    await page.getByRole("link", { name: "Absen sekarang" }).click();
    await page.getByRole("button", { name: "Ambil lokasi" }).click();
    await expect(page.getByText(/Lokasi didapat \(akurasi ±15 m\)/)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "selfie.jpg", mimeType: "image/jpeg", buffer: await fotoJpeg(page) });
    await expect(page.getByAltText("Pratinjau selfie")).toBeVisible();
    await page.getByRole("button", { name: "Kirim absen" }).click();
    await expect(page.getByText("Hadir", { exact: true })).toBeVisible();
    await expect(page.getByText(/Jarak dari madrasah ±\d+ m/)).toBeVisible();
    await expect(page.getByAltText("Foto absen")).toBeVisible();

    // absen kedua di hari yang sama ditolak
    const ulang = await page.request.post("/api/absen-guru", {
      data: { idKlien: "uji-absen-dobel-001", tanggal: await tanggalHariIni(page), status: "IZIN", keterangan: "uji" },
    });
    expect(ulang.status()).toBe(409);
  });

  test("absen hadir tanpa foto ditolak server", async ({ page }) => {
    await masuk(page, "guru05");
    const res = await page.request.post("/api/absen-guru", {
      data: { idKlien: "uji-tanpa-foto-001", tanggal: await tanggalHariIni(page), status: "HADIR", lat: -4.07, lng: 122.04 },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).pesan).toBe("Foto selfie wajib untuk absen hadir.");
  });

  test("isi absen siswa dan jurnal, lalu ubah di hari yang sama", async ({ page }) => {
    await masuk(page, "guru01");
    const item = page.locator('a[href^="/guru/isi?jadwal="]').first();
    await expect(item).toContainText("Isi absen");
    await item.click();
    await expect(page.getByRole("heading", { level: 2, name: "Kehadiran siswa" })).toBeVisible();

    const baris = page.locator("ol > li");
    await baris.nth(1).getByRole("radio", { name: "A" }).click();
    await baris.nth(1).getByPlaceholder("Keterangan (opsional)").fill("tanpa kabar");
    await baris.nth(2).getByRole("radio", { name: "S" }).click();
    await expect(page.getByText(/Hadir 22 · Sakit 1 · Izin 0 · Alpa 1/)).toBeVisible();
    await page.getByLabel("Materi yang diajarkan *").fill("Hukum bacaan mad thabi'i");
    await page.getByLabel(/KD \/ tujuan/).fill("3.1 Memahami hukum mad");
    await page.getByRole("button", { name: "Simpan absen & jurnal" }).click();
    await expect(page).toHaveURL(/\/guru$/);
    await expect(page.locator('a[href^="/guru/isi?jadwal="]').first()).toContainText("Sudah diisi");

    // ubah di hari yang sama
    await page.locator('a[href^="/guru/isi?jadwal="]').first().click();
    await expect(page.getByText(/Anda masih bisa mengubahnya hari ini/)).toBeVisible();
    await expect(page.locator("ol > li").nth(1).getByRole("radio", { name: "A" })).toHaveAttribute("aria-checked", "true");
    await page.getByLabel("Materi yang diajarkan *").fill("Hukum bacaan mad thabi'i dan mad wajib");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page).toHaveURL(/\/guru$/);
  });

  test("isian untuk tanggal yang sudah lewat ditolak", async ({ page }) => {
    await masuk(page, "guru01");
    const href = await page.locator('a[href^="/guru/isi?jadwal="]').first().getAttribute("href");
    const jadwalId = new URL(href!, "http://x").searchParams.get("jadwal");
    const res = await page.request.post("/api/pertemuan", {
      data: { idKlien: "uji-lewat-hari-001", jadwalId, tanggal: "2026-01-02", materi: "x", absensi: [] },
    });
    expect([400, 422]).toContain(res.status());
  });

  test("guru pengganti mengisi jadwal guru lain", async ({ page }) => {
    await masuk(page, "guru02");
    await page.goto("/guru/pengganti");
    const baris = page.locator("tbody tr").filter({ has: page.getByRole("link", { name: "Gantikan" }) }).first();
    const namaGuru = (await baris.locator("td").nth(3).textContent())!.trim();
    await baris.getByRole("link", { name: "Gantikan" }).click();
    await expect(page.getByText(`Jadwal ${namaGuru}. Anda mengisi sebagai guru pengganti.`)).toBeVisible();
    await page.getByLabel("Materi yang diajarkan *").fill("Tugas mandiri dari guru mapel");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Simpan absen & jurnal" }).click();
    await expect(page).toHaveURL(/\/guru$/);
    await page.goto("/guru/riwayat");
    await expect(page.getByText(/\(pengganti\)/).first()).toBeVisible();
  });
});

async function tanggalHariIni(page: import("@playwright/test").Page) {
  return page.evaluate(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date()));
}
