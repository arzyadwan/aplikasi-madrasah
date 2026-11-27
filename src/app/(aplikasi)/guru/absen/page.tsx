import type { Metadata } from "next";
import { wajibLogin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTanggal, keDbDate, tanggalLokal, ZONA } from "@/lib/waktu";
import { LABEL_STATUS_GURU } from "@/lib/tipe";
import { FormAbsenGuru } from "./form-absen-guru";

export const metadata: Metadata = { title: "Absen Saya" };

export default async function HalamanAbsenSaya() {
  const u = await wajibLogin();
  const tanggal = tanggalLokal();
  const [absen, pengaturan] = await Promise.all([
    db.absensiGuru.findUnique({ where: { penggunaId_tanggal: { penggunaId: u.id, tanggal: keDbDate(tanggal) } } }),
    db.pengaturan.findUnique({ where: { id: 1 }, select: { lat: true, lng: true, radiusMeter: true } }),
  ]);
  const jam = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit" }).format(d);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="judul-halaman">Absen saya</h1>
        <p className="text-sm text-slate-500">{formatTanggal(tanggal)}</p>
      </div>
      {absen ? (
        <div className="kartu space-y-2">
          <p className="text-lg font-semibold text-utama-700">{LABEL_STATUS_GURU[absen.status]}</p>
          <p className="text-sm text-slate-600">Tercatat pukul {jam(absen.waktuMasuk)}</p>
          {absen.jarakMeter != null && (
            <p className="text-sm text-slate-600">
              Jarak dari madrasah ±{absen.jarakMeter} m{absen.dalamRadius === false ? " (di luar area madrasah)" : ""}
            </p>
          )}
          {absen.keterangan && <p className="text-sm text-slate-600">Keterangan: {absen.keterangan}</p>}
          {absen.fotoPath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/foto/${absen.id}`} alt="Foto absen" className="mt-2 w-40 rounded-lg border" />
          )}
        </div>
      ) : (
        <FormAbsenGuru tanggal={tanggal} zona={ZONA} lokasiMadrasah={pengaturan?.lat != null && pengaturan.lng != null
          ? { lat: pengaturan.lat, lng: pengaturan.lng, radius: pengaturan.radiusMeter } : null} />
      )}
    </div>
  );
}
