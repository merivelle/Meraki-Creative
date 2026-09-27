import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { InternalNotes } from "@/components/app/InternalNotes";
import { STAGES, STAGE_LABELS, STATES, STATE_LABELS, fmtDate } from "@/lib/labels";
import { addMilestone, deleteMilestone, updateMilestone, updateProject } from "@/app/admin/_actions/projects";
import { addProjectMember, removeProjectMember } from "@/app/admin/_actions/pipeline";

export default async function AdminProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const [{ data: p }, { data: milestones }, { data: members }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("milestone_status").select("*").eq("project_id", id).order("sort"),
    supabase.from("project_members").select("user_id, created_at, profiles:user_id(full_name, email)").eq("project_id", id),
  ]);
  const { data: clientPeople } = await supabase.from("client_members").select("user_id, profiles:user_id(full_name, email)").eq("client_id", p!.client_id);
  const memberIds = new Set((members ?? []).map((m) => m.user_id));
  const addable = (clientPeople ?? []).filter((c) => !memberIds.has(c.user_id));

  return (
    <>
      <section className="panel">
        <h2>Project</h2>
        <p className="muted-note">Stage tracks production only. Agreement and payment status come from their own records and never change with the stage.</p>
        <ActionForm action={updateProject.bind(null, id)} resetOnSuccess={false} submitLabel="Save">
          <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={p!.title} required /></div>
          <div className="form-row">
            <div className="field"><label htmlFor="stage">Stage</label>
              <select id="stage" name="stage" defaultValue={p!.stage}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}</select></div>
            <div className="field"><label htmlFor="state">State</label>
              <select id="state" name="state" defaultValue={p!.state}>{STATES.map((s) => <option key={s} value={s}>{STATE_LABELS[s]}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="field"><label htmlFor="start_date">Start</label><input id="start_date" name="start_date" type="date" defaultValue={p!.start_date ?? ""} /></div>
            <div className="field"><label htmlFor="due_date">Target date</label><input id="due_date" name="due_date" type="date" defaultValue={p!.due_date ?? ""} /></div>
          </div>
          <div className="field"><label htmlFor="client_summary">Summary (client can see)</label><textarea id="client_summary" name="client_summary" rows={3} defaultValue={p!.client_summary ?? ""} /></div>
          <div className="field"><label htmlFor="scope_notes">Scope notes (client can see)</label><textarea id="scope_notes" name="scope_notes" rows={3} defaultValue={p!.scope_notes ?? ""} /></div>
          <div className="field"><label htmlFor="handoff_instructions">Handoff instructions (client can see on Deliverables)</label><textarea id="handoff_instructions" name="handoff_instructions" rows={4} defaultValue={p!.handoff_instructions ?? ""} /></div>
        </ActionForm>
      </section>

      <h2>Milestones</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Milestone</th><th>Due</th><th>Status</th><th>Approval</th><th /></tr></thead>
          <tbody>
            {(milestones ?? []).map((m) => (
              <tr key={m.id}>
                <td colSpan={3}>
                  <ActionForm action={updateMilestone.bind(null, id, m.id)} resetOnSuccess={false} inline submitLabel="Save">
                    <div className="field"><label htmlFor={`mt-${m.id}`}>Title</label><input id={`mt-${m.id}`} name="title" defaultValue={m.title} /></div>
                    <div className="field"><label htmlFor={`md-${m.id}`}>Due</label><input id={`md-${m.id}`} name="due_date" type="date" defaultValue={m.due_date ?? ""} /></div>
                    <div className="field"><label htmlFor={`ms-${m.id}`}>Status</label>
                      <select id={`ms-${m.id}`} name="status" defaultValue={m.status}>
                        <option value="upcoming">Upcoming</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="skipped">Skipped</option>
                      </select></div>
                    <label className="choice"><input type="checkbox" name="requires_approval" defaultChecked={m.requires_approval} /> Needs approval</label>
                    <label className="choice"><input type="checkbox" name="internal" defaultChecked={!m.client_visible} /> Internal only</label>
                  </ActionForm>
                </td>
                <td>{m.approval_state === "approved" ? `Approved v${m.latest_version_no}` : m.approval_state === "awaiting_review" ? `Awaiting review (v${m.latest_version_no})` : m.approval_state === "not_ready" ? "No version yet" : "—"}</td>
                <td><ActionButton variant="link" action={deleteMilestone.bind(null, id, m.id)} confirmText="Delete this milestone?">Delete</ActionButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActionForm action={addMilestone.bind(null, id)} inline submitLabel="Add milestone">
        <div className="field"><label htmlFor="new-m">New milestone</label><input id="new-m" name="title" required /></div>
        <div className="field"><label htmlFor="new-md">Due</label><input id="new-md" name="due_date" type="date" /></div>
        <label className="choice"><input type="checkbox" name="requires_approval" /> Needs approval</label>
        <label className="choice"><input type="checkbox" name="internal" /> Internal only</label>
      </ActionForm>

      <h2>Who can see this project</h2>
      <ul className="timeline">
        {(members ?? []).map((m) => {
          const pr = m.profiles as unknown as { full_name: string | null; email: string };
          return <li key={m.user_id}>{pr.full_name || pr.email} <span className="muted-note">· {pr.email} · since {fmtDate(m.created_at)}</span>{" "}
            <ActionButton variant="link" action={removeProjectMember.bind(null, id, m.user_id)} confirmText="Remove this person's access to this project?">Remove access</ActionButton></li>;
        })}
        {!members?.length && <li className="muted-note">No client has access yet. Invite from the client page.</li>}
      </ul>
      {addable.length > 0 && (
        <ActionForm action={addProjectMember.bind(null, id)} inline submitLabel="Give access">
          <div className="field"><label htmlFor="add-member">Someone already on this client&apos;s account</label>
            <select id="add-member" name="user_id">{addable.map((a) => {
              const pr = a.profiles as unknown as { full_name: string | null; email: string };
              return <option key={a.user_id} value={a.user_id}>{pr.full_name || pr.email}</option>;
            })}</select></div>
        </ActionForm>
      )}

      <div style={{ marginTop: "2rem" }}><InternalNotes supabase={supabase} entityType="project" entityId={id} projectId={id} /></div>
    </>
  );
}
