"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buatSesi, hapusSesi } from "@/lib/sesi";
import { cekLogin } from "@/lib/batas-login";

export type StatusLogin = { pesan?: string };

export async function masuk(_: StatusLogin, form: FormData): Promise<StatusLogin> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
  const hasil = await cekLogin(String(form.get("username") ?? ""), String(form.get("password") ?? ""), ip);
  if (!hasil.ok) return { pesan: hasil.pesan };
  await buatSesi({ uid: hasil.pengguna.id, v: hasil.pengguna.versiSesi });
  const peran = hasil.pengguna.peran;
  redirect(peran === "KEPALA" ? "/kepala" : peran === "ADMIN" ? "/admin" : "/guru");
}

export async function keluar() {
  await hapusSesi();
  redirect("/login");
}
