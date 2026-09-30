import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { publicEnv, supabaseConfigured } from "@/lib/env";

const PRIVATE_PREFIXES = ["/portal", "/admin", "/account"];

/**
 * Refreshes the auth session cookie and bounces signed-out visitors away from private
 * areas. This is a convenience layer only — every page, action and route handler still
 * performs its own server-side authorization, and RLS is the final backstop.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isPrivate = PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  // Until Supabase is connected, the portal, admin, and sign-in pages don't exist publicly:
  // every path this middleware matches answers with the site's 404.
  if (!supabaseConfigured()) {
    const url = request.nextUrl.clone();
    url.pathname = "/_hidden-until-supabase";
    url.search = "";
    return NextResponse.rewrite(url, { status: 404 });
  }

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPrivate && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}
