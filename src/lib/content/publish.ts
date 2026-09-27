import "server-only";
import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ENTITIES, type EntityType } from "./entities";
import { CONTENT_TAG } from "./queries";

/** Snapshot the working row into published_content and mark it published. */
export async function publishEntity(db: SupabaseClient, type: EntityType, id: string, userId: string | null) {
  const cfg = ENTITIES[type];
  const { data: row, error } = await db.from(cfg.table).select("*").eq("id", id).single();
  if (error || !row) throw new Error("Not found.");
  const now = new Date().toISOString();
  const data = cfg.map(row as Record<string, unknown>);
  const { error: e2 } = await db.from("published_content").upsert({
    entity_type: type, entity_id: id, slug: cfg.slugCol ? (row as Record<string, string>)[cfg.slugCol] : null,
    sort: (row as { sort?: number }).sort ?? 0, data, published_at: now,
  });
  if (e2) throw new Error(e2.message);
  await db.from(cfg.table).update({ status: "published", published_at: now, updated_by: userId }).eq("id", id);
  revalidateTag(CONTENT_TAG);
}

/** Remove from the public site. `archive` keeps the row; otherwise it returns to draft. */
export async function unpublishEntity(db: SupabaseClient, type: EntityType, id: string, archive: boolean) {
  const cfg = ENTITIES[type];
  await db.from("published_content").delete().eq("entity_type", type).eq("entity_id", id);
  await db.from(cfg.table).update({ status: archive ? "archived" : "draft" }).eq("id", id);
  revalidateTag(CONTENT_TAG);
}
