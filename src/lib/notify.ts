import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/server-env";
import { deliver, queueNotifications, type NotificationInput } from "@/lib/email/outbox";
import { templates } from "@/lib/email/templates";

/** Studio-facing event: recorded in admin notifications, emailed to STUDIO_NOTIFY_EMAIL if set. */
export async function notifyStudio(e: {
  key: string; type: string; projectId?: string | null; headline: string; detail?: string; path: string;
}) {
  const ids = await queueNotifications([{
    dedupeKey: `studio:${e.key}`,
    type: e.type,
    audience: "studio",
    title: e.headline,
    body: e.detail,
    linkPath: e.path,
    projectId: e.projectId ?? null,
    recipientEmail: serverEnv.studioNotifyEmail || null,
    email: serverEnv.studioNotifyEmail
      ? { template: e.type, ...templates.studioEvent({ headline: e.headline, detail: e.detail, path: e.path }) }
      : null,
  }]);
  await deliver(ids);
}

/**
 * Client-facing event: one notification (+ email) per project member. The dedupe key is
 * per event + member, so re-running an action can't send the same email twice.
 */
export async function notifyProjectMembers(e: {
  key: string; type: string; projectId: string; headline: string; detail?: string; path?: string;
}) {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("project_members")
    .select("user_id, profiles:user_id(email, full_name)")
    .eq("project_id", e.projectId);
  const items: NotificationInput[] = (members ?? []).map((m) => {
    const p = m.profiles as unknown as { email: string; full_name: string | null } | null;
    return {
      dedupeKey: `client:${e.key}:${m.user_id}`,
      type: e.type,
      audience: "client",
      title: e.headline,
      body: e.detail,
      linkPath: e.path ?? `/portal/projects/${e.projectId}`,
      projectId: e.projectId,
      recipientUserId: m.user_id,
      recipientEmail: p?.email ?? null,
      email: p?.email
        ? { template: e.type, ...templates.projectEvent({ name: p.full_name || "there", headline: e.headline, detail: e.detail, projectId: e.projectId, path: e.path }) }
        : null,
    };
  });
  const ids = await queueNotifications(items, admin);
  await deliver(ids, admin);
}
