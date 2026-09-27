import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Append-only audit trail. Manual status changes must pass a reason. */
export async function audit(entry: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  projectId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  source: "manual" | "provider" | "system" | "client";
}) {
  const { error } = await createAdminClient().from("audit_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    project_id: entry.projectId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
    source: entry.source,
  });
  if (error) console.error("[audit] failed to record", entry.action, error);
}
