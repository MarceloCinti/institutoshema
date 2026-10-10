"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideNav({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="card !p-3 lg:sticky lg:top-24">
      <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-gold-700">{title}</p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((i) => {
          const active = i.href === path || (i.href.split("/").length > 2 && path.startsWith(i.href));
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-navy-800 text-white" : "text-gray-700 hover:bg-navy-50"
                }`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
