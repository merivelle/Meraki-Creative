/**
 * Integration-test helpers. Runs against the Supabase project in .env.local (a DEV
 * project — never production). Every row created here is labelled [TEST] and flagged
 * is_dev_fixture so it's easy to spot and clean up.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const configured = Boolean(url && anonKey && serviceKey);

export const admin = () => createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
export const anon = () => createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

export const RUN = randomUUID().slice(0, 8);
export const PASSWORD = `Test-${RUN}-Aa1!`;

export async function makeUser(label: string): Promise<{ id: string; email: string }> {
  const email = `test-${label}-${RUN}@example.test`;
  const { data, error } = await admin().auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  return { id: data.user.id, email };
}

export async function signIn(email: string): Promise<SupabaseClient> {
  const c = anon();
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn: ${error.message}`);
  return c;
}

/** A client + project, with `userId` as an explicit member of the project. */
export async function makeClientProject(label: string, userId: string | null, category = "web_design") {
  const db = admin();
  const { data: client, error } = await db.from("clients")
    .insert({ display_name: `[TEST] ${label} ${RUN}`, client_type: "actor", is_dev_fixture: true }).select("id").single();
  if (error || !client) throw new Error(`client: ${error?.message}`);
  const { data: project, error: e2 } = await db.from("projects")
    .insert({ client_id: client.id, title: `[TEST] ${label} ${RUN}`, service_category: category, is_dev_fixture: true }).select("id").single();
  if (e2 || !project) throw new Error(`project: ${e2?.message}`);
  if (userId) {
    await db.from("client_members").insert({ client_id: client.id, user_id: userId });
    await db.from("project_members").insert({ project_id: project.id, user_id: userId });
  }
  return { clientId: client.id as string, projectId: project.id as string };
}
