/**
 * DEVELOPMENT FIXTURES ONLY. Creates two clearly labelled [DEV] clients, each with one
 * project and one client user, so access rules and flows can be tried end to end.
 * Refuses to run against a URL that doesn't look like a dev project unless --force.
 *
 *   npm run seed:dev
 */
import { adminClient, arg } from "./_client";

const PASSWORD = arg("password") ?? "DevOnly-Passw0rd!";

async function user(db: ReturnType<typeof adminClient>, email: string, name: string) {
  const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } });
  if (error || !data.user) throw new Error(error?.message);
  await db.from("profiles").update({ password_set_at: new Date().toISOString(), full_name: name }).eq("id", data.user.id);
  return data.user.id;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url) && !process.argv.includes("--force")) {
    console.error(`Refusing to add dev fixtures to ${url}. If this is your dev project, re-run with --force.`);
    process.exit(1);
  }
  const db = adminClient();
  const { data: tpl } = await db.from("stage_templates").select("service_category, title, requires_approval, sort");
  for (const [n, category] of [["A", "web_design"], ["B", "post_production"]] as const) {
    const email = `dev-client-${n.toLowerCase()}@example.test`;
    const uid = await user(db, email, `[DEV] Client ${n}`);
    let { data: client } = await db.from("clients").select("id").eq("display_name", `[DEV] Client ${n}`).maybeSingle();
    if (!client) {
      ({ data: client } = await db.from("clients").insert({ display_name: `[DEV] Client ${n}`, client_type: n === "A" ? "actor" : "director", primary_email: email, is_dev_fixture: true }).select("id").single());
    }
    let { data: project } = await db.from("projects").select("id").eq("client_id", client!.id).maybeSingle();
    if (!project) {
      ({ data: project } = await db.from("projects").insert({ client_id: client!.id, title: `[DEV] Project ${n}`, service_category: category, stage: "discovery", is_dev_fixture: true }).select("id").single());
      await db.from("milestones").insert((tpl ?? []).filter((t) => t.service_category === category).map((t) => ({ project_id: project!.id, title: t.title, requires_approval: t.requires_approval, sort: t.sort })));
    }
    await db.from("client_members").upsert({ client_id: client!.id, user_id: uid });
    await db.from("project_members").upsert({ project_id: project!.id, user_id: uid });
    console.log(`[DEV] Client ${n}: ${email} / project ${project!.id}`);
  }
  console.log(`\nDev client password: ${PASSWORD}  (development only)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
