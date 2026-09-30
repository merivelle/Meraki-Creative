import Link from "next/link";
import { filterPortfolio, getContent } from "@/lib/content/queries";
import { CATEGORY_LABELS, type CategoryId } from "@/lib/content/types";
import { breadcrumbs, graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { WorkSections } from "@/components/site/WorkCard";
import { CtaBand, PageHero } from "@/components/site/blocks";

const TITLE = "Portfolio — Reels, Film Edits & Client Websites | Meraki Creative";
const DESCRIPTION =
  "Selected work from a Los Angeles studio: demo reels, short films, trailers, and client websites for actors and filmmakers.";

export const metadata = pageMetadata({ path: "/work", title: TITLE, description: DESCRIPTION });

const FILTERS: CategoryId[] = ["web-design", "post-production"];

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const active = FILTERS.find((f) => f === service) ?? null;
  const { portfolio } = await getContent();
  const items = filterPortfolio(portfolio, active);
  // Only offer filters that have published work behind them.
  const filters = FILTERS.filter((f) => portfolio.some((p) => p.categories.includes(f)));

  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("CollectionPage", "/work", TITLE, DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }]))} />

      <PageHero
        meta={["Work", "Selected work"]}
        title={<>Stories we&apos;ve<br />helped shape.</>}
        lede="A look at the editing and the websites. The footage and projects are real; the cut and the build are the craft. Every piece is made to let the work speak for itself."
      >
        <div className="btn-group">
          <Link href={active ? `/start?service=${active}` : "/start"} className="btn btn-primary">Start Your Project</Link>
        </div>
        <nav className="btn-group" aria-label="Filter work by service" style={{ marginTop: "1.2rem" }}>
          <Link href="/work" className="txt-link" aria-current={active ? undefined : "page"}>All work</Link>
          {filters.map((f) => (
            <Link key={f} href={`/work?service=${f}`} className="txt-link" aria-current={active === f ? "page" : undefined}>
              {CATEGORY_LABELS[f]}
            </Link>
          ))}
        </nav>
      </PageHero>

      {items.length ? <WorkSections items={items} /> : (
        <section className="section"><div className="wrap"><p className="lede">Nothing published here yet.</p></div></section>
      )}

      <CtaBand
        slate="Your work belongs here next"
        heading={<>Let&apos;s make<br />something.</>}
        primary={{ href: "/start", label: "Start Your Project" }}
        secondary={{ href: "/services", label: "View Services" }}
      />
    </>
  );
}
