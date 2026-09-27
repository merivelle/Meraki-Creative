import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage, isUuid } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { ClientFields } from "@/components/app/ClientFields";
import { InternalNotes } from "@/components/app/InternalNotes";
import { STAGE_LABELS, STATE_LABELS, fmtDate, fmtDateTime, label } from "@/lib/labels";
import { inviteClient, revokeInvitation, saveClient } from "@/app/admin/_actions/pipeline";
import { createProject } from "@/app/admin/_actions/projects";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireStaffPage();
  const { data: c } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [{ data: projects }, { data: members }, { data: invites }, { data: requests }] = await Promise.all([
    supabase.from("projects").select("id, title, stage, state, due_date, project_members(user_id)").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("client_members").select("user_id, role, created_at, profiles:user_id(full_name, email)").eq("client_id", id),
    supabase.from("invitations").select("id, email, project_id, expires_at, accepted_at, revoked_at, created_at, projects(title)").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("work_requests").select("id, kind, status, description, created_at").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <p className="muted-note"><Link href="/admin/clients" className="txt-link">All clients</Link></p>
      <h1>{c.display_name}{c.is_dev_fixture && " [DEV]"}</h1>

      <h2>Projects</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Project</th><th>Stage</th><th>State</th><th>Target</th><th>People with access</th></tr></thead>
          <tbody>
            {(projects ?? []).map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/projects/${p.id}`} className="txt-link">{p.title}</Link></td>
                <td>{label(STAGE_LABELS, p.stage)}</td>
                <td>{label(STATE_LABELS, p.state)}</td>
                <td>{fmtDate(p.due_date)}</td>
                <td>{(p.project_members as unknown[]).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details style={{ margin: "1rem 0" }}>
        <summary className="txt-link">New project for this client</summary>
        <ActionForm action={createProject} submitLabel="Create project">
          <input type="hidden" name="client_id" value={id} />
          <div className="form-row">
            <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" required /></div>
            <div className="field">
              <label htmlFor="service_category">Service</label>
              <select id="service_category" name="service_category">
                <option value="web_design">Web design</option><option value="post_production">Post-production</option>
                <option value="creative_materials">Creative materials</option><option value="bundle">Bundle</option>
              </select>
            </div>
          </div>
          <div className="field"><label htmlFor="due_date">Target date</label><input id="due_date" name="due_date" type="date" /></div>
        </ActionForm>
      </details>

      <div className="app-grid">
        <section className="panel">
          <h2>People on this account</h2>
          {members?.length ? (
            <ul className="timeline">{members.map((m) => {
              const p = m.profiles as unknown as { full_name: string | null; email: string };
              return <li key={m.user_id}>{p.full_name || p.email} <span className="muted-note">· {p.email} · since {fmtDate(m.created_at)}</span></li>;
            })}</ul>
          ) : <p className="muted-note">No one has accepted an invitation yet.</p>}
          <p className="muted-note">Project access is per project; manage it on each project&apos;s page.</p>

          <h2>Invite someone</h2>
          <p className="muted-note">They get a single-use link (valid 14 days) that signs them in and opens only the project you choose.</p>
          <ActionForm action={inviteClient.bind(null, id)} submitLabel="Send invitation" pendingLabel="Sending…">
            <div className="form-row">
              <div className="field"><label htmlFor="inv-name">Name</label><input id="inv-name" name="name" required defaultValue={c.display_name} /></div>
              <div className="field"><label htmlFor="inv-email">Email</label><input id="inv-email" name="email" type="email" required defaultValue={c.primary_email ?? ""} /></div>
            </div>
            <div className="field">
              <label htmlFor="inv-project">Project</label>
              <select id="inv-project" name="project_id" defaultValue={projects?.[0]?.id ?? ""}>
                <option value="">No project yet (portal access only)</option>
                {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </ActionForm>
        </section>

        <section className="panel">
          <h2>Invitations</h2>
          {invites?.length ? (
            <ul className="timeline">{invites.map((i) => {
              const state = i.accepted_at ? "accepted" : i.revoked_at ? "revoked" : new Date(i.expires_at) < new Date() ? "expired" : "pending";
              return (
                <li key={i.id}>
                  {i.email} → {(i.projects as unknown as { title: string } | null)?.title ?? "portal only"}{" "}
                  <Badge attention={state === "pending"}>{state}</Badge>{" "}
                  <span className="muted-note">sent {fmtDateTime(i.created_at)}</span>
                  {state === "pending" && <> <ActionButton variant="link" action={revokeInvitation.bind(null, i.id)} confirmText="Revoke this invitation?">Revoke</ActionButton></>}
                </li>
              );
            })}</ul>
          ) : <p className="muted-note">None sent.</p>}
          <p className="muted-note">To resend, send a new invitation. It replaces the older link.</p>
        </section>
      </div>

      <h2>Contact details</h2>
      <ActionForm action={saveClient.bind(null, id)} resetOnSuccess={false} submitLabel="Save"><ClientFields c={c} /></ActionForm>

      {requests?.length ? (
        <>
          <h2>Requests</h2>
          <ul className="timeline">{requests.map((r) => <li key={r.id}>{r.kind.replace("_", " ")} · <Badge>{r.status}</Badge> · {r.description.slice(0, 140)} <span className="muted-note">{fmtDate(r.created_at)}</span></li>)}</ul>
        </>
      ) : null}

      <div style={{ marginTop: "2rem" }}><InternalNotes supabase={supabase} entityType="client" entityId={id} /></div>
    </>
  );
}
