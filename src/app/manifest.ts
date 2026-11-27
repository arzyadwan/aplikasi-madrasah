import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aplikasi Madrasah",
    short_name: "Madrasah",
    description: "Kehadiran dan jurnal mengajar madrasah",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#18734f",
    lang: "id",
    icons: [
      { src: "/ikon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/ikon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
