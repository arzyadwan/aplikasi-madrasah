import { expect, test, type APIRequestContext } from "@playwright/test";
import { fotoJpeg, hariMinggu, SANDI } from "./bantuan";

test.skip(hariMinggu(), "Tidak ada jadwal pada hari Minggu");

async function token(request: APIRequestContext, username: string, sandi = SANDI) {
  const res = await request.post("/api/m/login", { data: { username, password: sandi } });
  expect(res.status()).toBe(200);
  return (await res.json()).token as string;
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

test("login aplikasi HP: sandi salah ditolak, token dipakai untuk API", async ({ request }) => {
  const salah = await request.post("/api/m/login", { data: { username: "guru06", password: "keliru" } });
  expect(salah.status()).toBe(401);
  const t = await token(request, "guru06");
  const saya = await request.get("/api/m/saya", { headers: auth(t) });
  const j = await saya.json();
  expect(j.pengguna.username).toBe("guru06");
  expect(j.zona).toBe("Asia/Makassar");
  const palsu = await request.get("/api/m/saya", { headers: auth(t.slice(0, -4) + "AAAA") });
  expect(palsu.status()).toBe(401);
});

test("guru mengirim absen + jurnal dan absen GPS lewat token", async ({ request, page }) => {
  const t = await token(request, "guru06");
  const hari = await (await request.get("/api/m/hari-ini", { headers: auth(t) })).json();
  test.skip(hari.data.jadwal.length === 0, "guru06 tidak punya jadwal hari ini");
  const j = hari.data.jadwal[0];
  const kirim = await request.post("/api/pertemuan", {
    headers: auth(t),
    data: {
      idKlien: `hp-${Date.now()}`, jadwalId: j.id, tanggal: hari.data.tanggal, materi: "Diisi dari aplikasi HP",
      diisiDiPerangkat: new Date().toISOString(),
      absensi: j.siswa.map((s: { id: string }, i: number) => ({ siswaId: s.id, status: i === 0 ? "I" : "H", keterangan: i === 0 ? "acara keluarga" : null })),
    },
  });
  expect(kirim.status()).toBe(200);

  const foto = `data:image/jpeg;base64,${(await fotoJpeg(page)).toString("base64")}`;
  const absen = await request.post("/api/absen-guru", {
    headers: auth(t),
    data: { idKlien: `hp-absen-${Date.now()}`, tanggal: hari.data.tanggal, status: "HADIR", lat: -4.0713, lng: 122.0452, akurasi: 10, foto },
  });
  expect(absen.status()).toBe(200);
  const r = await (await request.get("/api/m/riwayat", { headers: auth(t) })).json();
  expect(r.riwayat.some((x: { materi: string }) => x.materi === "Diisi dari aplikasi HP")).toBe(true);
  const lagi = await (await request.get("/api/m/hari-ini", { headers: auth(t) })).json();
  expect(lagi.absenSaya.status).toBe("HADIR");
  expect(lagi.data.jadwal[0].pertemuan.materi).toBe("Diisi dari aplikasi HP");
});

test("kepala: pantauan, jurnal, periksa, kehadiran guru, dan foto", async ({ request }) => {
  const t = await token(request, "kepala");
  const p = await (await request.get("/api/m/pantauan", { headers: auth(t) })).json();
  expect(p.guru.total).toBeGreaterThan(0);
  const jr = await (await request.get("/api/m/jurnal?status=belum", { headers: auth(t) })).json();
  const target = jr.jurnal.find((x: { materi: string }) => x.materi === "Diisi dari aplikasi HP");
  expect(target).toBeTruthy();
  const periksa = await request.post("/api/m/jurnal", { headers: auth(t), data: { ids: [target.id], catatan: "Dicek dari HP" } });
  expect(periksa.status()).toBe(200);
  const kg = await (await request.get("/api/m/kehadiran-guru", { headers: auth(t) })).json();
  const g = kg.guru.find((x: { absen: { adaFoto: boolean } | null }) => x.absen?.adaFoto);
  const foto = await request.get(`/api/foto/${g.absen.id}`, { headers: auth(t) });
  expect(foto.headers()["content-type"]).toBe("image/jpeg");

  const guru = await token(request, "guru07");
  expect((await request.get("/api/m/pantauan", { headers: auth(guru) })).status()).toBe(403);
});

test("ganti kata sandi membuat token lama tidak berlaku", async ({ request }) => {
  const lama = await token(request, "guru08");
  const res = await request.post("/api/m/sandi", { headers: auth(lama), data: { lama: SANDI, baru: "sandibaru123" } });
  expect(res.status()).toBe(200);
  const baru = (await res.json()).token;
  expect((await request.get("/api/m/saya", { headers: auth(lama) })).status()).toBe(401);
  expect((await request.get("/api/m/saya", { headers: auth(baru) })).status()).toBe(200);
});
