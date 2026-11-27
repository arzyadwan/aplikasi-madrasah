"use client";

import { useActionState, useEffect, useRef } from "react";

export type HasilAksi = { ok?: boolean; pesan?: string };
type Aksi = (sebelum: HasilAksi, form: FormData) => Promise<HasilAksi>;

/** Formulir dengan server action: menampilkan pesan berhasil/gagal dan bisa dikosongkan setelah berhasil. */
export function FormAksi({
  aksi, children, tombol = "Simpan", className = "", kosongkan = false, konfirmasi, gayaTombol = "tombol",
}: {
  aksi: Aksi; children?: React.ReactNode; tombol?: string; className?: string; kosongkan?: boolean;
  konfirmasi?: string; gayaTombol?: string;
}) {
  const [hasil, act, menunggu] = useActionState<HasilAksi, FormData>(aksi, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (hasil.ok && kosongkan) ref.current?.reset(); }, [hasil, kosongkan]);
  return (
    <form ref={ref} action={act} className={className}
      onSubmit={(e) => { if (konfirmasi && !confirm(konfirmasi)) e.preventDefault(); }}>
      {children}
      {hasil.pesan && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${hasil.ok ? "bg-utama-50 text-utama-900" : "bg-red-50 text-red-700"}`}>
          {hasil.pesan}
        </p>
      )}
      <button className={gayaTombol} disabled={menunggu}>{menunggu ? "Memproses…" : tombol}</button>
    </form>
  );
}
