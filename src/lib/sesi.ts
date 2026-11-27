import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const NAMA_COOKIE = "sesi_madrasah";
const MASA_BERLAKU_HARI = 30;

function kunci() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET belum diisi atau kurang dari 32 karakter.");
  }
  return new TextEncoder().encode(s);
}

export type IsiSesi = { uid: string; v: number };

/** Token JWT: dipakai sebagai cookie (web) atau header Authorization: Bearer (aplikasi HP) */
export async function buatToken(isi: IsiSesi, hari = MASA_BERLAKU_HARI): Promise<string> {
  return new SignJWT(isi)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hari}d`)
    .sign(kunci());
}

export async function buatSesi(isi: IsiSesi) {
  const token = await buatToken(isi);
  (await cookies()).set(NAMA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: MASA_BERLAKU_HARI * 24 * 3600,
  });
}

export async function bacaSesi(): Promise<IsiSesi | null> {
  const auth = (await headers()).get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const token = bearer || (await cookies()).get(NAMA_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string" || typeof payload.v !== "number") return null;
    return { uid: payload.uid, v: payload.v };
  } catch {
    return null;
  }
}

export async function hapusSesi() {
  (await cookies()).delete(NAMA_COOKIE);
}
