"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { buatSesi, hapusSesi } from "@/lib/sesi";
import { halamanAwal } from "@/lib/auth";

// Pembatas percobaan login sederhana (per username + IP), disimpan di memori server.
const percobaan = new Map<string, { n: number; sampai: number }>();
const MAKS = 8;
const JEDA_MS = 10 * 60 * 1000;

export type StatusLogin = { pesan?: string };

export async function masuk(_: StatusLogin, form: FormData): Promise<StatusLogin> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { pesan: "Isi nama pengguna dan kata sandi." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
  const kunci = `${username}|${ip}`;
  const catatan = percobaan.get(kunci);
  if (catatan && catatan.n >= MAKS && catatan.sampai > Date.now()) {
    return { pesan: "Terlalu banyak percobaan. Coba lagi 10 menit lagi." };
  }

  const u = await db.pengguna.findUnique({ where: { username } });
  const cocok = u ? await bcrypt.compare(password, u.passwordHash) : false;
  if (!u || !cocok || !u.aktif) {
    const baru = catatan && catatan.sampai > Date.now() ? catatan.n + 1 : 1;
    percobaan.set(kunci, { n: baru, sampai: Date.now() + JEDA_MS });
    return { pesan: u && cocok && !u.aktif ? "Akun ini dinonaktifkan." : "Nama pengguna atau kata sandi salah." };
  }
  percobaan.delete(kunci);
  await buatSesi({ uid: u.id, v: u.versiSesi });
  redirect(halamanAwal({ ...u, kelasWali: [], mengajar: false }));
}

export async function keluar() {
  await hapusSesi();
  redirect("/login");
}
