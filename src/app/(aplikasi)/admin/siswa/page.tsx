import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormAksi } from "@/components/form-aksi";
import { aksiMassal, imporSiswa, simpanSiswa } from "./aksi";

export const metadata: Metadata = { title: "Siswa" };

export default async function HalamanSiswa({ searchParams }: PageProps<"/admin/siswa">) {
  await wajibLogin(["ADMIN"]);
  const sp = await searchParams;
  const kelasId = typeof sp.kelas === "string" ? sp.kelas : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const kelas = await db.kelas.findMany({ select: { id: true, nama: true }, orderBy: [{ tingkat: "asc" }, { nama: "asc" }] });

  const where: Prisma.SiswaWhereInput = {};
  if (kelasId === "tanpa") where.kelasId = null;
  else if (kelasId === "nonaktif") where.aktif = false;
  else if (kelasId) { where.kelasId = kelasId; where.aktif = true; }
  else where.aktif = true;
  if (q) where.OR = [{ nama: { contains: q, mode: "insensitive" } }, { nis: { contains: q } }, { nisn: { contains: q } }];

  const siswa = await db.siswa.findMany({ where, include: { kelas: { select: { nama: true } } }, orderBy: [{ kelas: { nama: "asc" } }, { nama: "asc" }], take: 500 });
  const edit = typeof sp.edit === "string" ? await db.siswa.findUnique({ where: { id: sp.edit } }) : null;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-utama-700">← Beranda</Link>
        <h1 className="judul-halaman mt-1">Siswa</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="kartu">
          <h2 className="mb-3 font-semibold">{edit ? `Ubah ${edit.nama}` : "Tambah siswa"}</h2>
          <FormAksi aksi={simpanSiswa} kosongkan={!edit} tombol={edit ? "Simpan perubahan" : "Tambah"} className="grid gap-3 sm:grid-cols-2">
            {edit && <input type="hidden" name="id" value={edit.id} />}
            <label className="text-sm sm:col-span-2">Nama lengkap *<input name="nama" className="masukan" defaultValue={edit?.nama} required /></label>
            <label className="text-sm">NIS<input name="nis" className="masukan" defaultValue={edit?.nis ?? ""} /></label>
            <label className="text-sm">NISN<input name="nisn" className="masukan" defaultValue={edit?.nisn ?? ""} /></label>
            <label className="text-sm">Jenis kelamin *
              <select name="jk" className="masukan" defaultValue={edit?.jk ?? "L"}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
            </label>
            <label className="text-sm">Kelas
              <select name="kelasId" className="masukan" defaultValue={edit?.kelasId ?? (kelasId && kelasId !== "tanpa" && kelasId !== "nonaktif" ? kelasId : "")}>
                <option value="">— tanpa kelas —</option>
                {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2" />
          </FormAksi>
          {edit && <Link href="/admin/siswa" className="mt-2 inline-block text-sm text-slate-500 underline">Batal</Link>}
        </section>

        <section className="kartu">
          <h2 className="font-semibold">Impor dari Excel</h2>
          <p className="mb-2 text-sm text-slate-600">
            Siapkan kolom berurutan: <b>NIS, NISN, Nama, L/P, Kelas</b>. Blok datanya di Excel, salin (Ctrl+C), lalu tempel di bawah.
            Siswa dengan NIS yang sudah ada akan diperbarui.
          </p>
          <FormAksi aksi={imporSiswa} kosongkan tombol="Impor" className="space-y-2">
            <textarea name="data" rows={6} className="masukan font-mono text-xs" placeholder={"NIS\tNISN\tNama\tL/P\tKelas\n7001\t0123456789\tAhmad Fauzi\tL\tVII A"} />
          </FormAksi>
        </section>
      </div>

      <form className="kartu flex flex-wrap gap-2">
        <select name="kelas" defaultValue={kelasId} className="masukan w-auto">
          <option value="">Semua siswa aktif</option>
          {kelas.map((k) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}
          <option value="tanpa">Tanpa kelas</option>
          <option value="nonaktif">Nonaktif (lulus/pindah)</option>
        </select>
        <input name="q" defaultValue={q} className="masukan w-auto flex-1" placeholder="Cari nama / NIS / NISN" />
        <button className="tombol-garis">Tampilkan</button>
      </form>

      <FormAksi aksi={aksiMassal} tombol="Terapkan ke yang dicentang" gayaTombol="tombol-garis mx-4 mb-4" className="kartu space-y-3 overflow-x-auto p-0">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
          <p className="text-sm text-slate-600">{siswa.length} siswa{siswa.length === 500 ? " (maksimal 500 ditampilkan)" : ""}. Centang siswa lalu:</p>
          <select name="tujuan" className="masukan w-auto" defaultValue="">
            <option value="">— pilih tindakan —</option>
            {kelas.map((k) => <option key={k.id} value={k.id}>Pindahkan ke {k.nama}</option>)}
            <option value="nonaktif">Nonaktifkan (lulus/pindah)</option>
            <option value="aktif">Aktifkan kembali</option>
          </select>
        </div>
        <table className="tabel">
          <thead><tr><th></th><th>Nama</th><th>NIS</th><th>NISN</th><th>L/P</th><th>Kelas</th><th></th></tr></thead>
          <tbody>
            {siswa.map((s) => (
              <tr key={s.id} className={s.aktif ? "" : "opacity-60"}>
                <td><input type="checkbox" name="pilih" value={s.id} aria-label={`Pilih ${s.nama}`} /></td>
                <td className="font-medium">{s.nama}</td><td>{s.nis ?? ""}</td><td>{s.nisn ?? ""}</td><td>{s.jk}</td>
                <td>{s.kelas?.nama ?? "–"}</td>
                <td className="text-right"><Link href={`/admin/siswa?edit=${s.id}${kelasId ? `&kelas=${kelasId}` : ""}`} className="text-xs font-semibold text-utama-700">Ubah</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4" />
      </FormAksi>
    </div>
  );
}
