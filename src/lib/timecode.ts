/**
 * Parse editing timecodes typed by clients into milliseconds.
 * Accepts  ss · mm:ss · hh:mm:ss · hh:mm:ss:ff (frames, default 24 fps) · optional .fraction
 */
export function parseTimecode(input: string, fps = 24): number | null {
  const s = input.trim();
  if (!s) return null;
  if (!/^\d{1,3}(:\d{1,2}){0,3}(\.\d{1,3})?$/.test(s)) return null;
  const [main, frac] = s.split(".");
  const parts = main.split(":").map(Number);
  let h = 0, m = 0, sec = 0, frames = 0;
  if (parts.length === 1) [sec] = parts;
  else if (parts.length === 2) [m, sec] = parts;
  else if (parts.length === 3) [h, m, sec] = parts;
  else [h, m, sec, frames] = parts;
  if (parts.length > 1 && (sec >= 60 || m >= 60)) return null;
  if (frames >= fps) return null;
  const fracMs = frac ? Math.round(Number(`0.${frac}`) * 1000) : 0;
  return ((h * 60 + m) * 60 + sec) * 1000 + Math.round((frames / fps) * 1000) + fracMs;
}

export function formatTimecode(ms: number | null | undefined): string {
  if (ms == null) return "";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
