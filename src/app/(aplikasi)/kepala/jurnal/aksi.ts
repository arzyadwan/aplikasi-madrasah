"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { penggunaSaatIni } from "@/lib/auth";

/** Kepala madrasah menandai jurnal "sudah diperiksa" dengan catatan opsional (kuesioner 7.4) */
export async function tandaiDiperiksa(form: FormData) {
  const u = await penggunaSaatIni();
  if (!u || u.peran !== "KEPALA") throw new Error("Hanya kepala madrasah yang bisa memeriksa jurnal.");
  const ids = form.getAll("id").map(String).filter(Boolean);
  const catatan = String(form.get("catatan") ?? "").trim().slice(0, 500) || null;
  if (ids.length === 0) return;
  await db.pertemuan.updateMany({
    where: { id: { in: ids }, diperiksaPada: null },
    data: { diperiksaPada: new Date(), diperiksaOlehId: u.id, ...(ids.length === 1 && catatan ? { catatanKepala: catatan } : {}) },
  });
  revalidatePath("/kepala/jurnal");
}

export async function batalPeriksa(form: FormData) {
  const u = await penggunaSaatIni();
  if (!u || u.peran !== "KEPALA") throw new Error("Hanya kepala madrasah yang bisa memeriksa jurnal.");
  const id = String(form.get("id") ?? "");
  await db.pertemuan.update({ where: { id }, data: { diperiksaPada: null, diperiksaOlehId: null } });
  revalidatePath("/kepala/jurnal");
}
