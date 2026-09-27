import { requireProjectAccess } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { ProposalResponse } from "@/components/app/ProposalResponse";
import { AGREEMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS, fmtDate, fmtMoney, label } from "@/lib/labels";

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProjectAccess(id, "page");
  const [{ data: proposals }, { data: agreements }, { data: invoices }] = await Promise.all([
    supabase.from("proposals").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("agreements").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("project_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <h2>Proposal</h2>
      {!proposals?.length && <p className="muted-note">No proposal yet.</p>}
      {(proposals ?? []).map((p) => (
        <section className="panel" key={p.id} style={{ marginBottom: "1rem" }}>
          <h3>{p.title} <Badge attention={p.status === "sent"}>{p.status}</Badge></h3>
          {p.scope && <><h3>Scope</h3><p style={{ whiteSpace: "pre-wrap" }}>{p.scope}</p></>}
          {p.deliverables?.length > 0 && <><h3>Deliverables</h3><ul>{p.deliverables.map((d: string) => <li key={d}>{d}</li>)}</ul></>}
          {p.exclusions?.length > 0 && <><h3>Not included</h3><ul>{p.exclusions.map((d: string) => <li key={d}>{d}</li>)}</ul></>}
          {p.timeline_assumptions && <><h3>Timeline assumptions</h3><p style={{ whiteSpace: "pre-wrap" }}>{p.timeline_assumptions}</p></>}
          <dl className="kv" style={{ marginTop: "0.8rem" }}>
            {p.revision_rounds != null && <><dt>Revision rounds</dt><dd>{p.revision_rounds}</dd></>}
            {p.price_cents != null && <><dt>Price</dt><dd>{fmtMoney(p.price_cents, p.currency)}</dd></>}
            {p.expires_at && <><dt>Valid until</dt><dd>{fmtDate(p.expires_at)}</dd></>}
          </dl>
          {Array.isArray(p.payment_milestones) && p.payment_milestones.length > 0 && (
            <>
              <h3>Payment schedule</h3>
              <ul>{(p.payment_milestones as { label: string; amount_cents: number; due?: string }[]).map((m, i) => (
                <li key={i}>{m.label}: {fmtMoney(m.amount_cents, p.currency)}{m.due ? ` (${m.due})` : ""}</li>
              ))}</ul>
            </>
          )}
          {p.status === "sent" && <ProposalResponse proposalId={p.id} />}
          <p className="muted-note" style={{ marginTop: "0.6rem" }}>Accepting a proposal isn&apos;t a signature or a payment; those come next as separate steps.</p>
        </section>
      ))}

      <h2>Agreement</h2>
      {!agreements?.length && <p className="muted-note">No agreement yet.</p>}
      {(agreements ?? []).map((a) => (
        <section className="panel" key={a.id} style={{ marginBottom: "1rem" }}>
          <h3>{a.title} <Badge attention={a.status === "sent"}>{label(AGREEMENT_STATUS_LABELS, a.status)}</Badge></h3>
          <p className="btn-group">
            {a.file_id && <a className="btn btn-secondary btn-small" href={`/api/files/${a.file_id}`}>Download agreement</a>}
            {a.status === "sent" && a.signing_url && <a className="btn btn-primary btn-small" href={a.signing_url} target="_blank" rel="noopener noreferrer">Open to sign</a>}
            {a.signed_file_id && <a className="btn btn-secondary btn-small" href={`/api/files/${a.signed_file_id}`}>Signed copy</a>}
          </p>
          {a.status === "sent" && <p className="muted-note">Signing happens with the signing service. The status here updates once the studio confirms it.</p>}
        </section>
      ))}

      <h2>Invoices</h2>
      {!invoices?.length && <p className="muted-note">No invoices yet.</p>}
      {invoices?.length ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Invoice</th><th>Amount</th><th>Due</th><th>Status</th><th /></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.number}{i.description ? ` · ${i.description}` : ""}</td>
                  <td>{fmtMoney(i.amount_cents, i.currency)}</td>
                  <td>{fmtDate(i.due_date)}</td>
                  <td><Badge attention={i.status === "open"}>{label(PAYMENT_STATUS_LABELS, i.status)}</Badge></td>
                  <td>{i.status === "open" && i.payment_url && <a className="btn btn-primary btn-small" href={i.payment_url} target="_blank" rel="noopener noreferrer">Pay</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="muted-note" style={{ marginTop: "0.6rem" }}>Payments are handled by the payment provider; card details never pass through this site. An invoice shows as paid once the payment is confirmed.</p>
    </>
  );
}
