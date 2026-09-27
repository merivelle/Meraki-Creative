import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { Badge } from "@/components/app/AppShell";
import { StaffFileField } from "@/components/app/StaffFileField";
import { fmtDateTime } from "@/lib/labels";
import { addDeliverable, publishDeliverables } from "@/app/admin/_actions/projects";

export default async function AdminDeliverablesTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const { data: items } = await supabase.from("deliverables").select("*").eq("project_id", id).order("created_at");
  const drafts = (items ?? []).filter((d) => d.status === "draft").length;
  return (
    <>
      <ul className="timeline">
        {(items ?? []).map((d) => (
          <li key={d.id}><b>{d.title}</b> <Badge attention={d.status === "draft"}>{d.status}</Badge> {d.published_at && <span className="muted-note">{fmtDateTime(d.published_at)}</span>}
            {" "}{d.file_id && <a href={`/api/files/${d.file_id}`} className="txt-link">file</a>} {d.url && <a href={d.url} className="txt-link" target="_blank" rel="noopener noreferrer">link</a>}</li>
        ))}
      </ul>
      {drafts > 0 && <p><ActionButton variant="primary" action={publishDeliverables.bind(null, id)} confirmText="Release all draft deliverables to the client and notify them?">Release {drafts} draft{drafts === 1 ? "" : "s"} to the client</ActionButton></p>}
      <h2>Add a deliverable</h2>
      <p className="muted-note">Large final files: share a transfer link instead of uploading. Handoff instructions live on the Overview tab.</p>
      <ActionForm action={addDeliverable.bind(null, id)} submitLabel="Add as draft">
        <div className="field"><label htmlFor="d-title">Title</label><input id="d-title" name="title" required /></div>
        <div className="field"><label htmlFor="d-desc">Description</label><textarea id="d-desc" name="description" rows={2} /></div>
        <div className="field"><label htmlFor="d-url">Link</label><input id="d-url" name="url" type="url" /></div>
        <StaffFileField projectId={id} purpose="deliverable" label="Or upload a file" />
      </ActionForm>
    </>
  );
}
