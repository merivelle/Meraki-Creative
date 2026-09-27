import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { NEXT_ACTION_LABELS, SERVICE_CATEGORY_LABELS, STAGE_LABELS, STATE_LABELS, fmtDate, fmtDateTime, label } from "@/lib/labels";
import { markNotificationsRead } from "./actions";

export default async function PortalHome() {
  const { supabase, user } = await requireUser("/portal");
  const [{ data: projects }, { data: profile }, { data: notes }] = await Promise.all([
    supabase.from("project_overview").select("*").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("notifications").select("id, title, body, link_path, created_at, read_at")
      .eq("recipient_user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);
  const unread = (notes ?? []).filter((n) => !n.read_at).length;

  return (
    <>
      <h1>Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
      <p className="app-sub">Your projects with Meraki Creative, and what each one needs from you next.</p>

      {!projects?.length && (
        <p className="notice">There are no projects on your account yet. When the studio adds you to one, it&apos;ll show up here.</p>
      )}

      <div className="app-grid">
        {(projects ?? []).map((p) => (
          <Link key={p.id} href={`/portal/projects/${p.id}`} className="panel" style={{ display: "block" }}>
            <h2 style={{ marginTop: 0 }}>{p.title}</h2>
            <p className="muted-note">{label(SERVICE_CATEGORY_LABELS, p.service_category)}{p.due_date ? ` · target ${fmtDate(p.due_date)}` : ""}</p>
            <p style={{ margin: "0.6rem 0" }}>
              <Badge>{label(STAGE_LABELS, p.stage)}</Badge>{" "}
              {p.state !== "active" && <Badge attention>{label(STATE_LABELS, p.state)}</Badge>}
            </p>
            <p><b>Next from you:</b> {p.next_action ? NEXT_ACTION_LABELS[p.next_action] : "Nothing right now"}</p>
          </Link>
        ))}
      </div>

      <h2>Updates {unread > 0 && <Badge attention>{unread} new</Badge>}</h2>
      {notes?.length ? (
        <>
          <ul className="timeline">
            {notes.map((n) => (
              <li key={n.id}>
                {n.link_path ? <Link href={n.link_path} className="txt-link">{n.title}</Link> : n.title}{" "}
                <span className="muted-note">· {fmtDateTime(n.created_at)}</span>
              </li>
            ))}
          </ul>
          {unread > 0 && <form action={markNotificationsRead}><button className="txt-link">Mark all as read</button></form>}
        </>
      ) : <p className="muted-note">Nothing yet.</p>}
    </>
  );
}
