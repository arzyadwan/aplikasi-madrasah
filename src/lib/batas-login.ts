import "server-only";
import bcrypt from "bcryptjs";
import { db } from "./db";

// Pembatas percobaan login sederhana (per username + IP), disimpan di memori server.
const percobaan = new Map<string, { n: number; sampai: number }>();
const MAKS = 8;
const JEDA_MS = 10 * 60 * 1000;

export type HasilCekLogin =
  | { ok: true; pengguna: { id: string; versiSesi: number; peran: "ADMIN" | "KEPALA" | "GURU" } }
  | { ok: false; pesan: string };

/** Periksa username + kata sandi, dengan pembatas percobaan. Dipakai web dan aplikasi HP. */
export async function cekLogin(usernameMentah: string, password: string, ip: string): Promise<HasilCekLogin> {
  const username = usernameMentah.trim().toLowerCase();
  if (!username || !password) return { ok: false, pesan: "Isi nama pengguna dan kata sandi." };
  const kunci = `${username}|${ip}`;
  const catatan = percobaan.get(kunci);
  if (catatan && catatan.n >= MAKS && catatan.sampai > Date.now()) {
    return { ok: false, pesan: "Terlalu banyak percobaan. Coba lagi 10 menit lagi." };
  }
  const u = await db.pengguna.findUnique({ where: { username } });
  const cocok = u ? await bcrypt.compare(password, u.passwordHash) : false;
  if (!u || !cocok || !u.aktif) {
    const baru = catatan && catatan.sampai > Date.now() ? catatan.n + 1 : 1;
    percobaan.set(kunci, { n: baru, sampai: Date.now() + JEDA_MS });
    return { ok: false, pesan: u && cocok && !u.aktif ? "Akun ini dinonaktifkan." : "Nama pengguna atau kata sandi salah." };
  }
  percobaan.delete(kunci);
  return { ok: true, pengguna: { id: u.id, versiSesi: u.versiSesi, peran: u.peran } };
}
