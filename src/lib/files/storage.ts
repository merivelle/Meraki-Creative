import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUpload, objectPath } from "./policy";

export const BUCKET = "project-files";
export const SIGNED_URL_SECONDS = 300;

export type FilePurpose = "asset" | "review" | "deliverable" | "document" | "attachment";

/**
 * Step 1 of an upload. The CALLER MUST have authorized the user for the project already.
 * Validates type/size, records a pending `files` row, and returns a one-time signed upload
 * token for that exact path. The browser uploads straight to private storage (no size
 * limits from the app server), then calls `completeUpload`.
 */
export async function prepareUpload(opts: {
  projectId: string;
  name: string;
  type: string;
  size: number;
  purpose: FilePurpose;
  uploadedBy: string;
  visibility: "project" | "staff";
  acceptedTypes?: string[];
  maxBytes?: number | null;
}): Promise<{ fileId: string; path: string; token: string } | { error: string }> {
  const problem = checkUpload({ type: opts.type, size: opts.size }, opts.acceptedTypes ?? [], opts.maxBytes);
  if (problem) return { error: problem };
  const admin = createAdminClient();
  const id = randomUUID();
  const path = objectPath(opts.projectId, opts.purpose, id, opts.name);

  const { error: rowErr } = await admin.from("files").insert({
    id, project_id: opts.projectId, bucket: BUCKET, path, original_name: opts.name.slice(0, 255),
    mime_type: opts.type, size_bytes: opts.size, purpose: opts.purpose,
    visibility: opts.visibility, uploaded_by: opts.uploadedBy, upload_status: "pending",
  });
  if (rowErr) return { error: "Could not start the upload." };

  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: "Could not start the upload." };
  return { fileId: id, path, token: data.token };
}

/**
 * Step 2. Confirms the object really exists and matches what was declared, then marks the
 * file complete. The caller must re-authorize (the file's project must be accessible).
 */
export async function completeUpload(fileId: string, uploadedBy: string): Promise<{ ok: true; projectId: string } | { error: string }> {
  const admin = createAdminClient();
  const { data: file } = await admin.from("files")
    .select("id, project_id, path, size_bytes, mime_type, uploaded_by, upload_status")
    .eq("id", fileId).maybeSingle();
  if (!file || file.uploaded_by !== uploadedBy) return { error: "Upload not found." };
  if (file.upload_status === "complete") return { ok: true, projectId: file.project_id };

  const folder = file.path.slice(0, file.path.lastIndexOf("/"));
  const name = file.path.slice(file.path.lastIndexOf("/") + 1);
  const { data: listed } = await admin.storage.from(BUCKET).list(folder, { search: name, limit: 5 });
  const obj = listed?.find((o) => o.name === name);
  const meta = (obj?.metadata ?? {}) as { size?: number; mimetype?: string };
  if (!obj || (meta.size && file.size_bytes && Math.abs(meta.size - file.size_bytes) > 0)) {
    await admin.storage.from(BUCKET).remove([file.path]);
    await admin.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", fileId);
    return { error: "The upload didn't complete. Please try again." };
  }
  await admin.from("files").update({ upload_status: "complete" }).eq("id", fileId);
  return { ok: true, projectId: file.project_id };
}

/** Short-lived download URL. Callers must authorize first (see /api/files/[id]). */
export async function signedDownloadUrl(path: string, downloadName?: string): Promise<string | null> {
  const { data, error } = await createAdminClient().storage.from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS, downloadName ? { download: downloadName } : undefined);
  return error ? null : data.signedUrl;
}
