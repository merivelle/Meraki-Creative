import { requireStaffPage } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { Badge } from "@/components/app/AppShell";
import { ASSET_STATUS_LABELS, fmtDate, fmtDateTime, label } from "@/lib/labels";
import { FILE_TYPE_GROUPS } from "@/lib/files/policy";
import { addAssetRequest, notifyAssetsRequested, reviewAssetRequest } from "@/app/admin/_actions/projects";

export default async function AdminAssetsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaffPage();
  const [{ data: requests }, { data: items }] = await Promise.all([
    supabase.from("asset_requests").select("*").eq("project_id", id).order("sort"),
    supabase.from("asset_items").select("id, asset_request_id, url, label, created_at, files(id, original_name, size_bytes)").eq("project_id", id).order("created_at"),
  ]);
  return (
    <>
      <h2>Checklist</h2>
      <p><ActionButton action={notifyAssetsRequested.bind(null, id)}>Email the client about this checklist</ActionButton></p>
      {(requests ?? []).map((r) => (
        <section className="panel" key={r.id} style={{ marginBottom: "1rem" }}>
          <h3>{r.title} <Badge attention={r.status === "uploaded"}>{label(ASSET_STATUS_LABELS, r.status)}</Badge> <span className="muted-note">{r.kind}{r.due_date ? ` · due ${fmtDate(r.due_date)}` : ""}</span></h3>
          {r.description && <p className="muted-note">{r.description}</p>}
          {r.client_note && <p><b>Client note:</b> {r.client_note}</p>}
          <ul className="timeline">
            {(items ?? []).filter((i) => i.asset_request_id === r.id).map((i) => {
              const f = i.files as unknown as { id: string; original_name: string; size_bytes: number } | null;
              return <li key={i.id}>{f ? <a href={`/api/files/${f.id}`} className="txt-link">{f.original_name}</a> : <a href={i.url!} className="txt-link" target="_blank" rel="noopener noreferrer">{i.label || i.url}</a>} <span className="muted-note">{fmtDateTime(i.created_at)}</span></li>;
            })}
          </ul>
          <ActionForm action={reviewAssetRequest.bind(null, id, r.id)} inline resetOnSuccess={false} submitLabel="Update">
            <div className="field"><label htmlFor={`st-${r.id}`}>Status</label>
              <select id={`st-${r.id}`} name="status" defaultValue={r.status}>{Object.entries(ASSET_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="field" style={{ minWidth: 260 }}><label htmlFor={`sn-${r.id}`}>Note to client</label><input id={`sn-${r.id}`} name="studio_note" defaultValue={r.studio_note ?? ""} /></div>
          </ActionForm>
        </section>
      ))}
      <h2>Request something</h2>
      <ActionForm action={addAssetRequest.bind(null, id)} submitLabel="Add to checklist">
        <div className="form-row">
          <div className="field"><label htmlFor="ar-title">What you need</label><input id="ar-title" name="title" required placeholder="e.g. Current headshots" /></div>
          <div className="field"><label htmlFor="ar-kind">How</label>
            <select id="ar-kind" name="kind" defaultValue="either"><option value="either">File or link</option><option value="file">File upload</option><option value="link">Link only (e.g. large footage)</option></select></div>
        </div>
        <div className="field"><label htmlFor="ar-desc">Details for the client</label><textarea id="ar-desc" name="description" rows={2} /></div>
        <div className="field"><span className="field-label">Accepted file types (none = all common types)</span>
          <div className="choice-list">{Object.entries(FILE_TYPE_GROUPS).map(([k, g]) => <label key={k} className="choice"><input type="checkbox" name="accepted_types" value={k} /> {g.label}</label>)}</div></div>
        <div className="form-row">
          <div className="field"><label htmlFor="ar-max">Max size per file (MB, up to 100)</label><input id="ar-max" name="max_mb" type="number" min={1} max={100} placeholder="25" /></div>
          <div className="field"><label htmlFor="ar-due">Needed by</label><input id="ar-due" name="due_date" type="date" /></div>
        </div>
      </ActionForm>
    </>
  );
}
