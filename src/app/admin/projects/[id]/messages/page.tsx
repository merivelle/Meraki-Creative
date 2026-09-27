import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { Badge } from "@/components/app/AppShell";
import { fmtDateTime } from "@/lib/labels";
import { postStudioMessage } from "@/app/admin/_actions/projects";

export default async function AdminMessagesTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const { data: messages } = await supabase.from("project_messages").select("id, body, kind, created_at, profiles:author_id(full_name, email)").eq("project_id", id).order("created_at");
  return (
    <>
      <p className="notice">Everything on this tab is visible to the client. Use the internal notes on the Overview tab for anything private.</p>
      {(messages ?? []).map((m) => {
        const a = m.profiles as unknown as { full_name: string | null; email: string } | null;
        return <div className="message" key={m.id}><p className="meta">{a?.full_name || a?.email} · {fmtDateTime(m.created_at)} {m.kind === "update" && <Badge>Update</Badge>}</p><p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p></div>;
      })}
      <h2>Write to the client</h2>
      <ActionForm action={postStudioMessage.bind(null, id)} submitLabel="Send">
        <div className="field"><label htmlFor="kind">Type</label>
          <select id="kind" name="kind"><option value="message">Message</option><option value="update">Project update (shown on the overview)</option></select></div>
        <div className="field"><label htmlFor="body">Message</label><textarea id="body" name="body" rows={5} required /></div>
      </ActionForm>
    </>
  );
}
