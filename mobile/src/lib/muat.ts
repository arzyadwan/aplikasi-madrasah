import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [versi, setVersi] = useState(0);
  const permintaan = useMemo(() => ({ path, versi }), [path, versi]);
  const [hasil, setHasil] = useState<{ permintaan: typeof permintaan; nilai: Hasil<T> }>();
  useEffect(() => {
    if (!path) return;
    let aktif = true;
    ambil<T>(path).then(nilai => { if (aktif) setHasil({ permintaan, nilai }); });
    return () => { aktif = false; };
  }, [path, permintaan]);
  const muat = useCallback(() => setVersi(v => v + 1), []);
  const nilai = hasil?.permintaan === permintaan ? hasil.nilai : null;
  return { data: nilai?.ok ? nilai.data : null, galat: nilai && !nilai.ok ? nilai.pesan : null, memuat: !!path && !nilai, muat };
}
