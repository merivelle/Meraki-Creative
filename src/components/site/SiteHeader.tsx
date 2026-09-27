"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PRIMARY_NAV } from "@/lib/site";

export function SiteHeader({ status }: { status: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <header className="site-header">
      <div className="strip">
        <div className="wrap">
          <span><b>MERAKI CREATIVE</b></span>
          <span className="sep">/</span>
          <span>A creative studio for storytellers</span>
          <span className="sep hide-sm">/</span>
          <span className="hide-sm">Status: <b>{status}</b></span>
        </div>
      </div>
      <div className="nav-bar">
        <div className="wrap nav">
          <Link href="/" className="brand">Meraki Creative<span className="dot">.</span></Link>
          <button className="nav-toggle" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav className={`nav-links${open ? " open" : ""}`} id="nav-links" aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
