import "server-only";

export type Result = { ok: true; message?: string; id?: string } | { ok: false; error: string };
export const ok = (message?: string, id?: string): Result => ({ ok: true, message, id });
export const fail = (error: string): Result => ({ ok: false, error });

export const str = (fd: FormData, k: string, max = 5000) => String(fd.get(k) ?? "").trim().slice(0, max);
export const optStr = (fd: FormData, k: string, max = 5000) => str(fd, k, max) || null;
export const optDate = (fd: FormData, k: string) => {
  const v = str(fd, k, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
export const lines = (fd: FormData, k: string) =>
  str(fd, k, 20000).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 100);
export function optUrl(fd: FormData, k: string): string | null | "invalid" {
  const v = str(fd, k, 2048);
  if (!v) return null;
  try {
    const u = new URL(/^[a-z]+:/i.test(v) ? v : `https://${v}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "invalid";
  } catch {
    return "invalid";
  }
}
/** "$1,250.50" / "1250.5" → 125050 cents */
export function cents(fd: FormData, k: string): number | null {
  const v = str(fd, k, 30).replace(/[$,\s]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
