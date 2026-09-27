"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initEnhancements } from "./enhancements";

/** Re-runs the ported main.js behaviours on every client-side navigation. */
export function Enhance() {
  const pathname = usePathname();
  useEffect(() => initEnhancements(), [pathname]);
  return null;
}
