import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage, isUuid } from "@/lib/auth/guards";
import { ProjectTabs } from "@/components/app/ProjectTabs";
import { Badge } from "@/components/app/AppShell";
import { AGREEMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS, STAGE_LABELS, STATE_LABELS, label } from "@/lib/labels";

export default async function AdminProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase } = await requireStaffPage();
  const { data: p } = await supabase.from("project_overview").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const base = `/admin/projects/${id}`;
  return (
    <>
      <p className="muted-note"><Link href="/admin/projects" className="txt-link">All projects</Link> · <Link href={`/admin/clients/${p.client_id}`} className="txt-link">{p.client_name}</Link></p>
      <h1>{p.title}</h1>
      <p style={{ margin: "0.4rem 0" }}>
        <Badge>{label(STAGE_LABELS, p.stage)}</Badge>{" "}
        {p.state !== "active" && <Badge attention>{label(STATE_LABELS, p.state)}</Badge>}{" "}
        <Badge>Agreement: {label(AGREEMENT_STATUS_LABELS, p.agreement_status)}</Badge>{" "}
        <Badge attention={p.payment_status === "overdue"}>Payment: {label(PAYMENT_STATUS_LABELS, p.payment_status)}</Badge>
      </p>
      <ProjectTabs tabs={[
        { href: base, label: "Overview" },
        { href: `${base}/forms`, label: "Questionnaires" },
        { href: `${base}/assets`, label: "Files" },
        { href: `${base}/reviews`, label: "Reviews" },
        { href: `${base}/messages`, label: "Messages" },
        { href: `${base}/documents`, label: "Proposal · agreement · invoices" },
        { href: `${base}/deliverables`, label: "Deliverables" },
        { href: `${base}/activity`, label: "Activity" },
      ]} />
      {children}
    </>
  );
}
