// Membuat database uji BARU (tidak menghapus apa pun), menjalankan migrasi, lalu mengisi data contoh.
import { execSync } from "node:child_process";

const target = process.env.DATABASE_URL;
if (!target) throw new Error("DATABASE_URL belum diisi");
const url = new URL(target);
const nama = url.pathname.slice(1);
if (!/^madrasah_e2e_\d+$/.test(nama)) throw new Error(`Nama database uji tidak aman: ${nama}`);
const maint = new URL(target);
maint.pathname = "/postgres";

const jalankan = (cmd, input) => execSync(cmd, { stdio: input ? ["pipe", "inherit", "inherit"] : "inherit", input, env: process.env });
jalankan(`npx prisma db execute --url "${maint}" --stdin`, `CREATE DATABASE "${nama}";`);
jalankan("npx prisma migrate deploy");
jalankan("npx tsx prisma/seed.ts --demo");
