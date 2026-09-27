import { requireStaffPage } from "@/lib/auth/guards";
import { integrationStatus, serverEnv } from "@/lib/server-env";
import { Badge } from "@/components/app/AppShell";
import { ActionButton } from "@/components/app/ActionButton";
import { fmtDateTime } from "@/lib/labels";
import { retryAllFailed, retryEmail } from "@/app/admin/_actions/settings";

const INTEGRATIONS: [keyof ReturnType<typeof integrationStatus>, string, string][] = [
  ["supabase", "Supabase (database, auth, storage)", "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"],
  ["resend", "Resend (email sending)", "RESEND_API_KEY and EMAIL_FROM on a verified merakicreative.co domain"],
  ["studioNotifyEmail", "Studio alert address", "STUDIO_NOTIFY_EMAIL"],
  ["stripe", "Stripe (hosted invoices + verified webhook)", "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"],
  ["turnstile", "Cloudflare Turnstile (optional spam check)", "NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY"],
  ["cron", "Scheduled email retries", "CRON_SECRET"],
  ["signingProvider", "E-signature provider", "Not integrated: agreements use external signing links"],
];

export default async function SettingsPage() {
  const { supabase } = await requireStaffPage();
  const status = integrationStatus();
  const [{ data: failed }, { data: recent }, { data: staff }] = await Promise.all([
    supabase.from("email_deliveries").select("id, to_email, subject, status, attempts, last_error, last_attempt_at").in("status", ["failed", "pending", "sending"]).order("created_at", { ascending: false }).limit(50),
    supabase.from("email_deliveries").select("id, to_email, subject, status, attempts, last_attempt_at").order("created_at", { ascending: false }).limit(25),
    supabase.from("staff_roles").select("role, granted_at, profiles:user_id(full_name, email)"),
  ]);

  return (
    <>
      <h1>Settings</h1>

      <h2>Integrations</h2>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Service</th><th>Status</th><th>Needs</th></tr></thead>
        <tbody>{INTEGRATIONS.map(([k, name, needs]) => (
          <tr key={k}><td>{name}</td><td><Badge attention={!status[k]}>{status[k] ? "Configured" : "Not configured"}</Badge></td><td className="muted-note">{needs}</td></tr>
        ))}</tbody>
      </table></div>
      {!status.resend && <p className="notice">Email isn&apos;t configured, so nothing is actually sent. Messages are recorded as <b>dev_skipped</b> and logged on the server.</p>}
      <p className="muted-note">Studio alerts go to: {serverEnv.studioNotifyEmail || "(not set)"}. Change it in the hosting environment settings.</p>

      <h2 id="email">Email that needs attention</h2>
      {failed?.length ? (
        <>
          <p><ActionButton action={retryAllFailed}>Retry all</ActionButton></p>
          <div className="table-scroll"><table className="data-table">
            <thead><tr><th>To</th><th>Subject</th><th>Status</th><th>Attempts</th><th>Last error</th><th /></tr></thead>
            <tbody>{failed.map((d) => (
              <tr key={d.id}><td>{d.to_email}</td><td>{d.subject}</td><td><Badge attention>{d.status}</Badge></td><td>{d.attempts}</td>
                <td className="muted-note">{d.last_error ?? ""}<br />{fmtDateTime(d.last_attempt_at)}</td>
                <td><ActionButton variant="link" action={retryEmail.bind(null, d.id)}>Retry</ActionButton></td></tr>
            ))}</tbody>
          </table></div>
        </>
      ) : <p className="muted-note">All clear.</p>}

      <h2>Recent email</h2>
      <ul className="timeline">{(recent ?? []).map((d) => <li key={d.id}>{d.subject} → {d.to_email} <Badge attention={d.status === "failed"}>{d.status}</Badge> <span className="muted-note">{fmtDateTime(d.last_attempt_at)}</span></li>)}</ul>

      <h2>Studio accounts</h2>
      <ul className="timeline">{(staff ?? []).map((s, i) => {
        const p = s.profiles as unknown as { full_name: string | null; email: string };
        return <li key={i}>{p.full_name || p.email} <Badge>{s.role}</Badge></li>;
      })}</ul>
      <p className="muted-note">Studio access is granted from the command line only (<code>npm run grant-admin</code>); see docs/ADMIN_SETUP.md. It can&apos;t be granted from the website, so no client account can promote itself.</p>
    </>
  );
}
