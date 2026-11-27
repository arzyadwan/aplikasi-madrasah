"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JenisKelamin } from "@prisma/client";
import { db } from "@/lib/db";
import { aksiAdmin, GalatAksi, teks } from "@/lib/aksi-admin";

function jk(v: string): JenisKelamin | null {
  const s = v.trim().toUpperCase();
  if (["L", "LK", "LAKI-LAKI", "LAKI"].includes(s)) return "L";
  if (["P", "PR", "PEREMPUAN", "WANITA"].includes(s)) return "P";
  return null;
}

export const simpanSiswa = aksiAdmin(async (form) => {
  const id = teks(form, "id");
  const j = jk(teks(form, "jk", true));
  if (!j) throw new GalatAksi("Jenis kelamin harus L atau P.");
  const data = {
    nama: teks(form, "nama", true, 120),
    nis: teks(form, "nis", false, 30) || null,
    nisn: teks(form, "nisn", false, 20) || null,
    jk: j,
    kelasId: teks(form, "kelasId") || null,
  };
  if (id) {
    await db.siswa.update({ where: { id }, data });
    revalidatePath("/admin/siswa");
    redirect(`/admin/siswa${data.kelasId ? `?kelas=${data.kelasId}` : ""}`);
  }
  await db.siswa.create({ data });
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: `${data.nama} ditambahkan.` };
});

/**
 * Impor dari salinan Excel (Ctrl+C lalu tempel). Kolom: NIS, NISN, Nama, L/P, Kelas.
 * Pemisah boleh tab, titik koma, atau koma. Baris judul diabaikan.
 */
export const imporSiswa = aksiAdmin(async (form) => {
  const isi = String(form.get("data") ?? "");
  const kelas = await db.kelas.findMany({ select: { id: true, nama: true } });
  const petaKelas = new Map(kelas.map((k) => [k.nama.replace(/\s+/g, "").toUpperCase(), k.id]));
  const baris = isi.split(/\r?\n/).map((b) => b.trim()).filter(Boolean);
  if (baris.length === 0) throw new GalatAksi("Tempel data siswa terlebih dahulu.");
  if (baris.length > 1500) throw new GalatAksi("Maksimal 1.500 baris sekali impor.");

  const galat: string[] = [];
  const data: { nis: string | null; nisn: string | null; nama: string; jk: JenisKelamin; kelasId: string | null }[] = [];
  baris.forEach((b, i) => {
    const pemisah = b.includes("\t") ? "\t" : b.includes(";") ? ";" : ",";
    const [nis = "", nisn = "", nama = "", jkTeks = "", namaKelas = ""] = b.split(pemisah).map((x) => x.trim());
    if (i === 0 && /nama/i.test(nama)) return; // baris judul
    const j = jk(jkTeks);
    const kelasId = namaKelas ? petaKelas.get(namaKelas.replace(/\s+/g, "").toUpperCase()) : null;
    if (!nama) galat.push(`Baris ${i + 1}: nama kosong`);
    else if (!j) galat.push(`Baris ${i + 1}: jenis kelamin "${jkTeks}" tidak dikenal`);
    else if (namaKelas && !kelasId) galat.push(`Baris ${i + 1}: kelas "${namaKelas}" tidak ada`);
    else data.push({ nis: nis || null, nisn: nisn || null, nama: nama.slice(0, 120), jk: j, kelasId: kelasId ?? null });
  });
  if (galat.length) throw new GalatAksi(`Tidak ada yang diimpor. Perbaiki dulu: ${galat.slice(0, 5).join("; ")}${galat.length > 5 ? ` (+${galat.length - 5} lagi)` : ""}`);

  // NIS yang sudah ada diperbarui, yang baru ditambahkan
  let baru = 0;
  let diperbarui = 0;
  await db.$transaction(async (tx) => {
    for (const s of data) {
      if (s.nis) {
        const ada = await tx.siswa.findUnique({ where: { nis: s.nis } });
        if (ada) { await tx.siswa.update({ where: { id: ada.id }, data: { ...s, aktif: true } }); diperbarui++; continue; }
      }
      await tx.siswa.create({ data: s });
      baru++;
    }
  }, { timeout: 60000 });
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: `Impor selesai: ${baru} siswa baru, ${diperbarui} diperbarui.` };
});

/** Pindah kelas massal (misalnya kenaikan kelas) atau nonaktifkan siswa (lulus/pindah sekolah) */
export const aksiMassal = aksiAdmin(async (form) => {
  const ids = form.getAll("pilih").map(String).filter(Boolean);
  if (ids.length === 0) throw new GalatAksi("Centang siswa terlebih dahulu.");
  const tujuan = teks(form, "tujuan");
  if (tujuan === "nonaktif") {
    await db.siswa.updateMany({ where: { id: { in: ids } }, data: { aktif: false } });
  } else if (tujuan === "aktif") {
    await db.siswa.updateMany({ where: { id: { in: ids } }, data: { aktif: true } });
  } else if (tujuan) {
    await db.siswa.updateMany({ where: { id: { in: ids } }, data: { kelasId: tujuan, aktif: true } });
  } else {
    throw new GalatAksi("Pilih tindakan.");
  }
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: `${ids.length} siswa diperbarui.` };
});
