import { requireProjectAccess } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { Badge } from "@/components/app/AppShell";
import { fmtDateTime } from "@/lib/labels";
import { postMessage } from "@/app/portal/actions";

export default async function MessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProjectAccess(id, "page");
  const { data: messages } = await supabase.from("project_messages")
    .select("id, body, kind, created_at, parent_id, profiles:author_id(full_name, email)")
    .eq("project_id", id).order("created_at");

  return (
    <>
      <h2>Messages</h2>
      <p className="app-sub">Updates from the studio and your replies, all in one place. Everyone on the project can see this thread.</p>
      {!messages?.length && <p className="muted-note">No messages yet.</p>}
      {(messages ?? []).map((m) => {
        const a = m.profiles as unknown as { full_name: string | null; email: string } | null;
        return (
          <div className="message" key={m.id}>
            <p className="meta">{a?.full_name || a?.email} · {fmtDateTime(m.created_at)} {m.kind === "update" && <Badge>Update</Badge>}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
          </div>
        );
      })}
      <h3>Write a message</h3>
      <ActionForm action={postMessage.bind(null, id)} submitLabel="Send" pendingLabel="Sending…">
        <div className="field"><label htmlFor="body">Message</label><textarea id="body" name="body" rows={4} required maxLength={10000} /></div>
      </ActionForm>
    </>
  );
}
