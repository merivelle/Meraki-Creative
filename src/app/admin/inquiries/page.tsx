import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { INQUIRY_STATUS_LABELS, CLIENT_TYPE_LABELS, fmtDate, label } from "@/lib/labels";

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { supabase } = await requireStaffPage();
  let q = supabase.from("inquiries").select("id, name, email, client_type, services, budget_range, status, created_at, source").order("created_at", { ascending: false }).limit(200);
  if (status && status in INQUIRY_STATUS_LABELS) q = q.eq("status", status);
  else q = q.neq("status", "spam");
  const { data } = await q;

  return (
    <>
      <h1>Inquiries</h1>
      <nav className="tabs" aria-label="Filter by status">
        <Link href="/admin/inquiries" aria-current={!status ? "page" : undefined}>All open</Link>
        {Object.entries(INQUIRY_STATUS_LABELS).map(([k, v]) => (
          <Link key={k} href={`/admin/inquiries?status=${k}`} aria-current={status === k ? "page" : undefined}>{v}</Link>
        ))}
      </nav>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Received</th><th>Name</th><th>Type</th><th>Services</th><th>Budget</th><th>Status</th></tr></thead>
          <tbody>
            {(data ?? []).map((i) => (
              <tr key={i.id}>
                <td>{fmtDate(i.created_at)}</td>
                <td><Link href={`/admin/inquiries/${i.id}`} className="txt-link">{i.name}</Link><br /><span className="muted-note">{i.email}</span></td>
                <td>{label(CLIENT_TYPE_LABELS, i.client_type)}</td>
                <td>{i.services.join(", ")}</td>
                <td>{i.budget_range ?? "—"}</td>
                <td><Badge attention={i.status === "new"}>{label(INQUIRY_STATUS_LABELS, i.status)}</Badge>{i.source !== "web" && <> <Badge>{i.source}</Badge></>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data?.length && <p className="muted-note">No inquiries here.</p>}
    </>
  );
}
