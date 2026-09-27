import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { Badge } from "@/components/app/AppShell";
import { StaffFileField } from "@/components/app/StaffFileField";
import { AGREEMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS, fmtDate, fmtDateTime, fmtMoney, label } from "@/lib/labels";
import { integrationStatus } from "@/lib/server-env";
import {
  createInvoice, createStripeInvoice, saveAgreement, saveProposal, sendAgreement, sendInvoice, sendProposal,
  setAgreementStatusManually, setInvoiceStatusManually,
} from "@/app/admin/_actions/documents";

type Milestone = { label: string; amount_cents: number; due?: string };

function ProposalFields({ p, uid }: { p?: Record<string, unknown>; uid: string }) {
  const ms = (p?.payment_milestones as Milestone[] | undefined) ?? [];
  return (
    <>
      <div className="field"><label htmlFor={`d1-${uid}`}>Title</label><input id={`d1-${uid}`} name="title" defaultValue={(p?.title as string) ?? "Proposal"} required /></div>
      <div className="field"><label htmlFor={`d2-${uid}`}>Scope</label><textarea id={`d2-${uid}`} name="scope" rows={4} defaultValue={(p?.scope as string) ?? ""} /></div>
      <div className="form-row">
        <div className="field"><label htmlFor={`d3-${uid}`}>Deliverables (one per line)</label><textarea id={`d3-${uid}`} name="deliverables" rows={4} defaultValue={((p?.deliverables as string[]) ?? []).join("\n")} /></div>
        <div className="field"><label htmlFor={`d4-${uid}`}>Not included (one per line)</label><textarea id={`d4-${uid}`} name="exclusions" rows={4} defaultValue={((p?.exclusions as string[]) ?? []).join("\n")} /></div>
      </div>
      <div className="field"><label htmlFor={`d5-${uid}`}>Timeline assumptions</label><textarea id={`d5-${uid}`} name="timeline_assumptions" rows={2} defaultValue={(p?.timeline_assumptions as string) ?? ""} /></div>
      <div className="form-row">
        <div className="field"><label htmlFor={`d6-${uid}`}>Included revision rounds</label><input id={`d6-${uid}`} name="revision_rounds" type="number" min={0} max={20} defaultValue={(p?.revision_rounds as number) ?? ""} /></div>
        <div className="field"><label htmlFor={`d7-${uid}`}>Price (USD)</label><input id={`d7-${uid}`} name="price" inputMode="decimal" defaultValue={p?.price_cents != null ? String((p.price_cents as number) / 100) : ""} /></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Payment schedule: label | amount | when (one per line)</label>
          <textarea name="payment_milestones" rows={3} placeholder={"Deposit | 500 | on booking\nBalance | 500 | on delivery"} defaultValue={ms.map((m) => `${m.label} | ${m.amount_cents / 100}${m.due ? ` | ${m.due}` : ""}`).join("\n")} /></div>
        <div className="field"><label htmlFor={`d8-${uid}`}>Valid until</label><input id={`d8-${uid}`} name="expires_at" type="date" defaultValue={(p?.expires_at as string) ?? ""} /></div>
      </div>
      <p className="muted-note">No contract language is generated here. Legal terms belong in the agreement document you upload.</p>
    </>
  );
}

