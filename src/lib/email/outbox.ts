import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./send";
import type { EmailContent } from "./templates";

export type NotificationInput = {
  /** Unique per logical event + recipient. A repeated key is ignored, so no duplicates. */
  dedupeKey: string;
  type: string;
  audience: "client" | "studio" | "visitor";
  title: string;
  body?: string;
  linkPath?: string;
  projectId?: string | null;
  recipientUserId?: string | null;
  recipientEmail?: string | null;
  payload?: Record<string, unknown>;
  email?: (EmailContent & { template: string; replyTo?: string | null }) | null;
};

/**
 * Record a notification (shown in the portal/admin) and, if it has an email, queue a
 * delivery row. Runs AFTER the business record is saved, and never throws: a failure
 * here must not undo or hide a successful inquiry or submission.
 * Returns delivery ids to hand to `deliver()` (normally inside `after()`).
 */
export async function queueNotifications(items: NotificationInput[], db?: SupabaseClient): Promise<string[]> {
  const deliveryIds: string[] = [];
  let admin: SupabaseClient;
  try {
    admin = db ?? createAdminClient();
  } catch (e) {
    console.error("[outbox] cannot queue notifications:", e);
    return deliveryIds;
  }
  for (const n of items) {
    try {
      const { data: inserted, error } = await admin
        .from("notifications")
        .upsert(
          {
            dedupe_key: n.dedupeKey,
            type: n.type,
            audience: n.audience,
            title: n.title,
            body: n.body ?? null,
            link_path: n.linkPath ?? null,
            project_id: n.projectId ?? null,
            recipient_user_id: n.recipientUserId ?? null,
            recipient_email: n.recipientEmail ?? null,
            payload: n.payload ?? {},
          },
          { onConflict: "dedupe_key", ignoreDuplicates: true },
        )
        .select("id");
      if (error) throw error;
      const notificationId = inserted?.[0]?.id as string | undefined;
      if (!notificationId) continue; // duplicate event — already recorded
      if (n.email && n.recipientEmail) {
        const { data: d, error: e2 } = await admin
          .from("email_deliveries")
          .insert({
            notification_id: notificationId,
            to_email: n.recipientEmail,
            template: n.email.template,
            subject: n.email.subject,
            text_body: n.email.text,
            html_body: n.email.html,
            reply_to: n.email.replyTo ?? null,
          })
          .select("id")
          .single();
        if (e2) throw e2;
        deliveryIds.push(d.id);
      }
    } catch (e) {
      console.error(`[outbox] failed to queue ${n.dedupeKey}:`, e);
    }
  }
  return deliveryIds;
}

/** Attempt delivery of queued emails. Records every attempt and failure. Never throws. */
export async function deliver(deliveryIds: string[], db?: SupabaseClient): Promise<void> {
  if (!deliveryIds.length) return;
  let admin: SupabaseClient;
  try {
    admin = db ?? createAdminClient();
  } catch (e) {
    console.error("[outbox] cannot deliver:", e);
    return;
  }
  for (const id of deliveryIds) {
    try {
      // Claim the row so two workers can't send the same message concurrently.
      const { data: row } = await admin
        .from("email_deliveries")
        .update({ status: "sending", last_attempt_at: new Date().toISOString() })
        .eq("id", id)
        .in("status", ["pending", "failed"])
        .select("id, notification_id, to_email, subject, text_body, html_body, reply_to, attempts")
        .maybeSingle();
      if (!row) continue;

      const result = await sendEmail({
        to: row.to_email,
        subject: row.subject,
        text: row.text_body,
        html: row.html_body,
        replyTo: row.reply_to,
        idempotencyKey: `notification-${row.notification_id}`,
      });
      await admin
        .from("email_deliveries")
        .update({
          status: result.status,
          attempts: row.attempts + 1,
          last_error: result.status === "failed" ? result.error.slice(0, 1000) : null,
          provider_message_id: result.status === "sent" ? result.providerId : null,
        })
        .eq("id", id);
    } catch (e) {
      console.error(`[outbox] delivery ${id} crashed:`, e);
      await admin.from("email_deliveries").update({ status: "failed", last_error: String(e).slice(0, 1000) }).eq("id", id);
    }
  }
}

/** Queue + deliver in one call, for use inside `after()`. */
export async function notify(items: NotificationInput[]): Promise<void> {
  const ids = await queueNotifications(items);
  await deliver(ids);
}

/** Retry failed/stuck deliveries (cron + admin "Retry" button). */
export async function retryFailed(limit = 25, maxAttempts = 5): Promise<number> {
  const admin = createAdminClient();
  const stuckBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("email_deliveries")
    .select("id, status, last_attempt_at")
    .or(`status.eq.failed,status.eq.pending,and(status.eq.sending,last_attempt_at.lt.${stuckBefore})`)
    .lt("attempts", maxAttempts)
    .order("created_at")
    .limit(limit);
  const ids = (data ?? []).map((r) => r.id as string);
  // Release stuck "sending" rows so deliver() can claim them.
  await admin.from("email_deliveries").update({ status: "failed" }).in("id", ids).eq("status", "sending");
  await deliver(ids, admin);
  return ids.length;
}
