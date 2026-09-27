import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { AGREEMENT_STATUS_LABELS, NEXT_ACTION_LABELS, PAYMENT_STATUS_LABELS, SERVICE_CATEGORY_LABELS, STAGE_LABELS, STATE_LABELS, fmtDate, label } from "@/lib/labels";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state = "active" } = await searchParams;
  const { supabase } = await requireStaffPage();
  let q = supabase.from("project_overview").select("*").order("updated_at", { ascending: false });
  if (state !== "all") q = q.eq("state", state);
  const { data } = await q;
  return (
    <>
      <h1>Projects</h1>
      <p><Link href="/admin/projects/new" className="btn btn-primary btn-small">New project</Link></p>
      <nav className="tabs" aria-label="Filter by state">
        {["active", "on_hold", "cancelled", "archived", "all"].map((s) => (
          <Link key={s} href={`/admin/projects?state=${s}`} aria-current={state === s ? "page" : undefined}>{s === "all" ? "All" : label(STATE_LABELS, s)}</Link>
        ))}
      </nav>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Project</th><th>Client</th><th>Service</th><th>Stage</th><th>Agreement</th><th>Payment</th><th>Waiting on client</th><th>Target</th></tr></thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/projects/${p.id}`} className="txt-link">{p.title}</Link></td>
                <td>{p.client_name}</td>
                <td>{label(SERVICE_CATEGORY_LABELS, p.service_category)}</td>
                <td>{label(STAGE_LABELS, p.stage)}</td>
                <td>{label(AGREEMENT_STATUS_LABELS, p.agreement_status)}</td>
                <td><Badge attention={p.payment_status === "overdue"}>{label(PAYMENT_STATUS_LABELS, p.payment_status)}</Badge></td>
                <td>{p.next_action ? NEXT_ACTION_LABELS[p.next_action] : "—"}</td>
                <td>{fmtDate(p.due_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
