import { test } from "node:test";
import assert from "node:assert/strict";
import { bolehIsi } from "../src/lib/aturan-isi";
import { awalMinggu, akhirBulan, formatTanggal, tanggalLokal } from "../src/lib/waktu";
import { jarakMeter } from "../src/lib/geo";

// Jumat, 27 November 2026 pukul 08.00 WITA
const SEKARANG = new Date("2026-11-27T00:00:00Z");

test("tanggal mengikuti WITA, bukan UTC", () => {
  assert.equal(tanggalLokal(new Date("2026-11-26T16:30:00Z")), "2026-11-27"); // 00.30 WITA
  assert.equal(tanggalLokal(new Date("2026-11-26T15:59:00Z")), "2026-11-26"); // 23.59 WITA
});

test("isian hari ini selalu boleh", () => {
  assert.deepEqual(bolehIsi("2026-11-27", null, 72, SEKARANG), { boleh: true });
});

test("isian untuk tanggal yang belum tiba ditolak", () => {
  assert.equal(bolehIsi("2026-11-28", null, 72, SEKARANG).boleh, false);
});

test("isian hari kemarin tanpa waktu perangkat ditolak", () => {
  assert.equal(bolehIsi("2026-11-26", null, 72, SEKARANG).boleh, false);
});

test("isian offline kemarin yang diisi kemarin dan terkirim hari ini diterima", () => {
  const diisi = new Date("2026-11-26T02:00:00Z"); // 26 Nov 10.00 WITA
  assert.deepEqual(bolehIsi("2026-11-26", diisi, 72, SEKARANG), { boleh: true });
});

test("isian offline yang dibuat di tanggal lain ditolak", () => {
  const diisi = new Date("2026-11-27T01:00:00Z"); // diisi hari ini untuk tanggal kemarin
  assert.equal(bolehIsi("2026-11-26", diisi, 72, SEKARANG).boleh, false);
});

test("isian offline yang terlambat melewati batas ditolak", () => {
  const diisi = new Date("2026-11-22T02:00:00Z");
  const r = bolehIsi("2026-11-22", diisi, 72, SEKARANG);
  assert.equal(r.boleh, false);
});

test("jam HP yang lebih cepat dari server ditolak", () => {
  const diisi = new Date("2026-11-27T03:00:00Z");
  assert.equal(bolehIsi("2026-11-26", diisi, 72, SEKARANG).boleh, false);
});

test("pembantu tanggal", () => {
  assert.equal(awalMinggu("2026-11-27"), "2026-11-23");
  assert.equal(akhirBulan("2026-02-10"), "2026-02-28");
  assert.equal(formatTanggal("2026-11-27"), "Jumat, 27 November 2026");
});

test("jarak GPS", () => {
  const j = jarakMeter(-4.0712, 122.0451, -4.0716, 122.0449);
  assert.ok(j > 40 && j < 60, `jarak ${j}`);
});
