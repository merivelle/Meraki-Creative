"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Button that runs a (pre-bound) server action, with optional confirmation. */
export function ActionButton({ action, children, confirmText, variant = "secondary" }: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  confirmText?: string;
  variant?: "primary" | "secondary" | "link";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const cls = variant === "link" ? "txt-link" : `btn btn-${variant} btn-small`;
  return (
    <span>
      <button
        type="button"
        className={cls}
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            const r = await action();
            setMsg(r.ok ? (r.message ? { text: r.message, error: false } : null) : { text: r.error, error: true });
            router.refresh();
          });
        }}
      >
        {children}
      </button>
      {msg && <span role="status" className={msg.error ? "field-error" : "muted-note"} style={{ marginLeft: "0.5rem" }}>{msg.text}</span>}
    </span>
  );
}
