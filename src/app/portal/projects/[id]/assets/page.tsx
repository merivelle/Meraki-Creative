import { requireProjectAccess } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { ActionForm } from "@/components/app/ActionForm";
import { AssetUploader } from "@/components/app/AssetUploader";
import { ASSET_STATUS_LABELS, fmtDate, label } from "@/lib/labels";
import { FILE_TYPE_GROUPS, allowedMimes } from "@/lib/files/policy";
import { addAssetLink, saveAssetNote } from "@/app/portal/actions";

export default async function AssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProjectAccess(id, "page");
  const [{ data: requests }, { data: items }] = await Promise.all([
    supabase.from("asset_requests").select("*").eq("project_id", id).order("sort"),
    supabase.from("asset_items").select("id, asset_request_id, url, label, created_at, files(id, original_name, size_bytes, upload_status)").eq("project_id", id).order("created_at"),
  ]);

  return (
    <>
      <h2>Files and links</h2>
      <p className="app-sub">
        Everything the studio has asked for, in one checklist. Large footage goes through a private transfer link
        (Frame.io, Google Drive, Dropbox, WeTransfer) rather than an upload. Please don&apos;t share passwords here.
      </p>
      {!requests?.length && <p className="muted-note">Nothing requested yet.</p>}
      {(requests ?? []).map((r) => {
        const mine = (items ?? []).filter((i) => i.asset_request_id === r.id);
        const open = r.status !== "accepted";
        return (
          <section className="panel" key={r.id} style={{ marginBottom: "1rem" }}>
            <h3>{r.title} <Badge attention={r.status === "missing" || r.status === "needs_replacement"}>{label(ASSET_STATUS_LABELS, r.status)}</Badge></h3>
            {r.description && <p style={{ whiteSpace: "pre-wrap" }}>{r.description}</p>}
            {r.due_date && <p className="muted-note">Needed by {fmtDate(r.due_date)}</p>}
            {r.studio_note && <p className="notice"><b>From the studio:</b> {r.studio_note}</p>}
            {mine.length > 0 && (
              <ul className="timeline">
                {mine.map((i) => {
                  const f = i.files as unknown as { id: string; original_name: string; size_bytes: number; upload_status: string } | null;
                  return (
                    <li key={i.id}>
                      {f ? <a href={`/api/files/${f.id}`} className="txt-link">{f.original_name}</a>
                        : <a href={i.url!} target="_blank" rel="noopener noreferrer" className="txt-link">{i.label || i.url}</a>}
                    </li>
                  );
                })}
              </ul>
            )}
            {open && (
              <div className="stack-sm">
                {r.kind !== "link" && (
                  <AssetUploader
                    requestId={r.id}
                    accept={allowedMimes(r.accepted_types).join(",")}
                    hint={(r.accepted_types.length ? r.accepted_types : Object.keys(FILE_TYPE_GROUPS).filter((k) => k !== "video_short"))
                      .map((k: string) => FILE_TYPE_GROUPS[k]?.label).filter(Boolean).join(", ")}
                  />
                )}
                {r.kind !== "file" && (
                  <ActionForm action={addAssetLink.bind(null, r.id)} inline submitLabel="Add link">
                    <div className="field"><label htmlFor={`url-${r.id}`}>Link</label><input id={`url-${r.id}`} name="url" type="url" placeholder="https://" required /></div>
                    <div className="field"><label htmlFor={`label-${r.id}`}>Label (optional)</label><input id={`label-${r.id}`} name="label" /></div>
                  </ActionForm>
                )}
                <ActionForm action={saveAssetNote.bind(null, r.id)} resetOnSuccess={false} submitLabel="Save note">
                  <div className="field"><label htmlFor={`note-${r.id}`}>Note for the studio</label>
                    <textarea id={`note-${r.id}`} name="client_note" rows={2} defaultValue={r.client_note ?? ""} /></div>
                </ActionForm>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
