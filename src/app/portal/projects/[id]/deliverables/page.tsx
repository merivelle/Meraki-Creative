import { requireProjectAccess } from "@/lib/auth/guards";
import { fmtDateTime } from "@/lib/labels";

export default async function DeliverablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProjectAccess(id, "page");
  const [{ data: project }, { data: items }] = await Promise.all([
    supabase.from("projects").select("handoff_instructions").eq("id", id).single(),
    supabase.from("deliverables").select("id, title, description, file_id, url, published_at").eq("project_id", id).order("published_at"),
  ]);

  return (
    <>
      <h2>Deliverables and handoff</h2>
      {!items?.length && <p className="muted-note">Final files will appear here when they&apos;re ready.</p>}
      <ul className="timeline">
        {(items ?? []).map((d) => (
          <li key={d.id}>
            <b>{d.title}</b> <span className="muted-note">· {fmtDateTime(d.published_at)}</span>
            {d.description && <p style={{ whiteSpace: "pre-wrap" }}>{d.description}</p>}
            <p className="btn-group" style={{ marginTop: "0.4rem" }}>
              {d.file_id && <a className="btn btn-secondary btn-small" href={`/api/files/${d.file_id}`}>Download</a>}
              {d.url && <a className="btn btn-secondary btn-small" href={d.url} target="_blank" rel="noopener noreferrer">Open link</a>}
            </p>
          </li>
        ))}
      </ul>
      {project?.handoff_instructions && (
        <div className="panel" style={{ marginTop: "1.4rem" }}>
          <h3>Handoff notes</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{project.handoff_instructions}</p>
        </div>
      )}
      <p className="muted-note" style={{ marginTop: "1rem" }}>Download links are private and expire a few minutes after you click them. Come back here any time for a fresh one.</p>
    </>
  );
}
