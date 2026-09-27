import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { PAYMENT_STATUS_LABELS, fmtDate, fmtDateTime, fmtMoney, label } from "@/lib/labels";

export default async function InvoicesIndex() {
  const { supabase } = await requireStaffPage();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: invoices }, { data: events }] = await Promise.all([
    supabase.from("invoices").select("id, number, amount_cents, currency, due_date, status, status_source, provider, paid_at, project_id, projects(title)").order("created_at", { ascending: false }),
    supabase.from("payment_events").select("id, provider, type, verified, received_at, processed_at, invoice_id").order("received_at", { ascending: false }).limit(50),
  ]);
  return (
    <>
      <h1>Invoices and payments</h1>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Number</th><th>Project</th><th>Amount</th><th>Due</th><th>Status</th><th>Recorded by</th></tr></thead>
        <tbody>{(invoices ?? []).map((i) => (
          <tr key={i.id}>
            <td>{i.number}</td>
            <td><Link href={`/admin/projects/${i.project_id}/documents`} className="txt-link">{(i.projects as unknown as { title: string }).title}</Link></td>
            <td>{fmtMoney(i.amount_cents, i.currency)}</td>
            <td>{fmtDate(i.due_date)}</td>
            <td><Badge attention={i.status === "open" && !!i.due_date && i.due_date < today}>{label(PAYMENT_STATUS_LABELS, i.status)}</Badge></td>
            <td>{i.status === "draft" ? "—" : i.status_source === "provider" ? `${i.provider} (verified)` : "Manual"}{i.paid_at ? ` · ${fmtDateTime(i.paid_at)}` : ""}</td>
          </tr>
        ))}</tbody>
      </table></div>
      <h2>Provider events</h2>
      <p className="muted-note">Every payment-provider webhook received, after signature verification. Only these can mark an invoice paid automatically.</p>
      <ul className="timeline">{(events ?? []).map((e) => <li key={e.id}>{e.provider} · {e.type} · {fmtDateTime(e.received_at)} {e.processed_at ? "" : <Badge>unmatched</Badge>}</li>)}</ul>
    </>
  );
}
