import type { Metadata } from "next";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { akhirBulan, awalBulan, awalMinggu, tambahHari, tanggalLokal } from "@/lib/waktu";
import { FormLaporan } from "./form-laporan";

export const metadata: Metadata = { title: "Laporan" };

export default async function HalamanLaporan() {
  await wajibLogin(["KEPALA", "ADMIN"]);
  const kelas = await db.kelas.findMany({ select: { id: true, nama: true }, orderBy: { nama: "asc" } });
  const t = tanggalLokal();
  const senin = awalMinggu(t);
  const bulanLalu = tambahHari(awalBulan(t), -1);
  const preset = [
    { label: "Minggu ini", dari: senin, sampai: tambahHari(senin, 5) },
    { label: "Minggu lalu", dari: tambahHari(senin, -7), sampai: tambahHari(senin, -2) },
    { label: "Bulan ini", dari: awalBulan(t), sampai: akhirBulan(t) },
    { label: "Bulan lalu", dari: awalBulan(bulanLalu), sampai: bulanLalu },
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="judul-halaman">Laporan</h1>
        <p className="text-sm text-slate-500">Unduh rekap mingguan atau bulanan dalam format Excel.</p>
      </div>
      <FormLaporan kelas={kelas} preset={preset} />
    </div>
  );
}
