"use client";

import { useEffect } from "react";
import { STORAGE_KEY } from "@/lib/inquiry/steps";

/** Once an inquiry is sent, forget the in-progress answers kept for this tab. */
export function ClearSavedProgress() {
  useEffect(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);
  return null;
}
