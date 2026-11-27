"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { href: string; label: string };

export function NavAplikasi({ item }: { item: ItemNav[] }) {
  const path = usePathname();
  const aktif = (href: string) => {
    // pilih item dengan awalan terpanjang yang cocok
    const cocok = item.filter((i) => path === i.href || path.startsWith(i.href + "/"));
    const terbaik = cocok.sort((a, b) => b.href.length - a.href.length)[0];
    return terbaik?.href === href;
  };
  return (
    <nav className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1 whitespace-nowrap">
        {item.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                aktif(i.href) ? "bg-white/20 text-white" : "text-utama-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
