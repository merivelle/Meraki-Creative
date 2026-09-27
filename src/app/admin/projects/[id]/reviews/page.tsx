import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { Badge } from "@/components/app/AppShell";
import { StaffFileField } from "@/components/app/StaffFileField";
import { fmtDate, fmtDateTime, one } from "@/lib/labels";
import { formatTimecode } from "@/lib/timecode";
import { createReview, publishReviewVersion, resolveFeedbackItem } from "@/app/admin/_actions/projects";

export default async function AdminReviewsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const [{ data: reviews }, { data: milestones }] = await Promise.all([
    supabase.from("reviews").select("id, title, review_kind, milestone_id, milestones(title), review_versions(id, version_no, preview_url, file_id, instructions, due_date, published_at, feedback_sets(id, status, decision, general_notes, submitted_at, profiles:submitted_by(full_name, email), feedback_items(*)), approvals(id, approved_at, statement, profiles:approved_by(full_name, email)))").eq("project_id", id).order("created_at"),
    supabase.from("milestones").select("id, title").eq("project_id", id).order("sort"),
  ]);

  type Item = { id: string; kind: string; page: string | null; section: string | null; timecode_start_ms: number | null; timecode_end_ms: number | null; body: string; resolution_status: string; resolution_note: string | null };
  type FeedbackSet = { id: string; status: string; decision: string | null; general_notes: string | null; submitted_at: string | null; profiles: { full_name: string | null; email: string } | null; feedback_items: Item[] };
  type Approval = { id: string; approved_at: string; statement: string; profiles: { full_name: string | null; email: string } };
  type Version = { id: string; version_no: number; preview_url: string | null; file_id: string | null; instructions: string | null; due_date: string | null; published_at: string;
    feedback_sets: unknown; approvals: unknown };

  return (
    <>
      {(reviews ?? []).map((r) => {
        const versions = ((r.review_versions ?? []) as unknown as Version[]).sort((a, b) => b.version_no - a.version_no);
        return (
          <section className="panel" key={r.id} style={{ marginBottom: "1.4rem" }}>
            <h2>{r.title} <span className="muted-note">· {r.review_kind}{r.milestones ? ` · milestone: ${(r.milestones as unknown as { title: string }).title}` : ""}</span></h2>

            <details style={{ margin: "0.6rem 0 1rem" }}>
              <summary className="txt-link">Publish version {(versions[0]?.version_no ?? 0) + 1}</summary>
              <ActionForm action={publishReviewVersion.bind(null, id, r.id)} submitLabel="Publish and notify client">
                <div className="field"><label htmlFor={`pv-${r.id}`}>Preview link (site preview, Frame.io, Vimeo review…)</label><input id={`pv-${r.id}`} name="preview_url" type="url" /></div>
                <StaffFileField projectId={id} purpose="review" label="Or upload a file (PDF, image, short clip)" />
                <div className="field"><label htmlFor={`in-${r.id}`}>Instructions for the client</label><textarea id={`in-${r.id}`} name="instructions" rows={3} /></div>
                <div className="field"><label htmlFor={`du-${r.id}`}>Notes due</label><input id={`du-${r.id}`} name="due_date" type="date" /></div>
              </ActionForm>
            </details>

            {versions.map((v) => {
              const set = one(v.feedback_sets as unknown as FeedbackSet | FeedbackSet[] | null);
              const approval = one(v.approvals as unknown as Approval | Approval[] | null);
              return (
                <div key={v.id} className="message">
                  <p className="meta">
                    <b>v{v.version_no}</b> · published {fmtDateTime(v.published_at)}{v.due_date ? ` · due ${fmtDate(v.due_date)}` : ""}{" "}
                    {approval ? <Badge>Approved by {approval.profiles.full_name || approval.profiles.email} {fmtDateTime(approval.approved_at)}</Badge>
                      : set?.status === "submitted" ? <Badge attention>Changes requested</Badge>
                      : set ? <Badge>Client drafting notes</Badge> : <Badge>Waiting</Badge>}
                  </p>
                  <p>
                    {v.preview_url && <a href={v.preview_url} className="txt-link" target="_blank" rel="noopener noreferrer">Preview</a>}{" "}
                    {v.file_id && <a href={`/api/files/${v.file_id}`} className="txt-link">File</a>}
                  </p>
                  {set?.status === "submitted" && (
                    <>
                      <p className="muted-note">Sent by {set.profiles?.full_name || set.profiles?.email} on {fmtDateTime(set.submitted_at)}</p>
                      {set.general_notes && <p style={{ whiteSpace: "pre-wrap" }}><b>General:</b> {set.general_notes}</p>}
                      {set.feedback_items.map((i) => (
                        <div key={i.id} style={{ borderTop: "1px solid var(--line-soft)", padding: "0.5rem 0" }}>
                          <p><Badge>{i.kind === "approved_element" ? "Keep" : "Change"}</Badge>{" "}
                            {i.timecode_start_ms != null ? `${formatTimecode(i.timecode_start_ms)}${i.timecode_end_ms != null ? `–${formatTimecode(i.timecode_end_ms)}` : ""} · ` : ""}
                            {[i.page, i.section].filter(Boolean).join(" · ")}</p>
                          <p style={{ whiteSpace: "pre-wrap" }}>{i.body}</p>
                          {i.kind === "change" && (
                            <ActionForm action={resolveFeedbackItem.bind(null, id, i.id)} inline resetOnSuccess={false} submitLabel="Save">
                              <div className="field"><label htmlFor={`rs-${i.id}`}>Resolution</label>
                                <select id={`rs-${i.id}`} name="resolution_status" defaultValue={i.resolution_status}>
                                  <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Done</option><option value="wont_change">Not changing</option>
                                </select></div>
                              <div className="field" style={{ minWidth: 260 }}><label htmlFor={`rn-${i.id}`}>Note to client</label><input id={`rn-${i.id}`} name="resolution_note" defaultValue={i.resolution_note ?? ""} /></div>
                            </ActionForm>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      <h2>New review</h2>
      <ActionForm action={createReview.bind(null, id)} submitLabel="Create review">
        <div className="form-row">
          <div className="field"><label htmlFor="rv-title">Title</label><input id="rv-title" name="title" required placeholder="e.g. Homepage design, First cut" /></div>
          <div className="field"><label htmlFor="rv-kind">Kind of notes</label>
            <select id="rv-kind" name="review_kind"><option value="website">Website (page and section)</option><option value="edit">Edit (timecodes)</option><option value="document">Document</option></select></div>
        </div>
        <div className="field"><label htmlFor="rv-m">Milestone it approves</label>
          <select id="rv-m" name="milestone_id"><option value="">None</option>{(milestones ?? []).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
      </ActionForm>
    </>
  );
}
