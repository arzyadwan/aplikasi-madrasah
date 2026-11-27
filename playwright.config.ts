import { defineConfig } from "@playwright/test";

const PORT = 3200;
// Setiap kali tes dijalankan dibuat database baru, jadi data lain tidak tersentuh.
process.env.E2E_DB ??= `madrasah_e2e_${Date.now()}`;
const DB_SERVER = process.env.E2E_DB_SERVER ?? "postgresql://madrasah:madrasah@127.0.0.1:5432";
const DB_TEST = `${DB_SERVER}/${process.env.E2E_DB}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: "id-ID",
    timezoneId: "Asia/Makassar",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    // Uji versi produksi (jalankan `npm run build` lebih dulu). Database uji dikosongkan lalu diisi data contoh.
    command: "node e2e/siapkan-db.mjs && node .next/standalone/server.js",
    timeout: 180_000,
    url: `http://127.0.0.1:${PORT}/login`,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: DB_TEST,
      SESSION_SECRET: "rahasia-khusus-pengujian-0123456789abcdef",
      APP_TZ: "Asia/Makassar",
      UPLOAD_DIR: "./data/uploads-test",
      COOKIE_SECURE: "false",
      SEED_ADMIN_PASSWORD: "madrasah123",
    },
  },
});
