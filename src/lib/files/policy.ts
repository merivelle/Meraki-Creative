/** What clients may upload. The storage bucket enforces the same limits as a backstop. */
export const FILE_TYPE_GROUPS: Record<string, { label: string; mimes: string[] }> = {
  images: { label: "Images", mimes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/tiff", "image/svg+xml"] },
  documents: {
    label: "Documents",
    mimes: [
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain", "text/csv", "application/rtf",
    ],
  },
  fonts: { label: "Fonts", mimes: ["font/ttf", "font/otf", "font/woff", "font/woff2"] },
  audio: { label: "Audio", mimes: ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/aac", "audio/mp4"] },
  video_short: { label: "Short video clips", mimes: ["video/mp4", "video/quicktime"] },
  archives: { label: "Zip archives", mimes: ["application/zip"] },
};

export const DEFAULT_MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file unless the request says otherwise
export const HARD_MAX_BYTES = 100 * 1024 * 1024; // bucket limit

export function allowedMimes(groups: string[]): string[] {
  const keys = groups.length ? groups : Object.keys(FILE_TYPE_GROUPS).filter((k) => k !== "video_short");
  return keys.flatMap((k) => FILE_TYPE_GROUPS[k]?.mimes ?? []);
}

export function checkUpload(file: { type: string; size: number }, groups: string[], maxBytes?: number | null): string | null {
  const limit = Math.min(maxBytes ?? DEFAULT_MAX_BYTES, HARD_MAX_BYTES);
  if (!allowedMimes(groups).includes(file.type)) return "That file type isn't accepted here.";
  if (file.size <= 0) return "That file is empty.";
  if (file.size > limit) return `Files here can be up to ${Math.round(limit / 1024 / 1024)} MB. For large footage, add a transfer link instead.`;
  return null;
}

/** Storage object path: projects/{projectId}/{purpose}/{uuid}-{safe-name} */
export function objectPath(projectId: string, purpose: string, id: string, name: string) {
  const safe = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").slice(-80) || "file";
  return `projects/${projectId}/${purpose}/${id}-${safe}`;
}
