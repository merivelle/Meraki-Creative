import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/auth/guards";
import { ENTITIES, isEntityType } from "@/lib/content/entities";
import { Badge } from "@/components/app/AppShell";
import { ActionButton } from "@/components/app/ActionButton";
import { fmtDateTime } from "@/lib/labels";
import { setContentStatus } from "@/app/admin/_actions/content";
import { CONTENT_TYPES } from "../types";

export default async function ContentList({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<{ archived?: string }> }) {
  const { type } = await params;
  const { archived } = await searchParams;
  if (!isEntityType(type)) notFound();
  const { supabase } = await requireStaffPage();
  const cfg = CONTENT_TYPES[type];
  let q = supabase.from(ENTITIES[type].table).select("*").order("sort", { ascending: true, nullsFirst: false });
  if (!archived) q = q.neq("status", "archived");
  const { data } = await q;
  return (
    <>
      <p className="muted-note"><Link href="/admin/content" className="txt-link">Website content</Link></p>
      <h1>{cfg.title}</h1>
      <p className="btn-group">
        <Link href={`/admin/content/${type}/new`} className="btn btn-primary btn-small">Add a {cfg.singular}</Link>
        <Link href={archived ? `/admin/content/${type}` : `/admin/content/${type}?archived=1`} className="txt-link">{archived ? "Hide archived" : "Show archived"}</Link>
      </p>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Item</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {(data ?? []).map((r: Record<string, unknown>) => {
              const id = r.id as string;
              const status = r.status as string;
              const title = type === "content_block" ? `${r.page}.${r.key}` : String(r[cfg.titleCol] ?? "");
              const changed = status === "published" && Boolean(r.published_at && r.updated_at) && new Date(r.updated_at as string) > new Date(r.published_at as string);
              return (
                <tr key={id}>
                  <td><Link href={`/admin/content/${type}/${id}`} className="txt-link">{title.slice(0, 90)}</Link></td>
                  <td><Badge attention={status === "draft"}>{status}</Badge>{changed && <> <Badge attention>unpublished changes</Badge></>}</td>
                  <td>{fmtDateTime(r.updated_at as string)}</td>
                  <td className="stack-sm">
                    {(status !== "published" || changed) && <ActionButton variant="link" action={setContentStatus.bind(null, type, id, "publish")}>Publish</ActionButton>}
                    {status === "published" && <ActionButton variant="link" action={setContentStatus.bind(null, type, id, "unpublish")}>Unpublish</ActionButton>}
                    {status !== "archived" && <ActionButton variant="link" action={setContentStatus.bind(null, type, id, "archive")} confirmText="Archive this and remove it from the site?">Archive</ActionButton>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
