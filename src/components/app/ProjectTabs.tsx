"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // Longest matching prefix wins, so nested pages highlight their section.
  const active = tabs.filter((t) => pathname === t.href || pathname.startsWith(t.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="tabs" aria-label="Project sections">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={active === t.href ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
