import { useCallback, useEffect, useState } from "react";
import { GalatJaringan, minta } from "./api";
import { bacaJson, simpanJson } from "./penyimpanan";
import type { ResponsHariIni } from "./tipe";

const KUNCI = "cache_hari_ini";

type Hasil = { data: ResponsHariIni | null; offline: boolean; galat: string | null };

async function ambilHariIni(): Promise<Hasil> {
  try {
    const r = await minta<ResponsHariIni>("/api/m/hari-ini");
    await simpanJson(KUNCI, r);
    return { data: r, offline: false, galat: null };
  } catch (e) {
    const c = await bacaJson<ResponsHariIni>(KUNCI);
    return {
      data: c,
      offline: e instanceof GalatJaringan,
      galat: e instanceof GalatJaringan ? null : e instanceof Error ? e.message : "Gagal memuat.",
    };
  }
}

/** Data jadwal hari ini: dari server bila online, dari salinan di HP bila offline */
export function useHariIni() {
  const [hasil, setHasil] = useState<Hasil>({ data: null, offline: false, galat: null });
  const [memuat, setMemuat] = useState(true);
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    let batal = false;
    ambilHariIni().then((h) => {
      if (batal) return;
      setHasil((lama) => ({ ...h, data: h.data ?? lama.data }));
      setMemuat(false);
    });
    return () => { batal = true; };
  }, [versi]);

  const muat = useCallback(() => {
    setMemuat(true);
    setVersi((v) => v + 1);
  }, []);

  return { ...hasil, memuat, muat };
}

export async function cacheHariIni() {
  return bacaJson<ResponsHariIni>(KUNCI);
}
