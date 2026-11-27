import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormAksi } from "@/components/form-aksi";
import { hapusMapel, simpanMapel } from "./aksi";

export const metadata: Metadata = { title: "Mata Pelajaran" };

export default async function HalamanMapel({ searchParams }: PageProps<"/admin/mapel">) {
  await wajibLogin(["ADMIN"]);
  const sp = await searchParams;
  const mapel = await db.mapel.findMany({ orderBy: [{ urutan: "asc" }, { nama: "asc" }], include: { _count: { select: { jadwal: true } } } });
  const edit = typeof sp.edit === "string" ? mapel.find((m) => m.id === sp.edit) : undefined;
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-utama-700">← Beranda</Link>
        <h1 className="judul-halaman mt-1">Mata pelajaran</h1>
        <p className="text-sm text-slate-500">{mapel.length} mata pelajaran</p>
      </div>
      <section className="kartu">
        <h2 className="mb-3 font-semibold">{edit ? `Ubah ${edit.nama}` : "Tambah mata pelajaran"}</h2>
        <FormAksi aksi={simpanMapel} kosongkan={!edit} tombol={edit ? "Simpan perubahan" : "Tambah"} className="grid gap-3 sm:grid-cols-3">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <label className="text-sm sm:col-span-1">Nama *<input name="nama" className="masukan" defaultValue={edit?.nama} required /></label>
          <label className="text-sm">Kode<input name="kode" className="masukan" defaultValue={edit?.kode ?? ""} /></label>
          <label className="text-sm">Urutan<input name="urutan" type="number" className="masukan" defaultValue={edit?.urutan ?? mapel.length + 1} /></label>
          <div className="sm:col-span-3" />
        </FormAksi>
        {edit && <Link href="/admin/mapel" className="mt-2 inline-block text-sm text-slate-500 underline">Batal</Link>}
      </section>
      <section className="kartu overflow-x-auto p-0">
        <table className="tabel">
          <thead><tr><th>No</th><th>Mata pelajaran</th><th>Kode</th><th>Jadwal</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {mapel.map((m) => (
              <tr key={m.id}>
                <td>{m.urutan}</td><td className="font-medium">{m.nama}</td><td>{m.kode ?? ""}</td><td>{m._count.jadwal}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/mapel?edit=${m.id}`} className="tombol-garis px-2 py-1 text-xs">Ubah</Link>
                    <FormAksi aksi={hapusMapel} tombol="Hapus" gayaTombol="tombol-bahaya px-2 py-1 text-xs" konfirmasi={`Hapus ${m.nama}?`}
                      className="flex flex-col items-end gap-1"><input type="hidden" name="id" value={m.id} /></FormAksi>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
