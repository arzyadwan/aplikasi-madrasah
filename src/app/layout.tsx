import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DaftarkanSW } from "@/components/daftarkan-sw";

export const metadata: Metadata = {
  title: { default: "Aplikasi Madrasah", template: "%s · Aplikasi Madrasah" },
  description: "Kehadiran dan jurnal mengajar madrasah",
  applicationName: "Aplikasi Madrasah",
  appleWebApp: { capable: true, title: "Madrasah", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/ikon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#18734f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full">
        {children}
        <DaftarkanSW />
      </body>
    </html>
  );
}
