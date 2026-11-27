"use client";

import { useActionState } from "react";
import { gantiSandi, type HasilAksi } from "./aksi";

export function FormSandi() {
  const [hasil, aksi, menunggu] = useActionState<HasilAksi, FormData>(gantiSandi, {});
  return (
    <form action={aksi} className="kartu space-y-3">
      <h2 className="font-semibold">Ganti kata sandi</h2>
      <div>
        <label className="label" htmlFor="lama">Kata sandi lama</label>
        <input id="lama" name="lama" type="password" className="masukan" autoComplete="current-password" required />
      </div>
      <div>
        <label className="label" htmlFor="baru">Kata sandi baru (min. 8 karakter)</label>
        <input id="baru" name="baru" type="password" className="masukan" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <label className="label" htmlFor="ulang">Ulangi kata sandi baru</label>
        <input id="ulang" name="ulang" type="password" className="masukan" autoComplete="new-password" minLength={8} required />
      </div>
      {hasil.pesan && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${hasil.ok ? "bg-utama-50 text-utama-900" : "bg-red-50 text-red-700"}`}>
          {hasil.pesan}
        </p>
      )}
      <button className="tombol" disabled={menunggu}>{menunggu ? "Menyimpan…" : "Simpan"}</button>
    </form>
  );
}
