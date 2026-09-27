import { requireProjectAccess } from "@/lib/auth/guards";
import { ProjectTabs } from "@/components/app/ProjectTabs";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project } = await requireProjectAccess(id, "page");
  const base = `/portal/projects/${id}`;
  return (
    <>
      <p className="muted-note"><a href="/portal" className="txt-link">All projects</a></p>
      <h1>{project.title}</h1>
      <ProjectTabs tabs={[
        { href: base, label: "Overview" },
        { href: `${base}/forms`, label: "Questionnaires" },
        { href: `${base}/assets`, label: "Files and links" },
        { href: `${base}/reviews`, label: "Reviews" },
        { href: `${base}/documents`, label: "Proposal, agreement, invoices" },
        { href: `${base}/messages`, label: "Messages" },
        { href: `${base}/deliverables`, label: "Deliverables" },
      ]} />
      {children}
    </>
  );
}
