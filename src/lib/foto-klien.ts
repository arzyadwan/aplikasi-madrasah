"use client";

/** Perkecil foto dari kamera HP menjadi JPEG kecil (±50–120 KB) agar hemat kuota. */
export async function kecilkanFoto(file: File, sisiMaks = 640, kualitas = 0.7): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, gagal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => gagal(new Error("Foto tidak bisa dibaca."));
      i.src = url;
    });
    const skala = Math.min(1, sisiMaks / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * skala);
    const h = Math.round(img.naturalHeight * skala);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/jpeg", kualitas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
