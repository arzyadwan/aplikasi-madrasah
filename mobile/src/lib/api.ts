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
  constructor(timeout = false) { super(timeout ? "Batas waktu koneksi terlampaui." : "Tidak bisa terhubung ke server. Periksa internet Anda."); }
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
  let data: { pesan?: string } | null;
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
    data = await res.json().catch(() => null);
    if (ctrl.signal.aborted) throw new GalatJaringan(true);
  } catch {
    throw new GalatJaringan(ctrl.signal.aborted);
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) {
    if (res.status === 401 && !opsi.tanpaToken) saatTidakSah?.();
    const jenis = res.status >= 500 ? "Server bermasalah" : "Permintaan ditolak";
    throw new GalatServer(res.status, `${jenis} (${res.status}).${data?.pesan ? " " + data.pesan : ""}`);

  }
  if (!data) throw new GalatServer(502, "Jawaban server tidak lengkap. Coba lagi.");
  return data as T;
}
