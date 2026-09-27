import { createClient } from "@supabase/supabase-js";
import { publicEnv, supabaseConfigured } from "@/lib/env";

/** Anonymous, cookie-free client for reading published public content (cacheable). */
export function createPublicClient() {
  if (!supabaseConfigured()) return null;
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
