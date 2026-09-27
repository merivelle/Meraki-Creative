import { notFound } from "next/navigation";
import { requireProjectAccess, isUuid } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { RemoveNoteButton } from "@/components/app/RemoveNoteButton";
import { fmtDate, fmtDateTime } from "@/lib/labels";
import { formatTimecode } from "@/lib/timecode";
import { addFeedbackItem, saveGeneralNotes, submitFeedback } from "@/app/portal/actions";

const RESOLUTION: Record<string, string> = { open: "Open", in_progress: "In progress", resolved: "Done", wont_change: "Not changing" };

export default async function ReviewVersionPage({ params }: { params: Promise<{ id: string; versionId: string }> }) {
  const { id, versionId } = await params;
  if (!isUuid(versionId)) notFound();
  const { supabase } = await requireProjectAccess(id, "page");
  const { data: v } = await supabase.from("review_versions")
    .select("id, version_no, preview_url, file_id, instructions, due_date, published_at, reviews(title, review_kind)")
    .eq("id", versionId).eq("project_id", id).maybeSingle();
  if (!v) notFound();
  const review = v.reviews as unknown as { title: string; review_kind: "website" | "edit" | "document" };
  const [{ data: state }, { data: set }] = await Promise.all([
    supabase.from("review_version_state").select("is_latest, approval_id").eq("id", v.id).single(),
    supabase.from("feedback_sets").select("id, status, decision, general_notes, submitted_at, submitted_by, profiles:submitted_by(full_name, email)").eq("review_version_id", v.id).maybeSingle(),
  ]);
  const { data: items } = set
    ? await supabase.from("feedback_items").select("*").eq("feedback_set_id", set.id).order("timecode_start_ms", { nullsFirst: true }).order("created_at")
    : { data: [] as never[] };
  const locked = set?.status === "submitted" || !state?.is_latest;
  const isEdit = review.review_kind === "edit";
  const submitter = set?.profiles as unknown as { full_name: string | null; email: string } | null;

  return (
    <>
      <h2>{review.title}: version {v.version_no}</h2>
      <p className="muted-note">Posted {fmtDateTime(v.published_at)}{v.due_date ? ` · notes due ${fmtDate(v.due_date)}` : ""}</p>
      {!state?.is_latest && <p className="notice">A newer version has been posted. This one is kept for reference.</p>}
      {state?.approval_id && <p className="notice">You approved this version.</p>}

      <div className="panel" style={{ margin: "1rem 0" }}>
        <h3>Preview</h3>
        {v.preview_url && <p><a href={v.preview_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small">Open the preview</a></p>}
        {v.file_id && <p><a href={`/api/files/${v.file_id}?inline=1`} target="_blank" rel="noopener" className="btn btn-secondary btn-small">Open the file</a></p>}
        {v.instructions && <p style={{ whiteSpace: "pre-wrap", marginTop: "0.8rem" }}>{v.instructions}</p>}
      </div>

      <h3>Your notes {set?.status === "submitted" && <Badge>Sent</Badge>}</h3>
      {set?.status === "submitted" && (
        <p className="muted-note">
          {set.decision === "approve" ? "Approved" : "Changes requested"} by {submitter?.full_name || submitter?.email} on {fmtDateTime(set.submitted_at)}.
        </p>
      )}
      {items?.length ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Type</th><th>{isEdit ? "Timecode" : "Where"}</th><th>Note</th><th>Studio</th>{!locked && <th />}</tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>{i.kind === "approved_element" ? "Keep" : "Change"}</td>
                  <td>{isEdit
                    ? (i.timecode_start_ms != null ? `${formatTimecode(i.timecode_start_ms)}${i.timecode_end_ms != null ? `–${formatTimecode(i.timecode_end_ms)}` : ""}` : "—")
                    : [i.page, i.section].filter(Boolean).join(" · ") || "—"}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{i.body}</td>
                  <td>{set?.status === "submitted" ? <>{RESOLUTION[i.resolution_status]}{i.resolution_note ? `: ${i.resolution_note}` : ""}</> : "—"}</td>
                  {!locked && <td><RemoveNoteButton versionId={v.id} itemId={i.id} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted-note">No notes yet.</p>}
      {set?.status === "submitted" && set.general_notes && <p style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}><b>General notes:</b> {set.general_notes}</p>}

      {!locked && (
        <>
          <div className="panel" style={{ margin: "1rem 0" }}>
            <h3>Add a note</h3>
            <ActionForm action={addFeedbackItem.bind(null, v.id)} submitLabel="Add note">
              <div className="form-row">
                <div className="field">
                  <label htmlFor="kind">Type</label>
                  <select id="kind" name="kind" defaultValue="change">
                    <option value="change">Something to change</option>
                    <option value="approved_element">Something that works, keep it</option>
                  </select>
                </div>
                {isEdit ? (
                  <div className="form-row">
                    <div className="field"><label htmlFor="tc1">From (e.g. 1:05)</label><input id="tc1" name="timecode_start" inputMode="numeric" /></div>
                    <div className="field"><label htmlFor="tc2">To (optional)</label><input id="tc2" name="timecode_end" inputMode="numeric" /></div>
                  </div>
                ) : (
                  <div className="form-row">
                    <div className="field"><label htmlFor="page">Page</label><input id="page" name="page" placeholder="e.g. Home" /></div>
                    <div className="field"><label htmlFor="section">Section</label><input id="section" name="section" placeholder="e.g. Hero" /></div>
                  </div>
                )}
              </div>
              <div className="field"><label htmlFor="body">Note</label><textarea id="body" name="body" rows={3} required /></div>
            </ActionForm>
          </div>

          <ActionForm action={saveGeneralNotes.bind(null, v.id)} resetOnSuccess={false} submitLabel="Save draft">
            <div className="field"><label htmlFor="general_notes">General notes (optional)</label>
              <textarea id="general_notes" name="general_notes" rows={4} defaultValue={set?.general_notes ?? ""} /></div>
          </ActionForm>

          <div className="panel" style={{ marginTop: "1.4rem" }}>
            <h3>Send your notes</h3>
            <p className="muted-note">Collect everyone&apos;s notes first. Once sent, this round is locked.</p>
            <ActionForm action={submitFeedback.bind(null, v.id)} resetOnSuccess={false}>
              <div className="choice-list" style={{ margin: "0.8rem 0" }}>
                <label className="choice"><input type="radio" name="decision" value="request_changes" defaultChecked /> Send notes and request changes</label>
                <label className="choice"><input type="radio" name="decision" value="approve" /> Approve version {v.version_no} as it is</label>
              </div>
              <label className="choice" style={{ marginBottom: "1rem" }}>
                <input type="checkbox" name="confirm" value="yes" /> If approving: I confirm version {v.version_no} is approved. Later versions will need their own approval.
              </label>
              <button className="btn btn-primary btn-small" type="submit">Send</button>
            </ActionForm>
          </div>
        </>
      )}
    </>
  );
}
