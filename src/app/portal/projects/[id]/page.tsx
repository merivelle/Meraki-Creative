import { requireProjectAccess } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import {
  AGREEMENT_STATUS_LABELS, NEXT_ACTION_LABELS, PAYMENT_STATUS_LABELS, STAGES, STAGE_LABELS, STATE_LABELS, fmtDate, fmtDateTime, label,
} from "@/lib/labels";

const ACTION_LINKS: Record<string, string> = {
  review_proposal: "documents", sign_agreement: "documents", pay_invoice: "documents",
  complete_form: "forms", provide_assets: "assets", give_feedback: "reviews",
};

export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProjectAccess(id, "page");
  const [{ data: p }, { data: milestones }, { data: updates }] = await Promise.all([
    supabase.from("project_overview").select("*").eq("id", id).single(),
    supabase.from("milestone_status").select("*").eq("project_id", id).order("sort"),
    supabase.from("project_messages").select("id, body, created_at").eq("project_id", id).eq("kind", "update")
      .order("created_at", { ascending: false }).limit(5),
  ]);
  if (!p) return null;
  const stageIndex = STAGES.indexOf(p.stage);

  return (
    <>
      {p.state !== "active" && <p className="notice">This project is {label(STATE_LABELS, p.state).toLowerCase()}.</p>}

      <div className="panel">
        <h2>Next from you</h2>
        {p.next_action ? (
          <p><a className="btn btn-primary btn-small" href={`/portal/projects/${id}/${ACTION_LINKS[p.next_action]}`}>{NEXT_ACTION_LABELS[p.next_action]}</a></p>
        ) : <p>Nothing right now. The studio has what it needs.</p>}
      </div>

      {p.client_summary && <><h2>About this project</h2><p style={{ whiteSpace: "pre-wrap" }}>{p.client_summary}</p></>}

      <h2>Where it stands</h2>
      <ol className="timeline" aria-label="Project stages">
        {STAGES.map((s, i) => (
          <li key={s} aria-current={i === stageIndex ? "step" : undefined}>
            {i < stageIndex ? "✓ " : i === stageIndex ? "→ " : ""}{STAGE_LABELS[s]}{i === stageIndex && <> <Badge>Current</Badge></>}
          </li>
        ))}
      </ol>

      <div className="app-grid" style={{ marginTop: "1rem" }}>
        <div className="panel"><h3>Agreement</h3><p>{label(AGREEMENT_STATUS_LABELS, p.agreement_status)}</p></div>
        <div className="panel"><h3>Payment</h3><p>{label(PAYMENT_STATUS_LABELS, p.payment_status)}</p></div>
        <div className="panel"><h3>Target date</h3><p>{fmtDate(p.due_date)}</p></div>
      </div>

      {milestones?.length ? (
        <>
          <h2>Milestones</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Milestone</th><th>Due</th><th>Status</th><th>Approval</th></tr></thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.title}</td>
                    <td>{fmtDate(m.due_date)}</td>
                    <td>{m.status.replace("_", " ")}</td>
                    <td>{m.approval_state === "approved" ? `Approved (v${m.latest_version_no})`
                      : m.approval_state === "awaiting_review" ? <Badge attention>Awaiting your review of v{m.latest_version_no}</Badge>
                      : m.approval_state === "not_ready" ? "Not ready yet" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <h2>Latest updates</h2>
      {updates?.length ? (
        updates.map((u) => (
          <div className="message" key={u.id}>
            <p className="meta">{fmtDateTime(u.created_at)}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{u.body}</p>
          </div>
        ))
      ) : <p className="muted-note">No updates yet.</p>}
    </>
  );
}
