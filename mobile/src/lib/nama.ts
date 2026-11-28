export function namaPanggilan(nama: string): string {
  const tanpaGelarBelakang = nama.split(",")[0].trim();
  return tanpaGelarBelakang.replace(/^(?:(?:Drs|Dra|Dr|Hj|H|Ustz|Ust|Ir)\.\s*)+/i, "").split(/\s+/)[0];
}
