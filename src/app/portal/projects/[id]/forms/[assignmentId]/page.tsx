import { notFound } from "next/navigation";
import { requireProjectAccess, isUuid } from "@/lib/auth/guards";
import type { Answers, FormContext, FormDefinition } from "@/lib/forms/types";
import { fmtDateTime } from "@/lib/labels";
import { QuestionnaireForm } from "@/components/app/QuestionnaireForm";

export default async function QuestionnairePage({ params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { id, assignmentId } = await params;
  if (!isUuid(assignmentId)) notFound();
  const { supabase } = await requireProjectAccess(id, "page");
  const { data: a } = await supabase.from("form_assignments")
    .select("id, title, status, context, due_date, form_template_versions(version, schema)")
    .eq("id", assignmentId).eq("project_id", id).maybeSingle();
  if (!a) notFound();
  const version = a.form_template_versions as unknown as { version: number; schema: FormDefinition };
  const [{ data: draft }, { data: subs }] = await Promise.all([
    supabase.from("form_drafts").select("answers, updated_at").eq("assignment_id", a.id).maybeSingle(),
    supabase.from("form_submissions").select("id, revision_no, submitted_at, change_summary, answers").eq("assignment_id", a.id).order("revision_no", { ascending: false }),
  ]);
  const latest = subs?.[0];
  const initial = (draft?.answers ?? latest?.answers ?? {}) as Answers;

  return (
    <>
      <h2>{a.title}</h2>
      {version.schema.intro && <p className="app-sub">{version.schema.intro}</p>}
      {latest && (
        <p className="muted-note">
          Submitted {fmtDateTime(latest.submitted_at)}{latest.revision_no > 1 ? ` (revision ${latest.revision_no})` : ""}.
          {subs && subs.length > 1 && ` Earlier versions are kept on record.`}
        </p>
      )}
      <QuestionnaireForm
        assignmentId={a.id}
        def={version.schema}
        ctx={(a.context ?? {}) as FormContext}
        initial={initial}
        status={a.status}
        isAmendment={Boolean(latest)}
        lastSaved={draft?.updated_at ?? null}
      />
    </>
  );
}
