import type { Metadata } from "next";
import { Suspense } from "react";
import { wajibLogin } from "@/lib/auth";
import { dataHariIni } from "@/lib/data-guru";
import { tanggalLokal, ZONA } from "@/lib/waktu";
import { FormPertemuan } from "./form-pertemuan";

export const metadata: Metadata = { title: "Absen & Jurnal" };

export default async function HalamanIsi({ searchParams }: PageProps<"/guru/isi">) {
  const u = await wajibLogin();
  const sp = await searchParams;
  const jadwalId = typeof sp.jadwal === "string" ? sp.jadwal : undefined;
  const data = await dataHariIni(u.id, tanggalLokal(), jadwalId);
  return (
    <Suspense>
      <FormPertemuan data={data} zona={ZONA} bolehPengganti={u.peran !== "ADMIN"} />
    </Suspense>
  );
}
