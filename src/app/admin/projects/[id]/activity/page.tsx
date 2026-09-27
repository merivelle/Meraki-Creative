import { requireStaffPage } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { fmtDateTime, one } from "@/lib/labels";

export default async function AdminActivityTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const [{ data: log }, { data: notes }] = await Promise.all([
    supabase.from("audit_log").select("id, action, source, reason, before, after, created_at, profiles:actor_id(full_name, email)").eq("project_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("notifications").select("id, title, audience, created_at, email_deliveries(status, last_error, to_email)").eq("project_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  return (
    <>
      <h2>Audit log</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>When</th><th>Who</th><th>What</th><th>Source</th><th>Reason</th></tr></thead>
          <tbody>
            {(log ?? []).map((l) => {
              const a = l.profiles as unknown as { full_name: string | null; email: string } | null;
              return <tr key={l.id}><td>{fmtDateTime(l.created_at)}</td><td>{a?.full_name || a?.email || "System"}</td><td>{l.action}</td>
                <td><Badge attention={l.source === "manual" && /paid|signed/.test(l.action)}>{l.source}</Badge></td><td>{l.reason ?? ""}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <h2>Notifications and emails</h2>
      <ul className="timeline">
        {(notes ?? []).map((n) => {
          const d = one(n.email_deliveries as unknown as { status: string; last_error: string | null; to_email: string } | null);
          return <li key={n.id}>{n.title} <span className="muted-note">· {n.audience} · {fmtDateTime(n.created_at)}</span> {d && <><Badge attention={d.status === "failed"}>{d.status}</Badge> <span className="muted-note">{d.to_email}{d.last_error ? ` · ${d.last_error}` : ""}</span></>}</li>;
        })}
      </ul>
    </>
  );
}
