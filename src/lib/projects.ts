import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Copy the default milestone list for a service category into a new project.
 * NOT a server action (lives outside "use server" files) — callers authorize first.
 */
export async function copyMilestones(projectId: string, category: string) {
  const admin = createAdminClient();
  const { data: tpl } = await admin.from("stage_templates")
    .select("title, description, requires_approval, sort").eq("service_category", category).order("sort");
  if (tpl?.length) await admin.from("milestones").insert(tpl.map((t) => ({ ...t, project_id: projectId })));
}
