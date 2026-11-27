"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Pemilih tanggal yang mengubah ?tanggal= di URL */
export function PilihTanggal({ nilai, maks }: { nilai: string; maks?: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <input type="date" className="masukan w-auto" value={nilai} max={maks}
      onChange={(e) => {
        const q = new URLSearchParams(sp.toString());
        if (e.target.value) q.set("tanggal", e.target.value); else q.delete("tanggal");
        router.push(`${path}?${q.toString()}`);
      }} />
  );
}
