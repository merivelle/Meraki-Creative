import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";

/**
 * Service-role client. BYPASSES row-level security.
 * Only call it after an explicit authorization check (requireStaff / requireProjectAccess)
 * or for public intake that has been validated and rate-limited. Never import from a
 * client component (the "server-only" import enforces this at build time).
 */
export function createAdminClient() {
  if (!publicEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error("Supabase service role is not configured (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
