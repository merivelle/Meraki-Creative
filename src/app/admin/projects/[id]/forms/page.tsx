import { Fragment } from "react";
import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { Badge } from "@/components/app/AppShell";
import { CLIENT_TYPE_LABELS, fmtDate, fmtDateTime, one } from "@/lib/labels";
import { visibleQuestions } from "@/lib/forms/engine";
import { UNKNOWN, type Answers, type FormContext, type FormDefinition } from "@/lib/forms/types";
import { assignForm, reopenAssignment } from "@/app/admin/_actions/projects";

function show(v: unknown): string {
  if (v === UNKNOWN) return "I don't know";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x ? Object.values(x).join(" — ") : String(x))).join("\n");
  return v == null ? "" : String(v);
}

export default async function AdminFormsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const [{ data: assignments }, { data: versions }, { data: project }] = await Promise.all([
    supabase.from("form_assignments").select("id, title, status, due_date, context, created_at, form_template_versions(version, schema), form_submissions(id, revision_no, submitted_at, change_summary, answers, profiles:submitted_by(full_name, email)), form_drafts(updated_at)").eq("project_id", id).order("created_at"),
    supabase.from("form_template_versions").select("id, version, form_templates(title)").not("published_at", "is", null).order("version", { ascending: false }),
    supabase.from("projects").select("clients(client_type)").eq("id", id).single(),
  ]);
  const clientType = (project?.clients as unknown as { client_type: string } | null)?.client_type ?? "other";

  return (
    <>
      <h2>Assign a questionnaire</h2>
      <ActionForm action={assignForm.bind(null, id)} submitLabel="Assign and notify client">
        <div className="form-row">
          <div className="field"><label htmlFor="tv">Questionnaire</label>
            <select id="tv" name="template_version_id">{(versions ?? []).map((v) => (
              <option key={v.id} value={v.id}>{(v.form_templates as unknown as { title: string }).title} (v{v.version})</option>
            ))}</select></div>
          <div className="field"><label htmlFor="ct">Branch for client type</label>
            <select id="ct" name="client_type" defaultValue={clientType}>{Object.entries(CLIENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="field"><label htmlFor="ft">Title shown to client (optional)</label><input id="ft" name="title" /></div>
          <div className="field"><label htmlFor="fd">Due</label><input id="fd" name="due_date" type="date" /></div>
        </div>
      </ActionForm>

      {(assignments ?? []).map((a) => {
        const v = a.form_template_versions as unknown as { version: number; schema: FormDefinition };
        const subs = ((a.form_submissions ?? []) as unknown as { id: string; revision_no: number; submitted_at: string; change_summary: string | null; answers: Answers; profiles: { full_name: string | null; email: string } }[])
          .sort((x, y) => y.revision_no - x.revision_no);
        const latest = subs[0];
        const draft = one(a.form_drafts as unknown as { updated_at: string } | null);
        return (
          <section className="panel" key={a.id} style={{ marginTop: "1.4rem" }}>
            <h3>{a.title} <Badge>{a.status.replace("_", " ")}</Badge> <span className="muted-note">template v{v.version}{a.due_date ? ` · due ${fmtDate(a.due_date)}` : ""}</span></h3>
            {draft && <p className="muted-note">Draft last saved {fmtDateTime(draft.updated_at)}</p>}
            {a.status === "submitted" && <ActionButton variant="link" action={reopenAssignment.bind(null, id, a.id)}>Reopen for changes</ActionButton>}
            {latest ? (
              <>
                <p className="muted-note">Revision {latest.revision_no} submitted {fmtDateTime(latest.submitted_at)} by {latest.profiles?.full_name || latest.profiles?.email}{latest.change_summary ? ` · changed: ${latest.change_summary}` : ""}</p>
                {subs.length > 1 && <p className="muted-note">Earlier revisions: {subs.slice(1).map((s) => `#${s.revision_no} (${fmtDate(s.submitted_at)})`).join(", ")}</p>}
                <dl className="kv" style={{ marginTop: "0.8rem" }}>
                  {visibleQuestions(v.schema, latest.answers, (a.context ?? {}) as FormContext).filter((q) => q.type !== "note").map((q) => (
                    <Fragment key={q.id}>
                      <dt>{q.label}{q.flag === "additional_scope" && <> <Badge attention>Additional scope</Badge></>}</dt>
                      <dd style={{ whiteSpace: "pre-wrap" }}>{show(latest.answers[q.id]) || <span className="muted-note">—</span>}</dd>
                    </Fragment>
                  ))}
                </dl>
              </>
            ) : <p className="muted-note">Not submitted yet.</p>}
          </section>
        );
      })}
    </>
  );
}
