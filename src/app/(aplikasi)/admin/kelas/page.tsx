import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormAksi } from "@/components/form-aksi";
import { hapusKelas, simpanKelas } from "./aksi";

export const metadata: Metadata = { title: "Kelas" };

export default async function HalamanKelas({ searchParams }: PageProps<"/admin/kelas">) {
  await wajibLogin(["ADMIN"]);
  const sp = await searchParams;
  const [kelas, guru] = await Promise.all([
    db.kelas.findMany({
      orderBy: [{ tingkat: "asc" }, { nama: "asc" }],
      include: { waliKelas: { select: { nama: true } }, _count: { select: { siswa: { where: { aktif: true } }, jadwal: true } } },
    }),
    db.pengguna.findMany({ where: { aktif: true, peran: { in: ["GURU", "KEPALA"] } }, select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
  ]);
  const edit = typeof sp.edit === "string" ? kelas.find((k) => k.id === sp.edit) : undefined;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-utama-700">← Beranda</Link>
        <h1 className="judul-halaman mt-1">Kelas</h1>
      </div>
      <section className="kartu">
        <h2 className="mb-3 font-semibold">{edit ? `Ubah kelas ${edit.nama}` : "Tambah kelas"}</h2>
        <FormAksi aksi={simpanKelas} kosongkan={!edit} tombol={edit ? "Simpan perubahan" : "Tambah"} className="grid gap-3 sm:grid-cols-3">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <label className="text-sm">Nama kelas *<input name="nama" className="masukan" defaultValue={edit?.nama} placeholder="VII A" required /></label>
          <label className="text-sm">Tingkat *<input name="tingkat" type="number" min={1} max={12} className="masukan" defaultValue={edit?.tingkat ?? 7} required /></label>
          <label className="text-sm">Wali kelas
            <select name="waliKelasId" className="masukan" defaultValue={edit?.waliKelasId ?? ""}>
              <option value="">— belum ada —</option>
              {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
          </label>
          <div className="sm:col-span-3" />
        </FormAksi>
        {edit && <Link href="/admin/kelas" className="mt-2 inline-block text-sm text-slate-500 underline">Batal</Link>}
      </section>
      <section className="kartu overflow-x-auto p-0">
        <table className="tabel">
          <thead><tr><th>Kelas</th><th>Wali kelas</th><th>Siswa</th><th>Jadwal</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {kelas.map((k) => (
              <tr key={k.id}>
                <td className="font-medium">{k.nama}</td>
                <td>{k.waliKelas?.nama ?? <span className="text-amber-700">belum ada</span>}</td>
                <td><Link className="underline" href={`/admin/siswa?kelas=${k.id}`}>{k._count.siswa}</Link></td>
                <td><Link className="underline" href={`/admin/jadwal?kelas=${k.id}`}>{k._count.jadwal}</Link></td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/kelas?edit=${k.id}`} className="tombol-garis px-2 py-1 text-xs">Ubah</Link>
                    <FormAksi aksi={hapusKelas} tombol="Hapus" gayaTombol="tombol-bahaya px-2 py-1 text-xs" konfirmasi={`Hapus kelas ${k.nama}?`}
                      className="flex flex-col items-end gap-1"><input type="hidden" name="id" value={k.id} /></FormAksi>
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
