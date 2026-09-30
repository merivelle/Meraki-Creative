import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { serverEnv } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

/** Hash the client IP with a server-side salt. Raw IPs are never stored. */
export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  return createHash("sha256").update(`${serverEnv.ipHashSalt || "dev-salt"}:${ip}`).digest("hex").slice(0, 32);
}

export async function userAgent(): Promise<string> {
  return ((await headers()).get("user-agent") ?? "").slice(0, 300);
}

const secret = () => serverEnv.formSigningSecret || "dev-only-form-secret";

/** Signed "form rendered at" token. Submissions faster than MIN_FILL_MS are treated as bots. */
export function issueFormToken(now = Date.now()): string {
  const ts = String(now);
  const sig = createHmac("sha256", secret()).update(ts).digest("hex").slice(0, 32);
  return `${ts}.${sig}`;
}

export const MIN_FILL_MS = 3000;
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

export function checkFormToken(token: string | null, now = Date.now()): "ok" | "too_fast" | "invalid" {
  if (!token) return "invalid";
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return "invalid";
  const expected = createHmac("sha256", secret()).update(ts).digest("hex").slice(0, 32);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "invalid";
  const age = now - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return "invalid";
  if (age < MIN_FILL_MS) return "too_fast";
  return "ok";
}

/** Returns true when allowed. Fails open (with a log) if the database is unreachable. */
export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  // Email-only mode (no database yet): nothing to count against, so allow quietly.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.supabaseServiceRoleKey) return true;
  try {
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) throw error;
    return data === true;
  } catch (e) {
    console.error("[rate-limit] check failed, allowing:", e);
    return true;
  }
}

/** Cloudflare Turnstile. Only enforced when both keys are configured. */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!serverEnv.turnstileSecretKey || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: serverEnv.turnstileSecretKey, response: token }),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json()) as { success?: boolean };
    return body.success === true;
  } catch {
    return false;
  }
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
