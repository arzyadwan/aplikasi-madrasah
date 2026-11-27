import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormAksi } from "@/components/form-aksi";
import { resetSandi, simpanPengguna, ubahAktif } from "./aksi";

export const metadata: Metadata = { title: "Guru & Pengguna" };

const LABEL = { GURU: "Guru", KEPALA: "Kepala madrasah", ADMIN: "Operator / TU" } as const;

export default async function HalamanPengguna({ searchParams }: PageProps<"/admin/pengguna">) {
  await wajibLogin(["ADMIN"]);
  const sp = await searchParams;
  const daftar = await db.pengguna.findMany({
    orderBy: [{ aktif: "desc" }, { nama: "asc" }],
    include: { kelasWali: { select: { nama: true } }, _count: { select: { jadwal: true } } },
  });
  const edit = typeof sp.edit === "string" ? daftar.find((d) => d.id === sp.edit) : undefined;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-utama-700">← Beranda</Link>
        <h1 className="judul-halaman mt-1">Guru & pengguna</h1>
        <p className="text-sm text-slate-500">Setiap guru, kepala madrasah, dan operator/TU punya akun login sendiri.</p>
      </div>

      <section className="kartu">
        <h2 className="mb-3 font-semibold">{edit ? `Ubah ${edit.nama}` : "Tambah pengguna"}</h2>
        <FormAksi aksi={simpanPengguna} kosongkan={!edit} tombol={edit ? "Simpan perubahan" : "Tambah"} className="grid gap-3 sm:grid-cols-2">
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <label className="text-sm">Nama lengkap *<input name="nama" className="masukan" defaultValue={edit?.nama} required /></label>
          <label className="text-sm">Nama pengguna (untuk login) *<input name="username" className="masukan" defaultValue={edit?.username}
            required autoCapitalize="none" placeholder="contoh: siti.aisyah" /></label>
          <label className="text-sm">Peran
            <select name="peran" className="masukan" defaultValue={edit?.peran ?? "GURU"}>
              <option value="GURU">Guru</option><option value="KEPALA">Kepala madrasah</option><option value="ADMIN">Operator / TU</option>
            </select>
          </label>
          <label className="text-sm">NIP / NUPTK<input name="nip" className="masukan" defaultValue={edit?.nip ?? ""} /></label>
          <label className="text-sm">No. HP<input name="noHp" className="masukan" defaultValue={edit?.noHp ?? ""} inputMode="tel" /></label>
          {!edit && <label className="text-sm">Kata sandi awal (kosongkan untuk dibuat otomatis)<input name="sandi" className="masukan" /></label>}
          <div className="sm:col-span-2" />
        </FormAksi>
        {edit && <Link href="/admin/pengguna" className="mt-2 inline-block text-sm text-slate-500 underline">Batal</Link>}
      </section>

      <section className="kartu overflow-x-auto p-0">
        <table className="tabel">
          <thead><tr><th>Nama</th><th>Login</th><th>Peran</th><th>Keterangan</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {daftar.map((d) => (
              <tr key={d.id} className={d.aktif ? "" : "opacity-50"}>
                <td className="font-medium">{d.nama}{!d.aktif && <span className="ml-1 text-xs">(nonaktif)</span>}</td>
                <td className="font-mono text-xs">{d.username}</td>
                <td>{LABEL[d.peran]}</td>
                <td className="text-xs text-slate-600">
                  {d.kelasWali.length > 0 && <>Wali {d.kelasWali.map((k) => k.nama).join(", ")}<br /></>}
                  {d._count.jadwal > 0 && `${d._count.jadwal} jadwal`}
                </td>
                <td>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Link href={`/admin/pengguna?edit=${d.id}`} className="tombol-garis px-2 py-1 text-xs">Ubah</Link>
                    <FormAksi aksi={resetSandi} tombol="Reset sandi" gayaTombol="tombol-garis px-2 py-1 text-xs"
                      konfirmasi={`Buat kata sandi baru untuk ${d.nama}?`} className="flex flex-col items-end gap-1">
                      <input type="hidden" name="id" value={d.id} />
                    </FormAksi>
                    <FormAksi aksi={ubahAktif} tombol={d.aktif ? "Nonaktifkan" : "Aktifkan"} gayaTombol="tombol-bahaya px-2 py-1 text-xs"
                      konfirmasi={d.aktif ? `Nonaktifkan ${d.nama}? Ia tidak bisa login lagi.` : undefined} className="flex flex-col items-end gap-1">
                      <input type="hidden" name="id" value={d.id} />
                    </FormAksi>
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
