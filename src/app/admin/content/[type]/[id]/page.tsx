import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage, isUuid } from "@/lib/auth/guards";
import { ENTITIES, isEntityType } from "@/lib/content/entities";
import { ActionForm } from "@/components/app/ActionForm";
import { ActionButton } from "@/components/app/ActionButton";
import { Badge } from "@/components/app/AppShell";
import { saveContent, setContentStatus } from "@/app/admin/_actions/content";
import { CONTENT_TYPES } from "../../types";

type R = Record<string, unknown>;
const v = (r: R | null, k: string) => (r?.[k] == null ? "" : String(r[k]));

function F({ k, label, r, type = "text", rows, help }: { k: string; label: string; r: R | null; type?: string; rows?: number; help?: string }) {
  const id = `c-${k}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {help && <p className="field-note">{help}</p>}
      {rows ? <textarea id={id} name={k} rows={rows} defaultValue={v(r, k)} /> : <input id={id} name={k} type={type} defaultValue={v(r, k)} />}
    </div>
  );
}

const CATS = [["web-design", "Web Design"], ["post-production", "Post-Production"], ["creative-materials", "Creative Materials"], ["bundles", "Bundles"]];

function Category({ r, name = "category_id" }: { r: R | null; name?: string }) {
  return (
    <div className="field"><label htmlFor="c-cat">Category</label>
      <select id="c-cat" name={name} defaultValue={v(r, name)}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
  );
}

function Fields({ type, r }: { type: string; r: R | null }) {
  switch (type) {
    case "package":
      return (<>
        <Category r={r} />
        <div className="form-row"><F k="name" label="Name" r={r} /><F k="slug" label="Slug" r={r} help="Used in links like /start?package=demo-reel. Changing it breaks old links." /></div>
        <div className="form-row"><F k="price_display" label="Price, exactly as shown" r={r} help="e.g. From $95, or Quote on request" /><F k="group_title" label="Group heading" r={r} /></div>
        <F k="label" label="Small label" r={r} />
        <div className="field"><label htmlFor="c-included">Included (one per line)</label><textarea id="c-included" name="included" rows={5} defaultValue={((r?.included as string[]) ?? []).join("\n")} /></div>
        <F k="tagline" label="Tagline" r={r} />
        <label className="choice"><input type="checkbox" name="featured" defaultChecked={Boolean(r?.featured)} /> Featured</label>
        <F k="sort" label="Order" r={r} type="number" />
      </>);
    case "service":
      return (<>
        <Category r={r} />
        <div className="form-row"><F k="title" label="Title" r={r} /><F k="role_label" label="Short tag" r={r} /></div>
        <F k="description" label="Description" r={r} rows={3} />
        <F k="summary" label="Homepage line (leave empty to keep it off the homepage)" r={r} />
        <F k="sort" label="Order" r={r} type="number" />
      </>);
    case "portfolio_item": {
      const cats = (r?.categories as string[]) ?? [];
      return (<>
        <div className="form-row"><F k="title" label="Title" r={r} /><F k="slug" label="Slug (/work/…)" r={r} /></div>
        <div className="form-row"><F k="client_name" label="Client" r={r} /><F k="type_label" label="Type label" r={r} help="e.g. Actor Site, Trailer Edit" /></div>
        <div className="field"><span className="field-label">Services</span><div className="choice-list">
          {CATS.slice(0, 3).map(([k, l]) => <label key={k} className="choice"><input type="checkbox" name="categories" value={k} defaultChecked={cats.includes(k)} /> {l}</label>)}</div></div>
        <div className="field"><label htmlFor="c-layout">Layout</label>
          <select id="c-layout" name="layout" defaultValue={v(r, "layout") || "site"}>
            {["site", "reel", "film", "scene", "trailer", "grade"].map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        <F k="description" label="Description" r={r} rows={3} />
        <F k="contribution" label="My contribution" r={r} />
        <div className="form-row"><F k="live_url" label="Live website" r={r} type="url" /><F k="url_label" label="Browser-bar text (website cards)" r={r} /></div>
        <div className="field"><label htmlFor="c-vl">Video links: label | url (one per line)</label>
          <textarea id="c-vl" name="video_links" rows={2} defaultValue={((r?.video_links as { label: string; url: string }[]) ?? []).map((l) => `${l.label} | ${l.url}`).join("\n")} /></div>
        <div className="field"><label htmlFor="c-img">Images (JSON)</label>
          <p className="field-note">[{"{"}&quot;src&quot;: &quot;/assets/work/…&quot;, &quot;alt&quot;: &quot;…&quot;, &quot;role&quot;: &quot;cover | before | after | poster&quot;{"}"}]</p>
          <textarea id="c-img" name="images" rows={5} className="code" style={{ minHeight: 0 }} defaultValue={JSON.stringify(r?.images ?? [], null, 2)} /></div>
        <div className="field"><label htmlFor="c-vid">Video (JSON or empty)</label>
          <p className="field-note">{"{"}&quot;kind&quot;: &quot;file | youtube | vimeo&quot;, &quot;src&quot;: &quot;…&quot;, &quot;poster&quot;: &quot;…&quot;{"}"}</p>
          <textarea id="c-vid" name="video" rows={4} className="code" style={{ minHeight: 0 }} defaultValue={r?.video ? JSON.stringify(r.video, null, 2) : ""} /></div>
        <label className="choice"><input type="checkbox" name="featured" defaultChecked={Boolean(r?.featured)} /> Featured (shown on service pages)</label>
        <F k="sort" label="Order" r={r} type="number" />
      </>);
    }
    case "testimonial":
      return (<>
        <F k="pull_quote" label="Pull-quote (shown large)" r={r} help="A short line from the quote, in their words. Leave empty to use the first sentence." />
        <F k="quote" label="Quote" r={r} rows={5} />
        <div className="form-row"><F k="name" label="Name" r={r} /><F k="role_label" label="Role" r={r} /></div>
        <F k="sort" label="Order" r={r} type="number" />
      </>);
    case "faq":
      return (<>
        <div className="field"><label htmlFor="c-scope">Shown on</label>
          <select id="c-scope" name="scope" defaultValue={v(r, "scope") || "web-design"}>
            <option value="web-design">Web Design</option><option value="post-production">Post-Production</option>
            <option value="creative-materials">Creative Materials</option><option value="general">General</option></select></div>
        <F k="question" label="Question" r={r} />
        <F k="answer" label="Answer" r={r} rows={4} />
        <F k="sort" label="Order" r={r} type="number" />
      </>);
    case "content_block":
      return (<>
        <div className="form-row"><F k="page" label="Page" r={r} help="home, services, or site" /><F k="key" label="Block" r={r} help="e.g. process, status" /></div>
        <div className="field"><label htmlFor="c-data">Content (JSON)</label>
          <textarea id="c-data" name="data" className="code" defaultValue={JSON.stringify(r?.data ?? {}, null, 2)} /></div>
      </>);
  }
  return null;
}

export default async function ContentEditor({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!isEntityType(type)) notFound();
  const { supabase } = await requireStaffPage();
  const isNew = id === "new";
  if (!isNew && !isUuid(id)) notFound();
  const { data: row } = isNew ? { data: null } : await supabase.from(ENTITIES[type].table).select("*").eq("id", id).maybeSingle();
  if (!isNew && !row) notFound();
  const cfg = CONTENT_TYPES[type];

  return (
    <>
      <p className="muted-note"><Link href={`/admin/content/${type}`} className="txt-link">{cfg.title}</Link></p>
      <h1>{isNew ? `New ${cfg.singular}` : String(row?.[cfg.titleCol] ?? cfg.singular)} {row && <Badge attention={row.status === "draft"}>{row.status}</Badge>}</h1>
      <ActionForm action={saveContent.bind(null, type, isNew ? null : id)} resetOnSuccess={false} submitLabel={isNew ? "Create draft" : "Save"}>
        <Fields type={type} r={row} />
      </ActionForm>
      {row && (
        <p className="btn-group" style={{ marginTop: "1rem" }}>
          <a href={`/api/preview?path=${encodeURIComponent(cfg.previewPath(row as Record<string, string>))}`} className="btn btn-secondary btn-small" target="_blank" rel="noopener">Preview</a>
          <ActionButton variant="primary" action={setContentStatus.bind(null, type, id, "publish")}>Publish</ActionButton>
          {row.status === "published" && <ActionButton action={setContentStatus.bind(null, type, id, "unpublish")}>Unpublish</ActionButton>}
          <ActionButton action={setContentStatus.bind(null, type, id, "archive")} confirmText="Archive and remove from the site?">Archive</ActionButton>
        </p>
      )}
    </>
  );
}
