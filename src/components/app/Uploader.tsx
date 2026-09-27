"use client";

/**
 * Two-step upload: ask the server for a signed upload token (it checks access, type and
 * size), upload straight to private storage, then confirm with the server.
 */
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export type PrepareResult = { fileId: string; path: string; token: string } | { error: string };
export type CompleteResult = { ok: true } | { error: string };

export function Uploader({ prepare, complete, accept, label = "Upload a file", onDone }: {
  prepare: (meta: { name: string; type: string; size: number }) => Promise<PrepareResult>;
  complete: (fileId: string) => Promise<CompleteResult>;
  accept?: string;
  label?: string;
  onDone?: () => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    setBusy(true);
    setStatus(`Uploading ${file.name}…`);
    try {
      const prep = await prepare({ name: file.name, type: file.type || "application/octet-stream", size: file.size });
      if ("error" in prep) { setStatus(prep.error); return; }
      const supabase = createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
      const { error } = await supabase.storage.from("project-files").uploadToSignedUrl(prep.path, prep.token, file, {
        contentType: file.type,
      });
      if (error) { setStatus("The upload didn't go through. Please try again."); return; }
      const done = await complete(prep.fileId);
      if ("error" in done) { setStatus(done.error); return; }
      setStatus(`${file.name} uploaded.`);
      onDone?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field" style={{ marginBottom: "0.8rem" }}>
      <label className="btn btn-secondary btn-small" style={{ display: "inline-block", cursor: busy ? "wait" : "pointer" }}>
        {label}
        <input type="file" onChange={onChange} accept={accept} disabled={busy} className="visually-hidden" />
      </label>
      {status && <p className="muted-note" role="status" style={{ marginTop: "0.4rem" }}>{status}</p>}
    </div>
  );
}
