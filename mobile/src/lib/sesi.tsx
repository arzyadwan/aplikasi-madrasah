import Constants from "expo-constants";
import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { aturKoneksi, aturSaatTidakSah, GalatJaringan, minta, rapikanAlamat } from "./api";
import { kosongkanAntrean, muatAntrean } from "./antrean";
import { bacaJson, bacaRahasia, hapus, simpanJson, simpanRahasia } from "./penyimpanan";
import type { Saya } from "./tipe";

const KUNCI_TOKEN = "token";
const KUNCI_ALAMAT = "alamat_server";
const KUNCI_SAYA = "saya";

type NilaiSesi = {
  memuat: boolean;
  alamat: string;
  token: string | null;
  saya: Saya | null;
  masuk: (alamat: string, username: string, sandi: string) => Promise<void>;
  keluar: () => Promise<void>;
  perbaruiSaya: () => Promise<void>;
  gantiToken: (t: string) => Promise<void>;
};

const KonteksSesi = createContext<NilaiSesi | null>(null);

export function useSesi() {
  const v = use(KonteksSesi);
  if (!v) throw new Error("useSesi harus di dalam <PenyediaSesi>");
  return v;
}

/** Saya yang pasti ada (dipakai di layar setelah login) */
export function useSaya(): Saya {
  const { saya } = useSesi();
  if (!saya) throw new Error("Belum login");
  return saya;
}

export const ALAMAT_BAWAAN: string = (Constants.expoConfig?.extra?.alamatServerBawaan as string | undefined) ?? "";

export function PenyediaSesi({ children }: PropsWithChildren) {
  const [memuat, setMemuat] = useState(true);
  const [alamat, setAlamat] = useState(ALAMAT_BAWAAN);
  const [token, setToken] = useState<string | null>(null);
  const [saya, setSaya] = useState<Saya | null>(null);

  const keluar = useCallback(async () => {
    await simpanRahasia(KUNCI_TOKEN, null);
    await hapus(KUNCI_SAYA, "cache_hari_ini");
    await kosongkanAntrean();
    aturKoneksi(alamat, null);
    setToken(null);
    setSaya(null);
  }, [alamat]);

  const perbaruiSaya = useCallback(async () => {
    try {
      const s = await minta<Saya>("/api/m/saya");
      setSaya(s);
      await simpanJson(KUNCI_SAYA, s);
    } catch (e) {
      if (!(e instanceof GalatJaringan)) throw e;
    }
  }, []);

  // Saat aplikasi dibuka: pulihkan sesi dari penyimpanan HP (bisa tanpa internet)
  useEffect(() => {
    (async () => {
      const [a, t, s] = await Promise.all([
        bacaJson<string>(KUNCI_ALAMAT), bacaRahasia(KUNCI_TOKEN), bacaJson<Saya>(KUNCI_SAYA),
      ]);
      const al = a ?? ALAMAT_BAWAAN;
      setAlamat(al);
      aturKoneksi(al, t);
      await muatAntrean();
      if (t && s) {
        setToken(t);
        setSaya(s);
        minta<Saya>("/api/m/saya").then(async (baru) => { setSaya(baru); await simpanJson(KUNCI_SAYA, baru); }).catch(() => {});
      }
      setMemuat(false);
    })();
  }, []);

  // Token ditolak server (kedaluwarsa / kata sandi diganti): keluar
  useEffect(() => {
    aturSaatTidakSah(() => { void keluar(); });
    return () => aturSaatTidakSah(null);
  }, [keluar]);

  const masuk = useCallback(async (alamatMasukan: string, username: string, sandi: string) => {
    const al = rapikanAlamat(alamatMasukan);
    const r = await minta<{ token: string }>("/api/m/login", {
      body: { username, password: sandi }, tanpaToken: true, alamatKhusus: al,
    });
    aturKoneksi(al, r.token);
    const s = await minta<Saya>("/api/m/saya");
    await Promise.all([simpanJson(KUNCI_ALAMAT, al), simpanRahasia(KUNCI_TOKEN, r.token), simpanJson(KUNCI_SAYA, s)]);
    setAlamat(al);
    setToken(r.token);
    setSaya(s);
  }, []);

  const gantiToken = useCallback(async (t: string) => {
    aturKoneksi(alamat, t);
    await simpanRahasia(KUNCI_TOKEN, t);
    setToken(t);
  }, [alamat]);

  const nilai = useMemo(() => ({ memuat, alamat, token, saya, masuk, keluar, perbaruiSaya, gantiToken }),
    [memuat, alamat, token, saya, masuk, keluar, perbaruiSaya, gantiToken]);
  return <KonteksSesi value={nilai}>{children}</KonteksSesi>;
}
