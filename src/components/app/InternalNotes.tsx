import type { SupabaseClient } from "@supabase/supabase-js";
import { ActionForm } from "./ActionForm";
import { fmtDateTime } from "@/lib/labels";
import { addInternalNote } from "@/app/admin/_actions/pipeline";

/** Staff-only notes panel. Stored in a separate table clients have no access to. */
export async function InternalNotes({ supabase, entityType, entityId, projectId = null }: {
  supabase: SupabaseClient;
  entityType: "inquiry" | "client" | "project" | "work_request";
  entityId: string;
  projectId?: string | null;
}) {
  const { data: notes } = await supabase.from("internal_notes")
    .select("id, body, created_at, profiles:author_id(full_name, email)")
    .eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false });
  return (
    <section className="panel internal" aria-label="Internal notes">
      <p className="internal-label">Internal · the client can&apos;t see this</p>
      <h2 style={{ marginTop: "0.4rem" }}>Internal notes</h2>
      <ActionForm action={addInternalNote.bind(null, entityType, entityId, projectId)} submitLabel="Add note">
        <div className="field"><label htmlFor={`note-${entityId}`}>New note</label><textarea id={`note-${entityId}`} name="body" rows={3} required /></div>
      </ActionForm>
      {(notes ?? []).map((n) => {
        const a = n.profiles as unknown as { full_name: string | null; email: string } | null;
        return (
          <div className="message" key={n.id}>
            <p className="meta">{a?.full_name || a?.email || "System"} · {fmtDateTime(n.created_at)}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
          </div>
        );
      })}
    </section>
  );
}
