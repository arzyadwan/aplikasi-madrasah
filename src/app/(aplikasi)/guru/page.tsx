import type { Metadata } from "next";
import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dataHariIni } from "@/lib/data-guru";
import { keDbDate, tanggalLokal, ZONA } from "@/lib/waktu";
import { LABEL_STATUS_GURU } from "@/lib/tipe";
import { DaftarHariIni } from "./daftar-hari-ini";

export const metadata: Metadata = { title: "Hari Ini" };

export default async function HalamanHariIni() {
  const u = await wajibLogin();
  const tanggal = tanggalLokal();
  const [data, absen] = await Promise.all([
    dataHariIni(u.id, tanggal),
    db.absensiGuru.findUnique({
      where: { penggunaId_tanggal: { penggunaId: u.id, tanggal: keDbDate(tanggal) } },
      select: { status: true, waktuMasuk: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="judul-halaman">Assalamu&apos;alaikum, {u.nama.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">{data.tanggalTeks}</p>
      </div>

      <div className={`kartu flex items-center justify-between gap-3 ${absen ? "" : "border-amber-300 bg-amber-50"}`}>
        <div>
          <p className="text-sm font-semibold">Absen Saya</p>
          <p className="text-sm text-slate-600">
            {absen
              ? `${LABEL_STATUS_GURU[absen.status]} · tercatat ${new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit" }).format(absen.waktuMasuk)}`
              : "Anda belum absen hari ini."}
          </p>
        </div>
        {!absen && <Link href="/guru/absen" className="tombol shrink-0">Absen sekarang</Link>}
      </div>

      <DaftarHariIni data={data} zona={ZONA} />

      <div className="kartu">
        <p className="text-sm font-semibold">Menggantikan guru lain?</p>
        <p className="mb-3 text-sm text-slate-600">
          Bila ada guru berhalangan, Anda bisa mengisi absen dan jurnal kelasnya sebagai guru pengganti.
        </p>
        <Link href="/guru/pengganti" className="tombol-garis">Lihat jadwal hari ini</Link>
      </div>
    </div>
  );
}
