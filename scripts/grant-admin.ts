/**
 * Grant studio (admin) access to an existing account. Run by a person with the
 * service-role key; there is deliberately no way to do this from the website.
 *
 *   npm run grant-admin -- --email you@example.com [--role owner|admin] [--create]
 *   npm run grant-admin -- --email someone@example.com --revoke
 *
 * --create makes the auth account if it doesn't exist and prints a one-time link to set a
 * password (the link is shown in this terminal only; it is not emailed).
 */
import { adminClient, arg } from "./_client";

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const role = arg("role") ?? "owner";
  if (!email) throw new Error("Pass --email");
  if (!["owner", "admin"].includes(role)) throw new Error("--role must be owner or admin");
  const db = adminClient();

  let { data: profile } = await db.from("profiles").select("id, email").ilike("email", email).maybeSingle();
  if (!profile && process.argv.includes("--create")) {
    const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (error || !data.user) throw new Error(error?.message);
    profile = { id: data.user.id, email };
    console.log(`Created account for ${email}.`);
  }
  if (!profile) throw new Error(`No account for ${email}. Re-run with --create.`);

  if (process.argv.includes("--revoke")) {
    await db.from("staff_roles").delete().eq("user_id", profile.id);
    console.log(`Removed studio access for ${email}.`);
    return;
  }

  const { error } = await db.from("staff_roles").upsert({ user_id: profile.id, role });
  if (error) throw new Error(error.message);
  await db.from("audit_log").insert({ action: "staff_role.granted", entity_type: "profile", entity_id: profile.id, after: { role }, source: "system", reason: "grant-admin script" });
  console.log(`${email} now has studio access (${role}).`);

  if (process.argv.includes("--create")) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data: link } = await db.auth.admin.generateLink({ type: "magiclink", email });
    const hash = link?.properties?.hashed_token;
    if (hash) console.log(`\nOne-time sign-in link (valid ~1 hour). Open it, then choose a password:\n${site}/auth/confirm?token_hash=${hash}&type=magiclink&next=/account/set-password?next=/admin\n`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
