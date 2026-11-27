"use client";

import { useActionState } from "react";
import { masuk, type StatusLogin } from "./aksi";

export function FormLogin() {
  const [status, aksi, menunggu] = useActionState<StatusLogin, FormData>(masuk, {});
  return (
    <form action={aksi} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">Nama pengguna</label>
        <input id="username" name="username" className="masukan" autoComplete="username"
          autoCapitalize="none" autoCorrect="off" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Kata sandi</label>
        <input id="password" name="password" type="password" className="masukan"
          autoComplete="current-password" required />
      </div>
      {status.pesan && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{status.pesan}</p>
      )}
      <button className="tombol w-full" disabled={menunggu}>
        {menunggu ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
