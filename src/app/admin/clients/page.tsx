import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { CLIENT_TYPE_LABELS, fmtDate, label } from "@/lib/labels";

export default async function ClientsPage() {
  const { supabase } = await requireStaffPage();
  const { data } = await supabase.from("clients").select("id, display_name, business_name, client_type, primary_email, created_at, is_dev_fixture, projects(id)").order("display_name");
  return (
    <>
      <h1>Clients</h1>
      <p><Link href="/admin/clients/new" className="btn btn-primary btn-small">Add a client</Link></p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Type</th><th>Email</th><th>Projects</th><th>Since</th></tr></thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/clients/${c.id}`} className="txt-link">{c.display_name}</Link>{c.is_dev_fixture && " [DEV]"}{c.business_name && <><br /><span className="muted-note">{c.business_name}</span></>}</td>
                <td>{label(CLIENT_TYPE_LABELS, c.client_type)}</td>
                <td>{c.primary_email ?? "—"}</td>
                <td>{(c.projects as unknown[]).length}</td>
                <td>{fmtDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
