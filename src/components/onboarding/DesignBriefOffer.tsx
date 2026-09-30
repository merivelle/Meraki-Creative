"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LAST_INQUIRY_KEY } from "@/lib/inquiry/steps";

/** Thank-you page: web clients who skipped the design brief get a second chance at it. */
export function DesignBriefOffer() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const last = JSON.parse(sessionStorage.getItem(LAST_INQUIRY_KEY) ?? "null") as { web?: boolean; briefDone?: boolean } | null;
      setShow(Boolean(last?.web && !last.briefDone));
    } catch { /* ignore */ }
  }, []);
  if (!show) return null;
  return (
    <div className="ob-offer">
      <p className="slate">While it&apos;s fresh</p>
      <p className="ob-offer-text">
        Want to tell me more about the design? The look, the pages, the colours. About five minutes, and you can skip anything.
      </p>
      <Link href="/start/design" className="btn btn-primary">Tell me more about the design →</Link>
    </div>
  );
}
