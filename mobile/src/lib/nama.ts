const GELAR_DEPAN = /^(?:(?:Drs|Dra|Dr|Hj|H|Ustz|Ust|Ir)\.\s*)+/i;

/** Inisial dua huruf tanpa gelar: "Dra. Hj. Sitti Aminah" -> "SA". */
export function inisialNama(nama: string): string {
  const kata = nama.split(",")[0].trim().replace(GELAR_DEPAN, "").split(/\s+/).filter(Boolean);
  return kata.slice(0, 2).map(k => k[0]).join("").toUpperCase();
}

export function namaPanggilan(nama: string): string {
  const tanpaGelarBelakang = nama.split(",")[0].trim();
  return tanpaGelarBelakang.replace(/^(?:(?:Drs|Dra|Dr|Hj|H|Ustz|Ust|Ir)\.\s*)+/i, "").split(/\s+/)[0];
}
