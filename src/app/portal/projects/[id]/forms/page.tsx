import Link from "next/link";
import { requireProjectAccess } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";
import { fmtDate } from "@/lib/labels";

const STATUS: Record<string, string> = { assigned: "Not started", in_progress: "In progress", submitted: "Submitted", reopened: "Reopened for changes" };

export default async function FormsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireProjectAccess(id, "page");
  const { data: forms } = await supabase.from("form_assignments").select("id, title, status, due_date").eq("project_id", id).order("created_at");
  return (
    <>
      <h2>Questionnaires</h2>
      {!forms?.length && <p className="muted-note">No questionnaires yet.</p>}
      <ul className="timeline">
        {(forms ?? []).map((f) => (
          <li key={f.id}>
            <Link href={`/portal/projects/${id}/forms/${f.id}`} className="txt-link">{f.title}</Link>{" "}
            <Badge attention={f.status !== "submitted"}>{STATUS[f.status]}</Badge>
            {f.due_date && <span className="muted-note"> · due {fmtDate(f.due_date)}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
