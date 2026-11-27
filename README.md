# Aplikasi Madrasah

Aplikasi web untuk **kehadiran dan jurnal mengajar** madrasah, disusun dari hasil kuesioner kebutuhan
MTs Al-Ikhlas Amberi (Lambuya, Konawe). Bisa dibuka dari HP Android maupun iPhone lewat browser,
dipasang di layar utama HP, dan tetap bisa dipakai mengisi absen saat internet putus.

## Fitur tahap 1

**Guru**
- Jadwal mengajar hari ini, sesuai jadwal pelajaran tetap (Senin–Sabtu).
- Absen siswa **per jam pelajaran** (Hadir, Sakit, Izin, Alpa) sekaligus **jurnal mengajar**:
  materi, KD/tujuan pembelajaran, dan catatan kejadian.
- **Guru pengganti** bisa mengisi jadwal guru yang berhalangan.
- **Absen guru** harian: Hadir dengan **lokasi GPS + foto selfie**, atau Izin/Sakit/Dinas dengan keterangan.
- **Offline**: bila tidak ada internet, isian disimpan di HP dan dikirim otomatis saat internet kembali.
- Aturan "hari yang sama": isian hanya untuk hari itu dan tidak bisa diubah setelah lewat harinya
  (atau setelah diperiksa kepala madrasah). Isian offline tetap sah bila diisi di hari itu dan
  terkirim paling lambat 72 jam kemudian (bisa diatur).

**Wali kelas**
- Melihat jadwal dan kehadiran kelasnya per jam pelajaran untuk semua mapel.
- Mengisi absen bila jadwal kelasnya belum diisi.
- Mengunduh rekap bulanan kelasnya (Excel).

**Kepala madrasah** (TU juga bisa melihat)
- Pantauan harian: guru yang belum absen, jurnal yang belum diisi atau terlambat,
  dan kehadiran siswa per kelas.
- Memeriksa jurnal: tanda **"sudah diperiksa"** dan catatan untuk guru.
- Kehadiran guru beserta jam, jarak dari madrasah, tanda "di luar area", dan foto selfie.
- Laporan **Excel** mingguan/bulanan: rekap kehadiran siswa, rekap kehadiran guru, dan daftar jurnal.
  Laporan ini juga yang dikirim ke yayasan.

**Operator / TU**
- Data guru (akun login, reset kata sandi), siswa (termasuk **impor dari Excel** dan pindah kelas massal),
  kelas dan wali kelas, mata pelajaran, jadwal pelajaran (dengan cek bentrok), jam pelajaran,
  serta titik lokasi madrasah untuk absen GPS.

Belum termasuk (tahap berikutnya): portal orang tua, nilai dan rapor, hafalan/tahfidz,
catatan perilaku, pengumuman, dan SPP/infaq.

## Peran dan akses

| Peran | Bisa |
|---|---|
| Guru | Absen sendiri, absen siswa + jurnal untuk jadwalnya, jadi pengganti, melihat riwayat. Wali kelas juga melihat kelasnya. |
| Kepala madrasah | Semua fitur guru (bila mengajar), pantauan, memeriksa jurnal, laporan. |
| Operator / TU | Mengelola data master dan pengaturan, melihat pantauan dan laporan. |

## Teknologi

Next.js 16 (App Router), TypeScript, Tailwind CSS 4, PostgreSQL + Prisma 6, ExcelJS.
Zona waktu default **WITA (Asia/Makassar)**.

## Menjalankan di komputer sendiri (pengembangan)

Butuh Node.js 22 dan PostgreSQL 16.

```bash
cp .env.example .env          # lalu isi DATABASE_URL dan SESSION_SECRET
npm install
npx prisma migrate deploy     # membuat tabel
npm run db:seed:demo          # data contoh: kepala, guru01–guru19, admin (sandi: madrasah123)
npm run dev                   # buka http://localhost:3000
```

Untuk data asli, jalankan `npm run db:seed` (tanpa data contoh). Perintah itu hanya membuat pengaturan,
jam pelajaran, 19 mapel, 6 kelas, dan akun `admin` dengan kata sandi acak yang ditampilkan di layar.

## Deploy ke VPS (Docker)

1. Siapkan VPS (misalnya 1 vCPU / 1–2 GB RAM, Ubuntu) dengan Docker terpasang.
2. Salin repositori ini, lalu buat file `.env`:
   ```env
   POSTGRES_PASSWORD=isi-password-database
   SESSION_SECRET=isi-hasil-openssl-rand-hex-32
   SEED_ADMIN_PASSWORD=isi-sandi-awal-admin
   DOMAIN=absen.namamadrasah.sch.id
   ```
3. Arahkan domain ke IP VPS, lalu jalankan:
   ```bash
   docker compose --profile https up -d --build
   ```
   Caddy otomatis memasang sertifikat HTTPS. **HTTPS wajib**, karena browser di HP hanya mengizinkan
   GPS di situs HTTPS.
4. Login sebagai `admin`, ganti kata sandi di menu **Akun**, lalu ikuti daftar persiapan di beranda operator.

Data tersimpan di volume Docker `db-data` (database) dan `uploads` (foto selfie). Cadangkan secara berkala, misalnya:
`docker compose exec db pg_dump -U madrasah madrasah > cadangan-$(date +%F).sql`.

## Pengujian

```bash
npm test               # tes unit (aturan tanggal/offline, zona waktu, jarak GPS)
npm run build
npm run test:e2e       # tes end-to-end Playwright (membuat database uji baru setiap kali dijalankan)
```

Tes end-to-end mencakup login dan hak akses, kelola data oleh operator, absen GPS + selfie,
absen siswa + jurnal, guru pengganti, pengisian saat offline lalu sinkron otomatis,
pemeriksaan jurnal oleh kepala madrasah, dan unduhan laporan Excel.

## Struktur singkat

```
prisma/              skema database, migrasi, data awal
src/app/login        halaman masuk
src/app/(aplikasi)/  halaman setelah login: guru, wali, kepala, laporan, admin, akun
src/app/api/         API absen guru, pertemuan (absen siswa + jurnal), foto, laporan Excel
src/lib/             akses data, aturan pengisian, waktu WITA, antrean offline
public/sw.js         service worker untuk mode offline
e2e/, tests/         pengujian
```
