import { requireUser } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { submitWorkRequest } from "@/app/portal/actions";

export default async function NewRequestPage() {
  const { supabase, user } = await requireUser("/portal/requests/new");
  const [{ data: memberships }, { data: projects }] = await Promise.all([
    supabase.from("client_members").select("client_id, clients(display_name)").eq("user_id", user.id),
    supabase.from("projects").select("id, title, client_id").order("created_at", { ascending: false }),
  ]);
  const clients = (memberships ?? []).map((m) => ({ id: m.client_id, name: (m.clients as unknown as { display_name: string } | null)?.display_name ?? "" }));

  return (
    <>
      <h1>Maintenance or more work</h1>
      <p className="app-sub">Need an update to something we made, or something new? Describe it here and you&apos;ll get a written reply.</p>
      {!clients.length ? <p className="notice">This is available once you have a project with the studio.</p> : (
        <ActionForm action={submitWorkRequest} submitLabel="Send request" pendingLabel="Sending…">
          <div className="field">
            <label htmlFor="client_id">For</label>
            <select id="client_id" name="client_id" defaultValue={clients[0].id}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="project_id">Related project (optional)</label>
            <select id="project_id" name="project_id" defaultValue="">
              <option value="">None</option>
              {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="kind">Type</label>
            <select id="kind" name="kind" defaultValue="maintenance">
              <option value="maintenance">Maintenance or an update</option>
              <option value="additional_work">New or additional work</option>
            </select>
          </div>
          <div className="field"><label htmlFor="description">What do you need?</label><textarea id="description" name="description" rows={5} required maxLength={5000} /></div>
          <div className="field"><label htmlFor="desired_date">Ideal date (optional)</label><input id="desired_date" name="desired_date" type="date" /></div>
        </ActionForm>
      )}
    </>
  );
}
