import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sha256 } from "@/lib/security/abuse";
import { publicEnv } from "@/lib/env";
import { templates } from "@/lib/email/templates";
import { deliver, queueNotifications } from "@/lib/email/outbox";
import { fmtDate } from "@/lib/labels";

const INVITE_DAYS = 14;

/**
 * Create (or re-create) an invitation for one email to one client (+ optional project).
 * The auth user is created up front WITHOUT a password and unconfirmed, so the invitation
 * is bound to a specific user id. Nothing is granted until the invitee opens the emailed
 * link and accepts — and acceptance is checked against that user id.
 */
export async function createInvitation(opts: {
  email: string;
  name: string;
  clientId: string;
  projectId: string | null;
  createdBy: string;
}): Promise<{ invitationId: string; link: string; emailQueued: boolean }> {
  const admin = createAdminClient();
  const email = opts.email.trim().toLowerCase();

  // Reuse an existing account for this email, otherwise create one (public sign-up is off).
  const { data: existing } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
  let userId = existing?.id as string | undefined;
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { full_name: opts.name }, // display only; never used for authorization
    });
    if (error || !data.user) throw new Error(`Could not create the client account: ${error?.message}`);
    userId = data.user.id;
  }

  // Any older unused invitation for the same person + project stops working.
  let q = admin.from("invitations").update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId).eq("client_id", opts.clientId).is("accepted_at", null).is("revoked_at", null);
  q = opts.projectId ? q.eq("project_id", opts.projectId) : q.is("project_id", null);
  await q;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400_000).toISOString();
  const { data: inv, error } = await admin
    .from("invitations")
    .insert({
      email, client_id: opts.clientId, project_id: opts.projectId, user_id: userId,
      token_hash: sha256(token), expires_at: expiresAt, created_by: opts.createdBy,
    })
    .select("id")
    .single();
  if (error || !inv) throw new Error(`Could not save the invitation: ${error?.message}`);

  await admin.from("audit_log").insert({
    actor_id: opts.createdBy, action: "invitation.created", entity_type: "invitation", entity_id: inv.id,
    project_id: opts.projectId, source: "manual", after: { email, client_id: opts.clientId },
  });

  const link = `${publicEnv.siteUrl}/invite/${token}`;
  let projectTitle: string | null = null;
  if (opts.projectId) {
    const { data: p } = await admin.from("projects").select("title").eq("id", opts.projectId).single();
    projectTitle = p?.title ?? null;
  }
  const ids = await queueNotifications([{
    dedupeKey: `invitation:${inv.id}`,
    type: "invitation.sent",
    audience: "client",
    title: "Portal invitation",
    projectId: opts.projectId,
    recipientUserId: userId,
    recipientEmail: email,
    email: { template: "invitation", ...templates.invitation({ name: opts.name, projectTitle, link, expiresAt: fmtDate(expiresAt) }) },
  }], admin);
  await deliver(ids, admin);
  return { invitationId: inv.id, link, emailQueued: ids.length > 0 };
}

export type InvitationLookup =
  | { ok: true; id: string; email: string; projectTitle: string | null; clientName: string }
  | { ok: false; reason: "not_found" | "expired" | "used" | "revoked" };

export async function lookupInvitation(token: string): Promise<InvitationLookup> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { ok: false, reason: "not_found" };
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invitations")
    .select("id, email, expires_at, accepted_at, revoked_at, projects(title), clients(display_name)")
    .eq("token_hash", sha256(token))
    .maybeSingle();
  if (!inv) return { ok: false, reason: "not_found" };
  if (inv.revoked_at) return { ok: false, reason: "revoked" };
  if (inv.accepted_at) return { ok: false, reason: "used" };
  if (new Date(inv.expires_at) < new Date()) return { ok: false, reason: "expired" };
  const project = inv.projects as unknown as { title: string } | null;
  const client = inv.clients as unknown as { display_name: string } | null;
  return { ok: true, id: inv.id, email: inv.email, projectTitle: project?.title ?? null, clientName: client?.display_name ?? "" };
}

/**
 * Accept: sign the invitee in as THEIR OWN account (via a one-time magic-link token the
 * server generates for the invited email), then grant membership in one transaction that
 * re-checks the token, expiry, revocation, and that the session user is the invited user.
 */
export async function acceptInvitation(token: string): Promise<{ projectId: string | null; needsPassword: boolean }> {
  const lookup = await lookupInvitation(token);
  if (!lookup.ok) throw new Error(lookup.reason);
  const admin = createAdminClient();

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: lookup.email });
  if (linkErr || !link.properties?.hashed_token) throw new Error(`Could not start the session: ${linkErr?.message}`);

  const supabase = await createClient();
  await supabase.auth.signOut(); // never attach the grant to someone else's session
  const { data: verified, error: vErr } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (vErr || !verified.user) throw new Error(`Could not verify the invitation: ${vErr?.message}`);

  const { data: projectId, error } = await admin.rpc("accept_invitation", {
    p_token_hash: sha256(token),
    p_user: verified.user.id,
  });
  if (error) {
    await supabase.auth.signOut();
    throw new Error(error.message);
  }
  const { data: profile } = await admin.from("profiles").select("password_set_at").eq("id", verified.user.id).single();
  return { projectId: (projectId as string | null) ?? null, needsPassword: !profile?.password_set_at };
}
