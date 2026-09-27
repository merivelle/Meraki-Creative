import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only run where a session matters. Public marketing pages stay fully static.
  matcher: ["/portal/:path*", "/admin/:path*", "/account/:path*", "/login", "/auth/:path*", "/invite/:path*"],
};