export default async function AdminDocumentsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const [{ data: proposals }, { data: agreements }, { data: invoices }] = await Promise.all([
    supabase.from("proposals").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("agreements").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("project_id", id).order("created_at", { ascending: false }),
  ]);
  const integrations = integrationStatus();

  return (
    <>
      <p className="notice">Proposal, agreement, and payment are tracked separately from the production stage. Marking a project &ldquo;in production&rdquo; doesn&apos;t mark anything signed or paid.</p>

      <h2>Proposals</h2>
      {(proposals ?? []).map((p) => (
        <section className="panel" key={p.id} style={{ marginBottom: "1rem" }}>
          <h3>{p.title} <Badge attention={p.status === "sent"}>{p.status}</Badge> <span className="muted-note">{fmtMoney(p.price_cents, p.currency)}{p.sent_at ? ` · sent ${fmtDateTime(p.sent_at)}` : ""}{p.responded_at ? ` · ${p.status} ${fmtDateTime(p.responded_at)}` : ""}</span></h3>
          {p.status === "draft" ? (
            <>
              <ActionForm action={saveProposal.bind(null, id, p.id)} resetOnSuccess={false} submitLabel="Save draft"><ProposalFields p={p} uid={p.id} /></ActionForm>
              <p style={{ marginTop: "0.6rem" }}><ActionButton variant="primary" action={sendProposal.bind(null, id, p.id)} confirmText="Send this proposal to the client?">Send to client</ActionButton></p>
            </>
          ) : <p className="muted-note">Sent proposals are locked. Create a new one to revise; sending it supersedes this one.</p>}
        </section>
      ))}
      <details><summary className="txt-link">New proposal</summary>
        <ActionForm action={saveProposal.bind(null, id, null)} submitLabel="Create draft"><ProposalFields uid="new" /></ActionForm>
      </details>

      <h2>Agreements</h2>
      <p className="muted-note">Upload the agreement and paste the link from your signing service. There&apos;s no signing provider connected, so signed status is recorded by you, with a reason.</p>
      {(agreements ?? []).map((a) => (
        <section className="panel" key={a.id} style={{ marginBottom: "1rem" }}>
          <h3>{a.title} <Badge attention={a.status === "sent"}>{label(AGREEMENT_STATUS_LABELS, a.status)}</Badge>
            {a.status === "signed" && <> <Badge attention={a.status_source === "manual"}>{a.status_source === "manual" ? "Marked manually" : "Confirmed by provider"}</Badge></>}</h3>
          <p>{a.file_id && <a href={`/api/files/${a.file_id}`} className="txt-link">Agreement file</a>} {a.signing_url && <a href={a.signing_url} className="txt-link" target="_blank" rel="noopener noreferrer">Signing link</a>} {a.signed_file_id && <a href={`/api/files/${a.signed_file_id}`} className="txt-link">Signed copy</a>} {a.signed_at && <span className="muted-note">signed {fmtDate(a.signed_at)}</span>}</p>
          {a.status === "draft" && <ActionButton variant="primary" action={sendAgreement.bind(null, id, a.id)} confirmText="Send this agreement to the client?">Send to client</ActionButton>}
          {a.status === "sent" && (
            <ActionForm action={setAgreementStatusManually.bind(null, id, a.id)} submitLabel="Record status">
              <div className="form-row">
                <div className="field"><label htmlFor={`d9-${a.id}`}>New status</label><select id={`d9-${a.id}`} name="status"><option value="signed">Signed</option><option value="declined">Declined</option><option value="void">Void</option></select></div>
                <div className="field"><label htmlFor={`d10-${a.id}`}>How you confirmed it (required)</label><input id={`d10-${a.id}`} name="reason" required minLength={5} /></div>
              </div>
              <StaffFileField projectId={id} purpose="document" name="signed_file_id" label="Attach the signed copy" />
            </ActionForm>
          )}
        </section>
      ))}
      <details><summary className="txt-link">New agreement</summary>
        <ActionForm action={saveAgreement.bind(null, id)} submitLabel="Save draft">
          <div className="field"><label htmlFor={`d11-${id}`}>Title</label><input id={`d11-${id}`} name="title" defaultValue="Agreement" /></div>
          <StaffFileField projectId={id} purpose="document" label="Upload the agreement (PDF)" />
          <div className="field"><label htmlFor={`d12-${id}`}>Signing link (from your e-signature service)</label><input id={`d12-${id}`} name="signing_url" type="url" /></div>
          <div className="field"><label htmlFor={`d13-${id}`}>Related proposal</label><select id={`d13-${id}`} name="proposal_id"><option value="">None</option>{(proposals ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        </ActionForm>
      </details>

      <h2>Invoices</h2>
      <p className="muted-note">
        {integrations.stripe
          ? "Stripe is connected: a Stripe invoice is marked paid automatically only when Stripe's signed webhook confirms it."
          : "Stripe isn't configured. Use a payment link from any provider; paid status is then recorded by you, with a reason."}
      </p>
      {invoices?.length ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Number</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.number}<br /><span className="muted-note">{i.description}</span></td>
                  <td>{fmtMoney(i.amount_cents, i.currency)}</td>
                  <td>{fmtDate(i.due_date)}</td>
                  <td><Badge attention={i.status === "open"}>{label(PAYMENT_STATUS_LABELS, i.status)}</Badge>
                    {i.status !== "draft" && <><br /><span className="muted-note">{i.status_source === "provider" ? "via Stripe webhook" : "manual"}{i.paid_at ? ` · ${fmtDateTime(i.paid_at)}` : ""}</span></>}</td>
                  <td className="stack-sm">
                    {i.status === "draft" && integrations.stripe && !i.provider_invoice_id && <ActionButton action={createStripeInvoice.bind(null, id, i.id)}>Create Stripe invoice</ActionButton>}
                    {i.status === "draft" && <ActionButton variant="primary" action={sendInvoice.bind(null, id, i.id)} confirmText="Send this invoice to the client?">Send</ActionButton>}
                    {i.payment_url && <a href={i.payment_url} className="txt-link" target="_blank" rel="noopener noreferrer">Payment link</a>}
                    {i.status !== "draft" && (
                      <details><summary className="txt-link">Record a manual change</summary>
                        <ActionForm action={setInvoiceStatusManually.bind(null, id, i.id)} submitLabel="Record">
                          <div className="field"><label htmlFor={`d14-${i.id}`}>Status</label><select id={`d14-${i.id}`} name="status"><option value="paid">Paid</option><option value="open">Open</option><option value="void">Void</option><option value="uncollectible">Uncollectible</option></select></div>
                          <div className="field"><label htmlFor={`d15-${i.id}`}>How you confirmed it (required)</label><input id={`d15-${i.id}`} name="reason" required minLength={5} placeholder="e.g. bank transfer received Oct 2" /></div>
                        </ActionForm>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <details><summary className="txt-link">New invoice</summary>
        <ActionForm action={createInvoice.bind(null, id)} submitLabel="Save draft">
          <div className="form-row">
            <div className="field"><label htmlFor={`d16-${id}`}>Invoice number</label><input id={`d16-${id}`} name="number" required /></div>
            <div className="field"><label htmlFor={`d17-${id}`}>Amount (USD)</label><input id={`d17-${id}`} name="amount" inputMode="decimal" required /></div>
          </div>
          <div className="form-row">
            <div className="field"><label htmlFor={`d18-${id}`}>Description</label><input id={`d18-${id}`} name="description" placeholder="e.g. Deposit" /></div>
            <div className="field"><label htmlFor={`d19-${id}`}>Due</label><input id={`d19-${id}`} name="due_date" type="date" /></div>
          </div>
          <div className="field"><label htmlFor={`d20-${id}`}>External payment link (optional if using Stripe)</label><input id={`d20-${id}`} name="payment_url" type="url" /></div>
          <div className="field"><label htmlFor={`d21-${id}`}>Related proposal</label><select id={`d21-${id}`} name="proposal_id"><option value="">None</option>{(proposals ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        </ActionForm>
      </details>
    </>
  );
}
