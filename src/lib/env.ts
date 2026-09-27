/**
 * Environment access. Public values (NEXT_PUBLIC_*) are safe in the browser bundle;
 * everything read through `serverEnv` must only be imported from server code.
 */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
};

export function supabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

/** The production canonical host. Never the .com — that domain belongs to someone else. */
export const CANONICAL_ORIGIN = "https://www.merakicreative.co";
