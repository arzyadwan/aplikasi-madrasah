/**
 * Data awal.
 *   npm run db:seed        → pengaturan, jam pelajaran, mapel, kelas, akun admin
 *   npm run db:seed:demo   → ditambah data CONTOH (guru, siswa, jadwal) untuk uji coba
 *
 * Nama guru dan siswa pada data contoh adalah fiktif.
 */
import { PrismaClient, type JenisKelamin } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();
const DEMO = process.argv.includes("--demo");

const MAPEL = [
  "Al-Qur'an Hadis", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam", "Bahasa Arab",
  "Pendidikan Pancasila", "Bahasa Indonesia", "Matematika", "Ilmu Pengetahuan Alam",
  "Ilmu Pengetahuan Sosial", "Bahasa Inggris", "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  "Informatika", "Seni Budaya", "Prakarya", "Muatan Lokal", "Baca Tulis Al-Qur'an",
  "Tahfidz Al-Qur'an", "Bimbingan Konseling",
];

const KELAS = [
  { nama: "VII A", tingkat: 7 }, { nama: "VII B", tingkat: 7 },
  { nama: "VIII A", tingkat: 8 }, { nama: "VIII B", tingkat: 8 },
  { nama: "IX A", tingkat: 9 }, { nama: "IX B", tingkat: 9 },
];

const JAM = [
  ["07:30", "08:10"], ["08:10", "08:50"], ["08:50", "09:30"], ["09:45", "10:25"],
  ["10:25", "11:05"], ["11:05", "11:45"], ["12:30", "13:10"], ["13:10", "13:50"],
];

async function dasar() {
  await db.pengaturan.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, namaMadrasah: "MTs Al-Ikhlas Amberi", alamat: "Kecamatan Lambuya, Kabupaten Konawe" },
  });
  for (const [i, [mulai, selesai]] of JAM.entries()) {
    await db.jamPelajaran.upsert({ where: { jamKe: i + 1 }, update: {}, create: { jamKe: i + 1, mulai, selesai } });
  }
  for (const [i, nama] of MAPEL.entries()) {
    await db.mapel.upsert({ where: { nama }, update: {}, create: { nama, urutan: i + 1 } });
  }
  for (const k of KELAS) {
    await db.kelas.upsert({ where: { nama: k.nama }, update: {}, create: k });
  }
  const adaAdmin = await db.pengguna.findFirst({ where: { peran: "ADMIN" } });
  if (!adaAdmin) {
    const sandi = process.env.SEED_ADMIN_PASSWORD || (DEMO ? "madrasah123" : randomBytes(6).toString("base64url"));
    await db.pengguna.create({
      data: { nama: "Operator Madrasah", username: "admin", peran: "ADMIN", passwordHash: await bcrypt.hash(sandi, 10) },
    });
    console.log(`Akun admin dibuat → username: admin, kata sandi: ${sandi}`);
    console.log("Segera ganti kata sandi setelah login pertama (menu Akun).");
  }
}

// ---------- data contoh ----------
const NAMA_DEPAN_L = ["Ahmad", "Muhammad", "Rizky", "Fajar", "Ilham", "Arif", "Dimas", "Hendra", "Yusuf", "Rahmat", "Fikri", "Zaki", "Akbar", "Rafli", "Irfan"];
const NAMA_DEPAN_P = ["Siti", "Nur", "Aisyah", "Fatimah", "Putri", "Dewi", "Rahma", "Indah", "Nabila", "Zahra", "Ayu", "Salsabila", "Khadijah", "Annisa", "Wulan"];
const NAMA_BELAKANG = ["Saputra", "Hidayat", "Ramadhan", "Pratama", "Lestari", "Wahyuni", "Kurniawan", "Syahputra", "Rahmawati", "Maulana", "Hasanah", "Nurhaliza", "Setiawan", "Fitriani", "Amalia"];

function acak(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

async function demo() {
  const hash = await bcrypt.hash("madrasah123", 10);
  await db.pengguna.upsert({
    where: { username: "kepala" },
    update: {},
    create: { nama: "Kepala Madrasah (contoh)", username: "kepala", peran: "KEPALA", passwordHash: hash },
  });

  const mapel = await db.mapel.findMany({ orderBy: { urutan: "asc" } });
  const guru = [];
  for (let i = 0; i < mapel.length; i++) {
    const lk = i % 2 === 0;
    // kombinasi unik agar nama guru contoh tidak kembar
    const depan = (lk ? NAMA_DEPAN_L : NAMA_DEPAN_P)[Math.floor(i / 2) % 15];
    const belakang = NAMA_BELAKANG[(i * 4 + 3) % 15];
    const username = `guru${String(i + 1).padStart(2, "0")}`;
    guru.push(
      await db.pengguna.upsert({
        where: { username },
        update: {},
        create: { nama: `${depan} ${belakang}`, username, peran: "GURU", passwordHash: hash },
      }),
    );
  }

  const kelas = await db.kelas.findMany({ orderBy: { nama: "asc" } });
  for (const [k, kl] of kelas.entries()) {
    await db.kelas.update({ where: { id: kl.id }, data: { waliKelasId: guru[k].id } });
    const jumlahSiswa = await db.siswa.count({ where: { kelasId: kl.id } });
    if (jumlahSiswa === 0) {
      const r = acak(100 + k);
      const data = Array.from({ length: 24 }, (_, i) => {
        const jk: JenisKelamin = r() < 0.5 ? "L" : "P";
        const depan = (jk === "L" ? NAMA_DEPAN_L : NAMA_DEPAN_P)[Math.floor(r() * 15)];
        const belakang = NAMA_BELAKANG[Math.floor(r() * 15)];
        return { nama: `${depan} ${belakang}`, jk, kelasId: kl.id, nis: `${kl.tingkat}${k}${String(i + 1).padStart(3, "0")}` };
      });
      await db.siswa.createMany({ data });
    }
  }

  if ((await db.jadwal.count()) === 0) {
    // 4 blok x 2 jam per hari, Senin–Sabtu. Pergeseran per kelas mencegah guru bentrok.
    const data = [];
    for (const [k, kl] of kelas.entries()) {
      for (let hari = 1; hari <= 6; hari++) {
        for (let blok = 0; blok < 4; blok++) {
          const b = (hari - 1) * 4 + blok;
          const m = (b + k * 4) % mapel.length;
          data.push({
            hari, jamMulai: blok * 2 + 1, jamSelesai: blok * 2 + 2,
            kelasId: kl.id, mapelId: mapel[m].id, guruId: guru[m].id,
          });
        }
      }
    }
    await db.jadwal.createMany({ data });
  }
  console.log("Data contoh dibuat. Semua akun contoh memakai kata sandi: madrasah123");
  console.log("  kepala (Kepala Madrasah), guru01–guru19 (Guru; guru01–guru06 juga wali kelas), admin (Operator)");
}

async function utama() {
  await dasar();
  if (DEMO) await demo();
}

utama()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
