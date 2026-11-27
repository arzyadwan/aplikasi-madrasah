/** Koneksi ke server aplikasi madrasah (API /api/m dan /api/*) */

let alamat = "";
let token: string | null = null;
let saatTidakSah: (() => void) | null = null;

export function aturKoneksi(a: string, t: string | null) {
  alamat = a.replace(/\/+$/, "");
  token = t;
}
export function aturSaatTidakSah(fn: (() => void) | null) { saatTidakSah = fn; }
export function alamatServer() { return alamat; }
export function headerAuth(): Record<string, string> { return token ? { Authorization: `Bearer ${token}` } : {}; }

/** Tidak ada internet / server tidak terjangkau */
export class GalatJaringan extends Error {
  constructor() { super("Tidak bisa terhubung ke server. Periksa internet Anda."); }
}

/** Server menolak permintaan (pesan dari server) */
export class GalatServer extends Error {
  constructor(public status: number, pesan: string) { super(pesan); }
}

export function rapikanAlamat(masukan: string): string {
  let a = masukan.trim().replace(/\/+$/, "");
  if (a && !/^https?:\/\//i.test(a)) a = `https://${a}`;
  return a;
}

export async function minta<T>(path: string, opsi: { method?: string; body?: unknown; timeoutMs?: number; tanpaToken?: boolean; alamatKhusus?: string } = {}): Promise<T> {
  const basis = opsi.alamatKhusus ?? alamat;
  if (!basis) throw new GalatServer(0, "Alamat server belum diatur.");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opsi.timeoutMs ?? 20000);
  let res: Response;
  try {
    res = await fetch(`${basis}${path}`, {
      method: opsi.method ?? (opsi.body ? "POST" : "GET"),
      headers: {
        Accept: "application/json",
        ...(opsi.body ? { "Content-Type": "application/json" } : {}),
        ...(opsi.tanpaToken ? {} : headerAuth()),
      },
      body: opsi.body ? JSON.stringify(opsi.body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new GalatJaringan();
  } finally {
    clearTimeout(t);
  }
  const data = (await res.json().catch(() => null)) as { pesan?: string } | null;
  if (!res.ok) {
    if (res.status === 401 && !opsi.tanpaToken) saatTidakSah?.();
    if (res.status >= 500 || res.status === 408 || res.status === 429 || res.status === 502 || res.status === 504) {
      if (!data?.pesan) throw new GalatJaringan();
    }
    throw new GalatServer(res.status, data?.pesan ?? `Permintaan gagal (${res.status}).`);
  }
  return data as T;
}
