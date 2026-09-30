import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage, isUuid } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { InternalNotes } from "@/components/app/InternalNotes";
import { CLIENT_TYPE_LABELS, INQUIRY_STATUS_LABELS, fmtDate, fmtDateTime, label, one } from "@/lib/labels";
import { convertInquiry, requestClarification, setInquiryStatus } from "@/app/admin/_actions/pipeline";
import { inquiryDefinition } from "@/lib/inquiry/definition";
import { answerSections } from "@/lib/inquiry/summary";
import type { Answers } from "@/lib/forms/types";

const CATEGORY_FROM_SERVICE: Record<string, string> = {
  "web-design": "web_design", "post-production": "post_production", "creative-materials": "creative_materials",
};

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireStaffPage();
  const { data: inq } = await supabase.from("inquiries").select("*").eq("id", id).maybeSingle();
  if (!inq) notFound();
  const [{ data: matches }, { data: projects }, { data: deliveries }] = await Promise.all([
    supabase.from("clients").select("id, display_name").ilike("primary_email", inq.email),
    supabase.from("projects").select("id, title").eq("inquiry_id", id),
    supabase.from("notifications").select("type, created_at, email_deliveries(status, last_error)").contains("payload", { inquiryId: id }),
  ]);
  const services: string[] = inq.services ?? [];
  const suggestedCategory = services.filter((s) => s !== "not-sure").length > 1 ? "bundle" : CATEGORY_FROM_SERVICE[services[0]] ?? "web_design";
  // Scope answers (including the design brief), labelled the same way as the studio email.
  const scope = answerSections(inquiryDefinition([]), (inq.scope ?? {}) as Answers).flatMap((sec) => sec.rows);

  return (
    <>
      <p className="muted-note"><Link href="/admin/inquiries" className="txt-link">All inquiries</Link></p>
      <h1>{inq.name} <Badge attention={inq.status === "new"}>{label(INQUIRY_STATUS_LABELS, inq.status)}</Badge></h1>
      <p className="app-sub">Received {fmtDateTime(inq.created_at)} · <a href={`mailto:${inq.email}`} className="txt-link">{inq.email}</a>{inq.preselected ? ` · arrived via ${inq.preselected}` : ""}</p>

      <div className="btn-group" style={{ marginBottom: "1.4rem" }}>
        {["reviewing", "proposal_sent", "declined", "spam"].map((s) => (
          <ActionButton key={s} action={setInquiryStatus.bind(null, id, s)}>Mark {INQUIRY_STATUS_LABELS[s].toLowerCase()}</ActionButton>
        ))}
      </div>

      <div className="app-grid">
        <section className="panel">
          <h2>What they asked for</h2>
          <dl className="kv">
            <dt>Business name</dt><dd>{inq.business_name ?? "—"}</dd>
            <dt>Client type</dt><dd>{label(CLIENT_TYPE_LABELS, inq.client_type)}</dd>
            <dt>Services</dt><dd>{services.join(", ")}</dd>
            <dt>Package</dt><dd>{inq.package_slug ?? "—"}</dd>
            <dt>Goal</dt><dd>{inq.goal ?? "—"}</dd>
            <dt>Deadline</dt><dd>{fmtDate(inq.deadline)}{inq.deadline_fixed ? ` (${inq.deadline_fixed})` : ""}</dd>
            <dt>Budget</dt><dd>{inq.budget_range ?? "—"}</dd>
            {scope.map((r) => <Fragment key={r.id}><dt>{r.label}</dt><dd>{r.value}</dd></Fragment>)}
          </dl>
          <h3>Description</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{inq.description}</p>
          {inq.links?.length > 0 && <><h3>Links</h3><ul>{inq.links.map((l: string) => <li key={l}><a href={l.split(" — ")[0]} target="_blank" rel="noopener noreferrer" className="txt-link">{l}</a></li>)}</ul></>}
          {inq.notes && <><h3>Notes</h3><p style={{ whiteSpace: "pre-wrap" }}>{inq.notes}</p></>}
        </section>

        <section className="panel">
          <h2>Emails</h2>
          <ul className="timeline">
            {(deliveries ?? []).map((n, i) => {
              const d = one(n.email_deliveries as unknown as { status: string; last_error: string | null } | null);
              return <li key={i}>{n.type} · {d ? <Badge attention={d.status === "failed"}>{d.status}</Badge> : "no email"} {d?.last_error && <span className="muted-note">{d.last_error}</span>}</li>;
            })}
          </ul>

          <h2>Ask a question</h2>
          <p className="muted-note">Sends an email to {inq.email}; their reply comes to your inbox.</p>
          <ActionForm action={requestClarification.bind(null, id)} submitLabel="Send question">
            <div className="field"><label htmlFor="question">Question</label><textarea id="question" name="question" rows={4} required /></div>
          </ActionForm>
        </section>
      </div>

      <h2>Turn it into a project</h2>
      {projects?.length ? (
        <p>Converted: {projects.map((p) => <Link key={p.id} href={`/admin/projects/${p.id}`} className="txt-link">{p.title}</Link>)}. Prepare the proposal and invite the client from the project.</p>
      ) : (
        <ActionForm action={convertInquiry.bind(null, id)} submitLabel="Create client and project">
          <div className="form-row">
            <div className="field">
              <label htmlFor="client_id">Client</label>
              <select id="client_id" name="client_id" defaultValue={matches?.[0]?.id ?? ""}>
                <option value="">Create a new client</option>
                {(matches ?? []).map((c) => <option key={c.id} value={c.id}>{c.display_name} (existing)</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="client_name">New client name</label><input id="client_name" name="client_name" defaultValue={inq.business_name ?? inq.name} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label htmlFor="title">Project title</label><input id="title" name="title" required defaultValue={inq.goal ? inq.goal.slice(0, 80) : ""} /></div>
            <div className="field">
              <label htmlFor="service_category">Service</label>
              <select id="service_category" name="service_category" defaultValue={suggestedCategory}>
                <option value="web_design">Web design</option>
                <option value="post_production">Post-production</option>
                <option value="creative_materials">Creative materials</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>
          </div>
        </ActionForm>
      )}

      <div style={{ marginTop: "2rem" }}>
        <InternalNotes supabase={supabase} entityType="inquiry" entityId={id} />
      </div>
    </>
  );
}
