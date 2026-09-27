import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContent } from "@/lib/content/queries";
import { CATEGORY_LABELS } from "@/lib/content/types";
import { seedContent } from "@/content/seed";
import { breadcrumbs, graph, pageMetadata, pageNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { WorkMedia } from "@/components/site/WorkCard";
import { CtaBand, PageHero, Rule } from "@/components/site/blocks";

type Params = { params: Promise<{ slug: string }> };

// Pre-render the seeded work; anything published later renders on demand.
export function generateStaticParams() {
  return seedContent.portfolio.map((p) => ({ slug: p.slug }));
}

async function find(slug: string) {
  const { portfolio } = await getContent();
  return portfolio.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const item = await find((await params).slug);
  if (!item) return {};
  const kind = item.typeLabel ?? CATEGORY_LABELS[item.categories[0]] ?? "Work";
  const description = item.description ?? `${item.title}: ${kind.toLowerCase()} by Meraki Creative, a Los Angeles creative studio for storytellers.`;
  return pageMetadata({ path: `/work/${item.slug}`, title: `${item.title} — ${kind} | Meraki Creative`, description });
}

export default async function WorkItemPage({ params }: Params) {
  const item = await find((await params).slug);
  if (!item) notFound();
  const path = `/work/${item.slug}`;
  const primaryCategory = item.categories[0];

  const facts = [
    item.clientName && { k: "Client", v: item.clientName },
    { k: "Service", v: item.categories.map((c) => CATEGORY_LABELS[c]).join(", ") },
    item.typeLabel && { k: "Type", v: item.typeLabel },
    item.contribution && { k: "My part", v: item.contribution },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <>
      <JsonLd data={graph(
        pageNode("WebPage", path, item.title, item.description ?? item.title),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }, { name: item.title, path }]),
      )} />

      <PageHero meta={["Work", item.typeLabel ?? CATEGORY_LABELS[primaryCategory]]} title={item.title} lede={item.description ?? undefined} />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="work-grid-2 reveal" style={{ gridTemplateColumns: "1fr" }}>
            <figure><WorkMedia item={item} /></figure>
          </div>
        </div>
      </section>

      <Rule />

      <section className="section">
        <div className="wrap">
          <div className="index-list reveal">
            {facts.map((f) => (
              <div className="index-row" key={f.k}><span className="role">{f.k}</span><span className="title">{f.v}</span><span className="desc" /></div>
            ))}
          </div>
          <div className="btn-group reveal" style={{ marginTop: "2rem" }}>
            {item.liveUrl && <a href={item.liveUrl} target="_blank" rel="noopener" className="btn btn-secondary">Visit the live site</a>}
            {item.videoLinks.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener" className="btn btn-secondary">{l.label}</a>
            ))}
            <Link href={`/work?service=${primaryCategory}`} className="txt-link">More {CATEGORY_LABELS[primaryCategory].toLowerCase()} work</Link>
          </div>
        </div>
      </section>

      <CtaBand
        slate="Your work belongs here next"
        heading={<>Start with<br />the story.</>}
        primary={{ href: `/start?service=${primaryCategory}`, label: "Start Your Project" }}
        secondary={{ href: "/work", label: "All work" }}
      />
    </>
  );
}
