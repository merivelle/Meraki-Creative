import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { fmtDate, fmtMoney } from "@/lib/labels";

/** Cross-project index. Each proposal lives on its project; this just lists them. */
export default async function ProposalsIndex() {
  const { supabase } = await requireStaffPage();
  const [{ data: proposals }, { data: agreements }] = await Promise.all([
    supabase.from("proposals").select("id, title, status, price_cents, currency, expires_at, sent_at, project_id, projects(title)").order("created_at", { ascending: false }),
    supabase.from("agreements").select("id, title, status, status_source, signed_at, project_id, projects(title)").order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <h1>Proposals and agreements</h1>
      <h2>Proposals</h2>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Project</th><th>Proposal</th><th>Price</th><th>Status</th><th>Valid until</th></tr></thead>
        <tbody>{(proposals ?? []).map((p) => (
          <tr key={p.id}><td><Link href={`/admin/projects/${p.project_id}/documents`} className="txt-link">{(p.projects as unknown as { title: string }).title}</Link></td>
            <td>{p.title}</td><td>{fmtMoney(p.price_cents, p.currency)}</td><td><Badge attention={p.status === "sent"}>{p.status}</Badge></td><td>{fmtDate(p.expires_at)}</td></tr>
        ))}</tbody>
      </table></div>
      <h2>Agreements</h2>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Project</th><th>Agreement</th><th>Status</th><th>Signed</th></tr></thead>
        <tbody>{(agreements ?? []).map((a) => (
          <tr key={a.id}><td><Link href={`/admin/projects/${a.project_id}/documents`} className="txt-link">{(a.projects as unknown as { title: string }).title}</Link></td>
            <td>{a.title}</td><td><Badge attention={a.status === "sent"}>{a.status}</Badge>{a.status === "signed" && ` (${a.status_source})`}</td><td>{fmtDate(a.signed_at)}</td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
