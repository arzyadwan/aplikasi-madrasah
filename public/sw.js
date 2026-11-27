/* Service worker Aplikasi Madrasah: halaman guru tetap bisa dibuka saat offline. */
const VERSI = "v1";
const CACHE_HALAMAN = `halaman-${VERSI}`;
const CACHE_STATIS = `statis-${VERSI}`;
const HALAMAN_GURU = ["/guru", "/guru/absen", "/guru/isi"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE_HALAMAN && n !== CACHE_STATIS).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "hapus-cache") {
    e.waitUntil(caches.keys().then((k) => Promise.all(k.map((n) => caches.delete(n)))));
  }
});

const HTML_OFFLINE = `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title><body style="font-family:system-ui;padding:2rem;color:#334155">
<h1 style="font-size:1.25rem">Tidak ada internet</h1>
<p>Halaman ini belum pernah dibuka saat online, jadi belum tersimpan di HP.</p>
<p><a href="/guru">Buka jadwal hari ini</a></p></body></html>`;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Aset statis Next.js dan ikon: ambil dari cache dulu
  if (url.pathname.startsWith("/_next/static/") || /^\/(ikon-|apple-touch-icon)/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((res) => {
        if (res.ok) { const salin = res.clone(); caches.open(CACHE_STATIS).then((x) => x.put(req, salin)); }
        return res;
      })),
    );
    return;
  }

  if (req.mode !== "navigate") return;
  const halamanGuru = HALAMAN_GURU.includes(url.pathname);
  const kunci = url.origin + url.pathname; // /guru/isi?jadwal=... disimpan tanpa query

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (halamanGuru && res.ok && !res.redirected) {
          const salin = res.clone();
          caches.open(CACHE_HALAMAN).then((x) => x.put(kunci, salin));
        }
        return res;
      })
      .catch(async () => {
        const c = (await caches.match(kunci)) || (halamanGuru ? null : await caches.match(url.origin + "/guru"));
        return c || new Response(HTML_OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }),
  );
});
