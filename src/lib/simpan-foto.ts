import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./data/uploads");
const MAKS_BYTE = 1.5 * 1024 * 1024;

/** Simpan foto JPEG dari data URL. Mengembalikan path relatif terhadap UPLOAD_DIR. */
export async function simpanFotoJpeg(dataUrl: string, subfolder: string): Promise<string> {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new Error("Format foto harus JPEG.");
  const buf = Buffer.from(m[1], "base64");
  if (buf.length > MAKS_BYTE) throw new Error("Ukuran foto terlalu besar.");
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("File bukan foto JPEG yang valid.");
  const rel = path.posix.join(subfolder, `${randomUUID()}.jpg`);
  const abs = path.join(/*turbopackIgnore: true*/ DIR, rel);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(abs), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ abs, buf);
  return rel;
}

export async function bacaFoto(rel: string): Promise<Buffer> {
  const abs = path.resolve(/*turbopackIgnore: true*/ DIR, rel);
  if (!abs.startsWith(DIR + path.sep)) throw new Error("Path tidak valid.");
  return readFile(/*turbopackIgnore: true*/ abs);
}
