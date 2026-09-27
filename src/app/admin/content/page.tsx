import Link from "next/link";
import { requireStaffPage } from "@/lib/auth/guards";
import { ENTITIES } from "@/lib/content/entities";
import { CONTENT_TYPES, type ContentTypeKey } from "./types";

export default async function ContentHub() {
  const { supabase } = await requireStaffPage();
  const counts = await Promise.all(Object.entries(CONTENT_TYPES).map(async ([k]) => {
    const table = ENTITIES[k as keyof typeof ENTITIES].table;
    const [{ count: total }, { count: drafts }] = await Promise.all([
      supabase.from(table).select("id", { count: "exact", head: true }).neq("status", "archived"),
      supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "draft"),
    ]);
    return [k as ContentTypeKey, total ?? 0, drafts ?? 0] as const;
  }));
  return (
    <>
      <h1>Website content</h1>
      <p className="app-sub">Edit, preview, then publish. Nothing changes on the public site until you publish.</p>
      <p className="btn-group">
        <a href="/api/preview?path=/" className="btn btn-secondary btn-small">Preview the site with drafts</a>
        <a href="/api/preview?disable=1&path=/admin/content" className="txt-link">Turn off preview</a>
      </p>
      <div className="app-grid">
        {counts.map(([k, total, drafts]) => (
          <Link key={k} href={`/admin/content/${k}`} className="panel" style={{ display: "block" }}>
            <h2 style={{ marginTop: 0 }}>{CONTENT_TYPES[k].title}</h2>
            <p className="muted-note">{total} item{total === 1 ? "" : "s"}{drafts ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}</p>
          </Link>
        ))}
      </div>
      <p className="muted-note" style={{ marginTop: "1.4rem" }}>Structured editing only. Layout and visual design stay in code for now.</p>
    </>
  );
}
