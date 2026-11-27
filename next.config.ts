import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aplikasi ini seluruhnya butuh login, jadi semua halaman dirender per permintaan.
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "exceljs"],
  experimental: {
    serverActions: {
      // foto selfie dikirim lewat route handler, bukan server action
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
