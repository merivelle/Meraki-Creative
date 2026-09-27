import Link from "next/link";
import { requireProjectAccess } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { fmtDate } from "@/lib/labels";

export default async function ReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProjectAccess(id, "page");
  const { data: versions } = await supabase.from("review_version_state").select("*").eq("project_id", id)
    .order("published_at", { ascending: false });

  return (
    <>
      <h2>Reviews</h2>
      <p className="app-sub">Each version gets one combined set of notes. Approve a version when it&apos;s right; approval applies to that version only.</p>
      {!versions?.length && <p className="muted-note">Nothing to review yet.</p>}
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Review</th><th>Version</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {(versions ?? []).map((v) => (
              <tr key={v.id}>
                <td><Link href={`/portal/projects/${id}/reviews/${v.id}`} className="txt-link">{v.title}</Link></td>
                <td>v{v.version_no}{!v.is_latest && " (older)"}</td>
                <td>{fmtDate(v.due_date)}</td>
                <td>
                  {v.approval_id ? <Badge>Approved</Badge>
                    : v.feedback_status === "submitted" ? <Badge>Notes sent</Badge>
                    : v.is_latest ? <Badge attention>Waiting for your notes</Badge>
                    : <Badge>Superseded</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
