"use client";

import { useEffect } from "react";
import { LAST_INQUIRY_KEY, STORAGE_KEY } from "@/lib/inquiry/steps";

/** Once a form is sent, forget the in-progress answers kept for this tab. */
export function ClearSavedProgress({ storageKey = STORAGE_KEY, briefDone = false }: { storageKey?: string; briefDone?: boolean }) {
  useEffect(() => {
    try {
      sessionStorage.removeItem(storageKey);
      if (briefDone) {
        const last = JSON.parse(sessionStorage.getItem(LAST_INQUIRY_KEY) ?? "null");
        if (last) sessionStorage.setItem(LAST_INQUIRY_KEY, JSON.stringify({ ...last, briefDone: true }));
      }
    } catch { /* ignore */ }
  }, [storageKey, briefDone]);
  return null;
}
