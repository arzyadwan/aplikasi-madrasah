// Uji tampilan aplikasi HP lewat versi web.
// Menyajikan hasil ekspor web aplikasi HP dan meneruskan /api ke server Next.js (asal yang sama, tanpa CORS)
const http = require("http"), fs = require("fs"), path = require("path");
const DIR = process.argv[2], TUJUAN = Number(process.argv[3] || 3100), PORT = Number(process.argv[4] || 8090);
const MIME = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".ttf": "font/ttf" };
http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    const p = http.request({ host: "127.0.0.1", port: TUJUAN, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    p.on("error", () => { res.writeHead(502); res.end(); });
    req.pipe(p);
    return;
  }
  let f = path.join(DIR, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIR, "index.html");
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, "127.0.0.1");
