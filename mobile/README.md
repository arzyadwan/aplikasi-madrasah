# Aplikasi Madrasah untuk Android

Aplikasi HP (React Native / Expo SDK 58) untuk guru dan kepala madrasah. Aplikasi ini memakai
server dan database yang sama dengan versi web di folder induk repositori.

## Fitur

**Guru**
- Jadwal mengajar hari ini, lalu mengisi absen siswa per jam (H/S/I/A) dan jurnal mengajar.
- Menjadi guru pengganti untuk jadwal guru lain.
- Absen harian dengan **GPS dan foto selfie** (kamera depan), atau izin/sakit/dinas dengan keterangan.
- **Offline**: isian disimpan di HP dan terkirim otomatis begitu internet kembali
  (saat sinyal tersambung, saat aplikasi dibuka, dan setiap menit). Penanda "menunggu" tampil di bagian atas.
- Riwayat jurnal 30 hari beserta catatan dari kepala madrasah.

**Wali kelas**: jadwal dan kehadiran kelas per jam pelajaran, bisa mengisi jadwal yang belum diisi.

**Kepala madrasah**: pantauan harian, memeriksa jurnal (tanda "sudah diperiksa" dan catatan),
serta kehadiran guru dengan jarak dan foto.

Pengelolaan data (guru, siswa, jadwal, pengaturan) dan unduhan laporan Excel tetap dilakukan di versi web.

## Memasang APK di HP guru

1. Kirim file `madrasah-<versi>.apk` lewat WhatsApp atau tautan Google Drive.
2. Di HP, buka file tersebut. Bila muncul peringatan, izinkan **"Instal dari sumber tidak dikenal"**
   untuk WhatsApp/Files (cukup sekali).
3. Buka aplikasi **Madrasah**, isi **alamat server** (misalnya `absen.madrasah.sch.id`),
   lalu masuk dengan nama pengguna dan kata sandi yang dibuat operator.
4. Saat pertama absen, izinkan akses **lokasi** dan **kamera**.

Butuh Android 7.0 (API 24) atau lebih baru.

## Server yang dibutuhkan

Aplikasi ini perlu server yang bisa diakses dari internet (lihat README di folder induk, bagian Deploy).
Gunakan alamat **https**. Alamat http masih bisa dipakai untuk uji coba di jaringan lokal, tetapi datanya
tidak terenkripsi.

## Build APK

Butuh Node.js 22, **JDK 17** (dipakai plugin Gradle React Native; bisa berdampingan dengan JDK lain, daftarkan lewat `org.gradle.java.installations.paths` di `~/.gradle/gradle.properties`), dan Android SDK (`ANDROID_HOME`). Unduhan NDK dan paket SDK lain dilakukan otomatis oleh Gradle.

1. Siapkan kunci tanda tangan. **Pakai kunci yang sama untuk setiap versi**, agar APK baru bisa dipasang
   menimpa yang lama. Isi `~/.gradle/gradle.properties`:
   ```properties
   MADRASAH_STORE_FILE=/path/lengkap/ke/madrasah-rilis.keystore
   MADRASAH_STORE_PASSWORD=...
   MADRASAH_KEY_ALIAS=madrasah
   MADRASAH_KEY_PASSWORD=...
   ```
   Tanpa properti ini APK ditandatangani dengan kunci debug (hanya untuk uji coba).
2. Naikkan `version` dan `android.versionCode` di `app.json` setiap rilis baru.
3. Jalankan:
   ```bash
   npm install
   npm run build:apk
   ```
   Hasilnya ada di `android/app/build/outputs/apk/release/app-release.apk`.

Alamat server bawaan bisa diisi di `app.json` → `expo.extra.alamatServerBawaan`, agar guru tidak perlu mengetiknya.

Folder `android/` dibuat ulang otomatis oleh `expo prebuild`, jadi jangan diubah manual.
Pengaturan native diatur lewat `app.json` dan `plugins/`.

## Pengembangan dan pengujian

```bash
npm run typecheck && npm run lint
npx expo export -p web --output-dir /tmp/web-hp        # versi web untuk uji tampilan
node uji/proxy.cjs /tmp/web-hp 3100 8090               # sajikan web + teruskan /api ke server di port 3100
node uji/uji-alur.cjs /tmp/tangkapan/                  # uji alur: login, absen + jurnal, GPS + selfie, offline, kepala
```

Uji alur memerlukan server dengan data contoh (`npm run db:seed:demo` di folder induk) pada hari sekolah.
