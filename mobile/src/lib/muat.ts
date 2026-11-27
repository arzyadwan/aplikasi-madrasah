import { useCallback, useEffect, useState } from "react";
import { minta } from "./api";

type Hasil<T> = { ok: true; data: T } | { ok: false; pesan: string };

async function ambil<T>(path: string): Promise<Hasil<T>> {
  try {
    return { ok: true, data: await minta<T>(path) };
  } catch (e) {
    return { ok: false, pesan: e instanceof Error ? e.message : "Gagal memuat." };
  }
}

/** Ambil data dari server untuk satu layar (online), dengan status memuat dan galat */
export function useMuat<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    if (!path) return;
    let batal = false;
    ambil<T>(path).then((h) => {
      if (batal) return;
      if (h.ok) { setData(h.data); setGalat(null); } else setGalat(h.pesan);
      setMemuat(false);
    });
    return () => { batal = true; };
  }, [path, versi]);

  /** Muat ulang (tarik layar ke bawah) */
  const muat = useCallback(() => {
    setMemuat(true);
    setVersi((v) => v + 1);
  }, []);

  return { data, galat, memuat, muat };
}
