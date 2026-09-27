import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { ActionButton } from "@/components/app/ActionButton";
import { Badge } from "@/components/app/AppShell";
import { fmtDate } from "@/lib/labels";
import { setWorkRequestStatus } from "@/app/admin/_actions/pipeline";

export default async function RequestsPage() {
  const { supabase } = await requireStaffPage();
  const { data } = await supabase.from("work_requests").select("*, clients(display_name), projects(title), profiles:requested_by(full_name, email)").order("created_at", { ascending: false });
  return (
    <>
      <h1>Maintenance and new-work requests</h1>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Received</th><th>Client</th><th>Type</th><th>Request</th><th>Status</th></tr></thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id}>
                <td>{fmtDate(r.created_at)}{r.desired_date && <><br /><span className="muted-note">wanted {fmtDate(r.desired_date)}</span></>}</td>
                <td><Link href={`/admin/clients/${r.client_id}`} className="txt-link">{(r.clients as { display_name: string }).display_name}</Link>
                  {r.projects && <><br /><Link href={`/admin/projects/${r.project_id}`} className="muted-note">{(r.projects as { title: string }).title}</Link></>}</td>
                <td>{r.kind === "maintenance" ? "Maintenance" : "Additional work"}</td>
                <td style={{ whiteSpace: "pre-wrap", maxWidth: 420 }}>{r.description}</td>
                <td><Badge attention={r.status === "new"}>{r.status}</Badge>
                  <div className="stack-sm">{["reviewing", "quoted", "converted", "closed"].filter((s) => s !== r.status).map((s) => (
                    <ActionButton key={s} variant="link" action={setWorkRequestStatus.bind(null, r.id, s)}>{s}</ActionButton>
                  ))}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data?.length && <p className="muted-note">No requests.</p>}
    </>
  );
}
