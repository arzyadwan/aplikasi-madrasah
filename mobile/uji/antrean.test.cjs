const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Jalankan modul asli dengan penyimpanan dan transport dalam memori.
function perangkat(awal, server) {
  const db = new Map([["antrean_v1", structuredClone(awal)]]);
  class GalatServer extends Error {
    constructor(status, pesan) { super(pesan); this.status = status; }
  }
  class GalatJaringan extends Error {}
  const modul = {
    "expo-crypto": require("node:crypto"),
    react: { useSyncExternalStore: (_, baca) => baca() },
    "./api": { GalatServer, GalatJaringan, minta: (...args) => server(GalatServer, ...args) },
    "./penyimpanan": {
      bacaJson: async k => structuredClone(db.get(k)),
      simpanJson: async (k, v) => db.set(k, structuredClone(v)),
    },
  };
  const sumber = fs.readFileSync(path.join(__dirname, "../src/lib/antrean.ts"), "utf8");
  const js = ts.transpileModule(sumber, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const api = {};
  new Function("require", "exports", js.outputText)(k => modul[k], api);
  return { api, db };
}
const lama = { id: "id-lama", path: "/api/pertemuan", label: "IPA", dibuat: "2026-11-27",
  body: { idKlien: "id-klien-lama", jadwalId: "ipa", tanggal: "2026-11-27", diisiDiPerangkat: "2026-11-27T01:00:00Z", materi: "awal" } };

test("koreksi entri 1.0.1 mempertahankan identitas, waktu, dan payload server", async () => {
  let status = 503;
  let kiriman;
  const { api, db } = perangkat([lama], (Galat, _, { body }) => {
    kiriman = body;
    if (status) throw new Galat(status, "alasan server");
    return { ok: true };
  });
  const hasil = await api.kirimAtauAntre(lama.path, { ...lama.body, idKlien: "baru", materi: "koreksi" }, lama.label, lama.id);
  assert.equal(hasil.status, "diantre");
  assert.equal(db.get("antrean_v1").length, 1);
  assert.deepEqual(kiriman, { ...lama.body, materi: "koreksi" });
  status = 422;
  await api.sinkronkan();
  assert.equal(api.isiAntrean()[0].galat, "alasan server");
  status = 0;
  await api.sinkronkan();
  assert.equal(api.isiAntrean().length, 1);
  await api.kirimAtauAntre(lama.path, kiriman, lama.label, lama.id);
  assert.equal(api.isiAntrean().length, 0);
});

test("bukti absen bertahan dan buang hanya menghapus isian terpilih", async () => {
  const gagal = { ...lama, galat: "ditolak" };
  const absen = { ...lama, id: "absen", path: "/api/absen-guru" };
  const { api, db } = perangkat([gagal, absen, { ...gagal, id: "lain" }], () => ({ ok: true }));
  await api.muatAntrean();
  await Promise.all([api.sinkronkan(), api.hapusDariAntrean("lain")]);
  assert.equal(db.get("bukti_absen_v1"), absen.body.tanggal);
  assert.deepEqual(db.get("antrean_v1"), [gagal]);
});

test("koreksi dengan respons idempoten tidak dilaporkan terkirim", async () => {
  const { api } = perangkat([lama], () => ({ ok: true, ulang: true }));
  const hasil = await api.kirimAtauAntre(lama.path, { ...lama.body, materi: "baru" }, lama.label, lama.id);
  assert.equal(hasil.status, "ditolak");
  assert.equal(api.isiAntrean()[0].body.materi, "baru");
  assert.notEqual(api.isiAntrean()[0].body.idKlien, lama.body.idKlien);
});

test("sesi kedaluwarsa mempertahankan antrean hanya untuk akun semula", async () => {
  const { api } = perangkat([lama], Galat => { throw new Galat(401, "Sesi berakhir."); });
  await api.muatAntrean();
  await api.sinkronkan();
  assert.equal(api.isiAntrean()[0].galat, undefined);
  await api.titipAntrean("akun-satu");
  await api.pulihkanAntrean("akun-dua");
  assert.equal(api.isiAntrean().length, 0);
  await api.pulihkanAntrean("akun-satu");
  assert.deepEqual(api.isiAntrean()[0].body, lama.body);
});
