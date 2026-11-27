const { chromium, devices } = require(require.resolve("playwright", { paths: [__dirname + "/../.."] }));
const OUT = process.argv[2] ?? "./", BASE = process.env.ALAMAT_WEB ?? "http://127.0.0.1:8090";
const cek = (kondisi, pesan) => { if (!kondisi) throw new Error("GAGAL: " + pesan); console.log("✓ " + pesan); };
async function login(p, u) {
  await p.goto(BASE + "/");
  await p.getByTestId("username").waitFor();
  if (await p.getByTestId("alamat").count()) await p.getByTestId("alamat").fill(BASE);
  await p.getByTestId("username").fill(u);
  await p.getByTestId("sandi").fill("madrasah123");
  await p.getByTestId("tombol-masuk").click();
}
(async () => {
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const hp = { ...devices["Pixel 7"], deviceScaleFactor: 1 };
  const ctx = await b.newContext({ ...hp, timezoneId: "Asia/Makassar", permissions: ["geolocation"], geolocation: { latitude: -4.0716, longitude: 122.0449, accuracy: 12 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  await p.goto(BASE + "/"); await p.screenshot({ path: OUT + "1-login.png" });

  // login salah
  await p.getByTestId("alamat").fill(BASE); await p.getByTestId("username").fill("guru05"); await p.getByTestId("sandi").fill("salah");
  await p.getByTestId("tombol-masuk").click();
  await p.getByText("Nama pengguna atau kata sandi salah.").waitFor(); cek(true, "login salah ditolak");

  await login(p, "guru05");
  await p.getByText("Jadwal mengajar").waitFor(); cek(true, "login guru05 → Hari Ini");
  await p.screenshot({ path: OUT + "2-hari-ini.png" });
  const jadwal = p.locator('[data-testid^="jadwal-"]');
  const n = await jadwal.count(); cek(n >= 1, `ada ${n} jadwal`);

  // isi jadwal pertama
  await jadwal.first().click();
  await p.getByText("Kehadiran siswa").waitFor();
  await p.getByRole("button", { name: /Ubah kehadiran siswa/ }).click();
  const radio = p.getByRole("radio");
  await radio.nth(1 * 4 + 3).click(); // siswa ke-2 → A
  await p.screenshot({ path: OUT + "3-isi.png" });
  await p.getByLabel("Materi yang diajarkan *").fill("Persamaan linear satu variabel (dari aplikasi HP)");
  await p.getByRole("button", { name: /^Simpan/ }).first().click();
  await p.getByText("Terkirim.", { exact: true }).waitFor(); cek(true, "absen + jurnal terkirim");
  await p.getByText("Sudah diisi").first().waitFor(); cek(true, "status jadwal menjadi Sudah diisi");

  // absen GPS + selfie
  await p.getByRole("tab", { name: /Absen Saya/ }).click();
  const ambil = p.getByRole("button", { name: "Ambil lokasi", exact: true });
  if (await ambil.isVisible()) await ambil.click();
  await p.getByText(/Lokasi didapat \(akurasi ±12 m\)/).waitFor(); cek(true, "lokasi GPS didapat");
  const foto = await p.screenshot({ type: "jpeg", quality: 50, clip: { x: 0, y: 0, width: 300, height: 300 } });
  const [pilih] = await Promise.all([p.waitForEvent("filechooser"), p.getByRole("button", { name: "Buka kamera" }).click()]);
  await pilih.setFiles({ name: "selfie.jpg", mimeType: "image/jpeg", buffer: foto });
  await p.getByLabel("Pratinjau selfie").waitFor(); cek(true, "foto selfie dipilih dan diperkecil");
  await p.screenshot({ path: OUT + "4-absen.png" });
  await p.getByRole("button", { name: "Kirim absen" }).click();
  await p.getByText(/Tercatat pukul/).waitFor({ timeout: 15000 }); cek(true, "absen hadir tercatat");
  await p.getByLabel("Foto absen").waitFor(); cek(true, "foto absen tampil (diunduh dengan token)");
  await p.screenshot({ path: OUT + "5-absen-selesai.png" });

  await p.getByRole("tab", { name: /Riwayat/ }).click();
  await p.getByText("Persamaan linear satu variabel (dari aplikasi HP)").waitFor(); cek(true, "riwayat menampilkan jurnal");
  await p.screenshot({ path: OUT + "7-riwayat.png" });

  await p.getByRole("tab", { name: /Akun/ }).click();
  p.once("dialog", (d) => d.accept());
  await p.getByRole("button", { name: "Keluar" }).click();
  await login(p, "guru01");
  await p.getByText("Jadwal mengajar").waitFor(); cek(true, "login guru01");
  const jadwal2 = p.locator('[data-testid^="jadwal-"]');
  const n2 = await jadwal2.count(); cek(n2 >= 2, `guru01 punya ${n2} jadwal`);
  // offline: isi jadwal lain saat offline lalu online
  await p.getByRole("tab", { name: /Hari Ini/ }).click();
  await p.getByText("Jadwal mengajar").waitFor();
  if (n2 >= 2) {
    // versi web memuat kode layar lewat jaringan: buka sekali saat online (di APK semua kode sudah terpasang)
    await jadwal2.nth(1).click();
    await p.getByText("Kehadiran siswa").waitFor();
    await p.goBack();
    await p.getByText("Jadwal mengajar").waitFor();
    await ctx.setOffline(true);
    await jadwal2.nth(1).click();
    await p.getByText("Kehadiran siswa").waitFor();
    await p.getByLabel("Materi yang diajarkan *").fill("Diisi saat offline di aplikasi HP");
    await p.getByRole("button", { name: /^Simpan/ }).first().click();
    await p.getByText(/Tersimpan di HP, menunggu dikirim/).waitFor(); cek(true, "isian offline masuk antrean");
    await p.getByRole("button", { name: /1 menunggu/ }).last().waitFor(); cek(true, "penanda '1 menunggu' tampil");
    await p.screenshot({ path: OUT + "6-offline.png" });
    await ctx.setOffline(false);
    await p.getByRole("button", { name: /menunggu/ }).first().waitFor({ state: "detached", timeout: 30000 }); cek(true, "antrean terkirim otomatis saat online");
    await p.getByRole("button", { name: "Kembali ke jadwal" }).click();
    await p.getByText("Jadwal mengajar").waitFor();
    await p.getByText("Sudah diisi").nth(1).waitFor(); cek(true, "kedua jadwal guru01 berstatus Sudah diisi");
  } else console.log("- lewati uji offline (hanya 1 jadwal)");

  await p.getByRole("tab", { name: /Akun/ }).click();
  p.once("dialog", (d) => d.accept());
  await p.getByRole("button", { name: "Keluar" }).click();
  // kepala
  await login(p, "kepala");
  await p.getByText("Pantauan harian").waitFor(); cek(true, "kepala → Pantauan");
  await p.screenshot({ path: OUT + "8-pantauan.png", fullPage: true });
  await p.getByRole("button", { name: "Periksa jurnal" }).click();
  const kartu = p.getByText("Persamaan linear satu variabel (dari aplikasi HP)");
  await kartu.waitFor();
  await p.getByLabel("Catatan untuk guru (opsional)").first().fill("Bagus");
  await p.screenshot({ path: OUT + "9-jurnal.png" });
  await b.close();
  console.log("SELESAI");
})().catch((e) => { console.error(e.message); process.exit(1); });
