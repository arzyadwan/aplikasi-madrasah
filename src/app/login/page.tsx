import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { halamanAwal, penggunaSaatIni } from "@/lib/auth";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Masuk" };

export default async function HalamanLogin() {
  const u = await penggunaSaatIni();
  if (u) redirect(halamanAwal(u));
  const pengaturan = await db.pengaturan.findUnique({ where: { id: 1 } });
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-utama-50 to-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-utama-600 text-2xl font-bold text-white">
            M
          </div>
          <h1 className="text-xl font-bold text-slate-900">{pengaturan?.namaMadrasah ?? "Aplikasi Madrasah"}</h1>
          <p className="text-sm text-slate-500">Kehadiran dan jurnal mengajar</p>
        </div>
        <div className="kartu p-6">
          <FormLogin />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Lupa kata sandi? Hubungi operator atau TU madrasah.
        </p>
      </div>
    </main>
  );
}
