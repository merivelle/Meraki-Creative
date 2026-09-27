import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { Badge } from "@/components/app/AppShell";

export default async function FormsAdmin() {
  const { supabase } = await requireStaffPage();
  const { data } = await supabase.from("form_templates").select("id, key, title, service_category, form_template_versions(id, version, published_at)").order("title");
  return (
    <>
      <h1>Questionnaires</h1>
      <p className="app-sub">Reusable templates. Each client answers a fixed, published version, so editing a template never changes what someone already answered.</p>
      <ul className="timeline">
        {(data ?? []).map((t) => {
          const versions = (t.form_template_versions as { id: string; version: number; published_at: string | null }[]).sort((a, b) => b.version - a.version);
          const live = versions.find((v) => v.published_at);
          return <li key={t.id}><Link href={`/admin/forms/${t.id}`} className="txt-link">{t.title}</Link> <span className="muted-note">· {t.key}</span> {live && <Badge>v{live.version} live</Badge>} {versions[0] && !versions[0].published_at && <Badge attention>v{versions[0].version} draft</Badge>}</li>;
        })}
      </ul>
      {!data?.length && <p className="muted-note">No templates yet. Run <code>npm run seed:content</code> to install the website and edit questionnaires.</p>}
    </>
  );
}
