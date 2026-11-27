import type { Metadata } from "next";
import { wajibLogin } from "@/lib/auth";
import { FormSandi } from "./form-sandi";

export const metadata: Metadata = { title: "Akun" };

export default async function HalamanAkun() {
  const u = await wajibLogin();
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="judul-halaman">Akun saya</h1>
      <div className="kartu text-sm">
        <p><span className="text-slate-500">Nama:</span> {u.nama}</p>
        <p><span className="text-slate-500">Nama pengguna:</span> {u.username}</p>
        {u.kelasWali.length > 0 && (
          <p><span className="text-slate-500">Wali kelas:</span> {u.kelasWali.map((k) => k.nama).join(", ")}</p>
        )}
      </div>
      <FormSandi />
    </div>
  );
}
