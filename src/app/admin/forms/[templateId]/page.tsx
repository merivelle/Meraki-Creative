import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage, isUuid } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { Badge } from "@/components/app/AppShell";
import { FormPreview } from "@/components/app/FormPreview";
import { fmtDateTime } from "@/lib/labels";
import type { FormDefinition } from "@/lib/forms/types";
import { createDraftVersion, publishVersion, saveDraftVersion } from "@/app/admin/_actions/forms";

export default async function TemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  if (!isUuid(templateId)) notFound();
  const { supabase } = await requireStaffPage();
  const { data: t } = await supabase.from("form_templates").select("*").eq("id", templateId).maybeSingle();
  if (!t) notFound();
  const { data: versions } = await supabase.from("form_template_versions").select("id, version, schema, notes, published_at, created_at").eq("template_id", templateId).order("version", { ascending: false });
  const latest = versions?.[0];
  const { count } = await supabase.from("form_assignments").select("id", { count: "exact", head: true }).in("template_version_id", (versions ?? []).map((v) => v.id));

  return (
    <>
      <p className="muted-note"><Link href="/admin/forms" className="txt-link">All questionnaires</Link></p>
      <h1>{t.title}</h1>
      <p className="app-sub">{count ?? 0} assignment{count === 1 ? "" : "s"} across all versions.</p>
      <ul className="timeline">
        {(versions ?? []).map((v) => <li key={v.id}>v{v.version} {v.published_at ? <Badge>published {fmtDateTime(v.published_at)}</Badge> : <Badge attention>draft</Badge>} {v.notes && <span className="muted-note">· {v.notes}</span>}</li>)}
      </ul>
      {latest?.published_at ? (
        <p><ActionButton action={createDraftVersion.bind(null, templateId)}>Start a new draft version</ActionButton></p>
      ) : latest ? (
        <>
          <h2>Edit draft v{latest.version}</h2>
          <p className="muted-note">
            Structured JSON: sections → questions (id, type, label, required, options, allowUnknown, showIf). Question types:
            text, textarea, email, url, url_list, reference_list, select, radio, multiselect, yes_no_unsure, date, number,
            repeatable_group, note. Never add questions that ask for passwords or keys.
          </p>
          <ActionForm action={saveDraftVersion.bind(null, latest.id)} resetOnSuccess={false} submitLabel="Save draft">
            <div className="field"><label htmlFor="notes">What changed</label><input id="notes" name="notes" defaultValue={latest.notes ?? ""} /></div>
            <div className="field"><label htmlFor="schema">Definition</label><textarea id="schema" name="schema" className="code" defaultValue={JSON.stringify(latest.schema, null, 2)} /></div>
          </ActionForm>
          <p style={{ marginTop: "0.8rem" }}><ActionButton variant="primary" action={publishVersion.bind(null, latest.id)} confirmText="Publish this version? It can't be edited afterwards.">Publish v{latest.version}</ActionButton></p>
        </>
      ) : null}
      {latest && (
        <>
          <h2>Preview (v{latest.version})</h2>
          <FormPreview def={latest.schema as FormDefinition} />
        </>
      )}
    </>
  );
}
