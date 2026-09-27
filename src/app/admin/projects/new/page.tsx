import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { createProject } from "@/app/admin/_actions/projects";

export default async function NewProjectPage() {
  const { supabase } = await requireStaffPage();
  const { data: clients } = await supabase.from("clients").select("id, display_name").order("display_name");
  return (
    <>
      <h1>New project</h1>
      {!clients?.length ? <p>Add a <Link href="/admin/clients/new" className="txt-link">client</Link> first, or convert an inquiry.</p> : (
        <ActionForm action={createProject} submitLabel="Create project">
          <div className="field">
            <label htmlFor="client_id">Client</label>
            <select id="client_id" name="client_id" required>{clients.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}</select>
          </div>
          <div className="form-row">
            <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" required /></div>
            <div className="field">
              <label htmlFor="service_category">Service</label>
              <select id="service_category" name="service_category">
                <option value="web_design">Web design</option><option value="post_production">Post-production</option>
                <option value="creative_materials">Creative materials</option><option value="bundle">Bundle</option>
              </select>
            </div>
          </div>
          <div className="field"><label htmlFor="due_date">Target date</label><input id="due_date" name="due_date" type="date" /></div>
          <p className="muted-note">The default milestones for the service are added automatically; edit them on the project.</p>
        </ActionForm>
      )}
    </>
  );
}
