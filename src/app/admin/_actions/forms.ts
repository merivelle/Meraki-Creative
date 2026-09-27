"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guards";
import { validateDefinition } from "@/lib/forms/engine";
import type { FormDefinition } from "@/lib/forms/types";
import { audit } from "@/lib/audit";
import { ok, fail, str, type Result } from "./shared";

/**
 * Questionnaire templates are versioned. A published version is immutable (DB trigger),
 * so editing always happens on a new draft version; existing assignments keep pointing
 * at the version the client actually answered.
 */
export async function createDraftVersion(templateId: string): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const { data: latest } = await supabase.from("form_template_versions").select("version, schema, published_at")
    .eq("template_id", templateId).order("version", { ascending: false }).limit(1).single();
  if (!latest) return fail("Template has no versions.");
  if (!latest.published_at) redirect(`/admin/forms/${templateId}`); // a draft already exists
  const next = latest.version + 1;
  const schema = { ...(latest.schema as FormDefinition), version: next };
  const { error } = await supabase.from("form_template_versions").insert({ template_id: templateId, version: next, schema, created_by: user.id });
  if (error) return fail(error.message);
  revalidatePath(`/admin/forms/${templateId}`);
  return ok(`Draft version ${next} created.`);
}

export async function saveDraftVersion(versionId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireStaff();
  let def: FormDefinition;
  try {
    def = JSON.parse(str(fd, "schema", 400000));
  } catch {
    return fail("That isn't valid JSON.");
  }
  const problems = validateDefinition(def);
  if (problems.length) return fail(problems.slice(0, 8).join(" "));
  const { data: v } = await supabase.from("form_template_versions").select("version, published_at, template_id").eq("id", versionId).single();
  if (!v || v.published_at) return fail("Published versions can't be edited. Create a new draft version.");
  const { error } = await supabase.from("form_template_versions").update({ schema: { ...def, version: v.version }, notes: str(fd, "notes", 1000) || null }).eq("id", versionId);
  if (error) return fail(error.message);
  revalidatePath(`/admin/forms/${v.template_id}`);
  return ok("Draft saved.");
}

export async function publishVersion(versionId: string): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const { data: v } = await supabase.from("form_template_versions").select("schema, template_id, published_at").eq("id", versionId).single();
  if (!v) return fail("Not found.");
  if (v.published_at) return ok("Already published.");
  const problems = validateDefinition(v.schema);
  if (problems.length) return fail(problems.slice(0, 8).join(" "));
  const { error } = await supabase.from("form_template_versions").update({ published_at: new Date().toISOString() }).eq("id", versionId);
  if (error) return fail(error.message);
  await audit({ actorId: user.id, action: "form_version.published", entityType: "form_template_version", entityId: versionId, source: "manual" });
  revalidatePath(`/admin/forms/${v.template_id}`);
  return ok("Published. New assignments will use this version; existing ones keep theirs.");
}
