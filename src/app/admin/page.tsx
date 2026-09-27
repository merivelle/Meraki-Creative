import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { NEXT_ACTION_LABELS, STAGE_LABELS, fmtDate, fmtDateTime, label } from "@/lib/labels";

export default async function AdminOverview() {
  const { supabase } = await requireStaffPage();
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [inquiries, projects, overdueMilestones, overdueAssets, overdueInvoices, awaiting, upcoming, failedEmails, requests, notes] = await Promise.all([
    supabase.from("inquiries").select("id, name, services, created_at").in("status", ["new", "reviewing"]).order("created_at", { ascending: false }).limit(10),
    supabase.from("project_overview").select("id, title, client_name, stage, next_action, due_date").eq("state", "active").order("due_date", { nullsFirst: false }),
    supabase.from("milestones").select("id, title, due_date, project_id, projects!inner(title, state)").lt("due_date", today).in("status", ["upcoming", "in_progress"]).eq("projects.state", "active"),
    supabase.from("asset_requests").select("id, title, due_date, project_id, projects!inner(title, state)").lt("due_date", today).in("status", ["missing", "needs_replacement"]).eq("projects.state", "active"),
    supabase.from("invoices").select("id, number, due_date, project_id, amount_cents").eq("status", "open").lt("due_date", today),
    supabase.from("review_version_state").select("id, title, version_no, project_id, published_at, due_date").eq("is_latest", true).is("approval_id", null).or("feedback_status.is.null,feedback_status.eq.draft"),
    supabase.from("milestones").select("id, title, due_date, project_id, projects!inner(title, state)").gte("due_date", today).lte("due_date", soon).neq("status", "done").eq("projects.state", "active").order("due_date"),
    supabase.from("email_deliveries").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("work_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("notifications").select("id, title, link_path, created_at").eq("audience", "studio").order("created_at", { ascending: false }).limit(8),
  ]);
  const overdue = [
    ...(overdueMilestones.data ?? []).map((m) => ({ key: `m${m.id}`, what: `Milestone: ${m.title}`, project: (m.projects as unknown as { title: string }).title, projectId: m.project_id, due: m.due_date })),
    ...(overdueAssets.data ?? []).map((a) => ({ key: `a${a.id}`, what: `Client files: ${a.title}`, project: (a.projects as unknown as { title: string }).title, projectId: a.project_id, due: a.due_date })),
    ...(overdueInvoices.data ?? []).map((i) => ({ key: `i${i.id}`, what: `Invoice ${i.number}`, project: "", projectId: i.project_id, due: i.due_date })),
  ];

  return (
    <>
      <h1>Overview</h1>
      {(failedEmails.count ?? 0) > 0 && (
        <p className="notice"><Link href="/admin/settings#email" className="txt-link">{failedEmails.count} email{failedEmails.count === 1 ? "" : "s"} failed to send</Link> and may need attention.</p>
      )}
      {(requests.count ?? 0) > 0 && <p className="notice"><Link href="/admin/requests" className="txt-link">{requests.count} new client request{requests.count === 1 ? "" : "s"}</Link></p>}

      <div className="app-grid">
        <section className="panel">
          <h2>New inquiries</h2>
          {inquiries.data?.length ? (
            <ul className="timeline">{inquiries.data.map((i) => (
              <li key={i.id}><Link href={`/admin/inquiries/${i.id}`} className="txt-link">{i.name}</Link> <span className="muted-note">· {i.services.join(", ")} · {fmtDate(i.created_at)}</span></li>
            ))}</ul>
          ) : <p className="muted-note">None waiting.</p>}
        </section>

        <section className="panel">
          <h2>Overdue</h2>
          {overdue.length ? (
            <ul className="timeline">{overdue.map((o) => (
              <li key={o.key}><Link href={`/admin/projects/${o.projectId}`} className="txt-link">{o.what}</Link> <span className="muted-note">{o.project && `· ${o.project} `}· due {fmtDate(o.due)}</span></li>
            ))}</ul>
          ) : <p className="muted-note">Nothing overdue.</p>}
        </section>

        <section className="panel">
          <h2>Waiting on client review</h2>
          {awaiting.data?.length ? (
            <ul className="timeline">{awaiting.data.map((r) => (
              <li key={r.id}><Link href={`/admin/projects/${r.project_id}/reviews`} className="txt-link">{r.title} v{r.version_no}</Link> <span className="muted-note">· posted {fmtDate(r.published_at)}{r.due_date ? ` · due ${fmtDate(r.due_date)}` : ""}</span></li>
            ))}</ul>
          ) : <p className="muted-note">No reviews outstanding.</p>}
        </section>

        <section className="panel">
          <h2>Next two weeks</h2>
          {upcoming.data?.length ? (
            <ul className="timeline">{upcoming.data.map((m) => (
              <li key={m.id}><Link href={`/admin/projects/${m.project_id}`} className="txt-link">{m.title}</Link> <span className="muted-note">· {(m.projects as unknown as { title: string }).title} · {fmtDate(m.due_date)}</span></li>
            ))}</ul>
          ) : <p className="muted-note">No deadlines coming up.</p>}
        </section>
      </div>

      <h2>Active projects</h2>
      {projects.data?.length ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Project</th><th>Client</th><th>Stage</th><th>Waiting on client</th><th>Target</th></tr></thead>
            <tbody>
              {projects.data.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/projects/${p.id}`} className="txt-link">{p.title}</Link></td>
                  <td>{p.client_name}</td>
                  <td>{label(STAGE_LABELS, p.stage)}</td>
                  <td>{p.next_action ? <Badge>{NEXT_ACTION_LABELS[p.next_action]}</Badge> : "—"}</td>
                  <td>{fmtDate(p.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted-note">No active projects.</p>}

      <h2>Recent activity</h2>
      <ul className="timeline">
        {(notes.data ?? []).map((n) => (
          <li key={n.id}>{n.link_path ? <Link href={n.link_path} className="txt-link">{n.title}</Link> : n.title} <span className="muted-note">· {fmtDateTime(n.created_at)}</span></li>
        ))}
      </ul>
    </>
  );
}
