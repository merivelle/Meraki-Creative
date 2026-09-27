import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export type Session = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email: string };
  isStaff: boolean;
};

/**
 * Resolve the signed-in user from the auth server (getUser re-validates the JWT; never
 * trust getSession() alone on the server). Staff status comes from the staff_roles table
 * through the is_staff() database function — never from user-editable metadata.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isStaff } = await supabase.rpc("is_staff");
  return { supabase, user: { id: user.id, email: user.email ?? "" }, isStaff: isStaff === true };
});

/** For pages: redirect to /login when signed out. */
export async function requireUser(nextPath?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  return session;
}

/** For admin pages: signed-out → /login, signed-in non-staff → 404 (don't reveal the area). */
export async function requireStaffPage(): Promise<Session> {
  const session = await requireUser("/admin");
  if (!session.isStaff) notFound();
  return session;
}

/** For admin server actions and route handlers: throws instead of redirecting. */
export async function requireStaff(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.isStaff) throw new AuthorizationError();
  return session;
}

/** For server actions: any signed-in user. */
export async function requireSignedIn(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthorizationError("Please sign in again.");
  return session;
}

/**
 * Confirms the current user can see this project. The lookup runs as the user, so RLS
 * decides: staff see every project, clients only projects they are a member of.
 * Pages get a 404 for projects they can't see, rather than a hint that it exists.
 */
export async function requireProjectAccess(projectId: string, mode: "page" | "action" = "action") {
  const session = mode === "page" ? await requireUser() : await requireSignedIn();
  if (!isUuid(projectId)) {
    if (mode === "page") notFound();
    throw new AuthorizationError();
  }
  const { data: project } = await session.supabase
    .from("projects")
    .select("id, client_id, title, service_category, stage, state")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    if (mode === "page") notFound();
    throw new AuthorizationError();
  }
  return { ...session, project };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
