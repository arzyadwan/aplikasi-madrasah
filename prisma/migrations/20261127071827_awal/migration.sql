-- CreateEnum
CREATE TYPE "Peran" AS ENUM ('ADMIN', 'KEPALA', 'GURU');

-- CreateEnum
CREATE TYPE "StatusSiswa" AS ENUM ('H', 'S', 'I', 'A');

-- CreateEnum
CREATE TYPE "StatusGuru" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'DINAS');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateTable
CREATE TABLE "Pengguna" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "peran" "Peran" NOT NULL DEFAULT 'GURU',
    "nip" TEXT,
    "noHp" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "versiSesi" INTEGER NOT NULL DEFAULT 0,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahPada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tingkat" INTEGER NOT NULL,
    "waliKelasId" TEXT,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id" TEXT NOT NULL,
    "nis" TEXT,
    "nisn" TEXT,
    "nama" TEXT NOT NULL,
    "jk" "JenisKelamin" NOT NULL,
    "kelasId" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mapel" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Mapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JamPelajaran" (
    "jamKe" INTEGER NOT NULL,
    "mulai" TEXT NOT NULL,
    "selesai" TEXT NOT NULL,

    CONSTRAINT "JamPelajaran_pkey" PRIMARY KEY ("jamKe")
);

-- CreateTable
CREATE TABLE "Jadwal" (
    "id" TEXT NOT NULL,
    "hari" INTEGER NOT NULL,
    "jamMulai" INTEGER NOT NULL,
    "jamSelesai" INTEGER NOT NULL,
    "kelasId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,

    CONSTRAINT "Jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pertemuan" (
    "id" TEXT NOT NULL,
    "idKlien" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jamMulai" INTEGER NOT NULL,
    "jamSelesai" INTEGER NOT NULL,
    "jadwalId" TEXT,
    "kelasId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "pengganti" BOOLEAN NOT NULL DEFAULT false,
    "materi" TEXT NOT NULL,
    "kd" TEXT,
    "catatan" TEXT,
    "diisiDiPerangkat" TIMESTAMP(3),
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahPada" TIMESTAMP(3) NOT NULL,
    "diperiksaOlehId" TEXT,
    "diperiksaPada" TIMESTAMP(3),
    "catatanKepala" TEXT,

    CONSTRAINT "Pertemuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsensiSiswa" (
    "pertemuanId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "status" "StatusSiswa" NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "AbsensiSiswa_pkey" PRIMARY KEY ("pertemuanId","siswaId")
);

-- CreateTable
CREATE TABLE "AbsensiGuru" (
    "id" TEXT NOT NULL,
    "idKlien" TEXT NOT NULL,
    "penggunaId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" "StatusGuru" NOT NULL,
    "waktuMasuk" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "akurasi" DOUBLE PRECISION,
    "jarakMeter" INTEGER,
    "dalamRadius" BOOLEAN,
    "fotoPath" TEXT,
    "keterangan" TEXT,
    "diisiDiPerangkat" TIMESTAMP(3),
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsensiGuru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengaturan" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "namaMadrasah" TEXT NOT NULL,
    "alamat" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radiusMeter" INTEGER NOT NULL DEFAULT 150,
    "tolakLuarRadius" BOOLEAN NOT NULL DEFAULT false,
    "batasSinkronJam" INTEGER NOT NULL DEFAULT 72,

    CONSTRAINT "Pengaturan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pengguna_username_key" ON "Pengguna"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_nama_key" ON "Kelas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Siswa_nis_key" ON "Siswa"("nis");

-- CreateIndex
CREATE INDEX "Siswa_kelasId_idx" ON "Siswa"("kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "Mapel_nama_key" ON "Mapel"("nama");

-- CreateIndex
CREATE INDEX "Jadwal_hari_kelasId_idx" ON "Jadwal"("hari", "kelasId");

-- CreateIndex
CREATE INDEX "Jadwal_guruId_idx" ON "Jadwal"("guruId");

-- CreateIndex
CREATE UNIQUE INDEX "Pertemuan_idKlien_key" ON "Pertemuan"("idKlien");

-- CreateIndex
CREATE INDEX "Pertemuan_tanggal_idx" ON "Pertemuan"("tanggal");

-- CreateIndex
CREATE INDEX "Pertemuan_kelasId_tanggal_idx" ON "Pertemuan"("kelasId", "tanggal");

-- CreateIndex
CREATE INDEX "Pertemuan_guruId_tanggal_idx" ON "Pertemuan"("guruId", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "Pertemuan_jadwalId_tanggal_key" ON "Pertemuan"("jadwalId", "tanggal");

-- CreateIndex
CREATE INDEX "AbsensiSiswa_siswaId_idx" ON "AbsensiSiswa"("siswaId");

-- CreateIndex
CREATE UNIQUE INDEX "AbsensiGuru_idKlien_key" ON "AbsensiGuru"("idKlien");

-- CreateIndex
CREATE INDEX "AbsensiGuru_tanggal_idx" ON "AbsensiGuru"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "AbsensiGuru_penggunaId_tanggal_key" ON "AbsensiGuru"("penggunaId", "tanggal");

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_waliKelasId_fkey" FOREIGN KEY ("waliKelasId") REFERENCES "Pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siswa" ADD CONSTRAINT "Siswa_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pertemuan" ADD CONSTRAINT "Pertemuan_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "Jadwal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pertemuan" ADD CONSTRAINT "Pertemuan_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pertemuan" ADD CONSTRAINT "Pertemuan_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pertemuan" ADD CONSTRAINT "Pertemuan_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pertemuan" ADD CONSTRAINT "Pertemuan_diperiksaOlehId_fkey" FOREIGN KEY ("diperiksaOlehId") REFERENCES "Pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsensiSiswa" ADD CONSTRAINT "AbsensiSiswa_pertemuanId_fkey" FOREIGN KEY ("pertemuanId") REFERENCES "Pertemuan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsensiSiswa" ADD CONSTRAINT "AbsensiSiswa_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsensiGuru" ADD CONSTRAINT "AbsensiGuru_penggunaId_fkey" FOREIGN KEY ("penggunaId") REFERENCES "Pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;
