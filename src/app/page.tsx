import { redirect } from "next/navigation";
import { halamanAwal, penggunaSaatIni } from "@/lib/auth";

export default async function Beranda() {
  const u = await penggunaSaatIni();
  redirect(u ? halamanAwal(u) : "/login");
}
