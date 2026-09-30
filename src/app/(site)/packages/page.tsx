import Link from "next/link";
import { getContent } from "@/lib/content/queries";
import { CATEGORY_LABELS, type CategoryId } from "@/lib/content/types";
import { breadcrumbs, graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { CtaBand, PackageGroups, PageHero } from "@/components/site/blocks";

const TITLE = "Editing Packages With Pricing | Meraki Creative";
const DESCRIPTION =
  "Real starting prices for demo reel edits, scene edits, and trailers, plus two bundles. Every package can be tailored.";

export const metadata = pageMetadata({ path: "/packages", title: TITLE, description: DESCRIPTION });

// Organized by service category, each with its own anchor, so visitors can jump
// straight to their craft. The original per-package anchors (#reel-refresh …) still work.
// Website pricing lives on the Web Design pages (/web-design and /web-design/<service>).
const ORDER: { id: CategoryId; anchor: string }[] = [
  { id: "post-production", anchor: "post-production" },
  { id: "bundles", anchor: "bundles" },
];

export default async function PackagesPage() {
  const { packages } = await getContent();

  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("WebPage", "/packages", TITLE, DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Packages", path: "/packages" }]))} />

      <PageHero
        meta={["Packages", "Clear scope, clear price"]}
        title={<>Where<br />to begin.</>}
        lede={<>Starting points for editing, plus two bundles that cover everything together. Every package can be tailored, and if you don&apos;t see your exact fit, we&apos;ll build a custom quote. Website prices are on the <Link href="/web-design#services" className="txt-link">Web Design</Link> pages.</>}
      >
        <div className="btn-group">
          <Link href="/start" className="btn btn-primary">Start Your Project</Link>
          <Link href="/services" className="btn btn-secondary">View Services</Link>
        </div>
        <nav className="btn-group" aria-label="Package categories" style={{ marginTop: "1.2rem" }}>
          {ORDER.map((c) => (
            <a key={c.id} href={`#${c.anchor}`} className="txt-link">{CATEGORY_LABELS[c.id]}</a>
          ))}
        </nav>
      </PageHero>

      {ORDER.map((c, i) => {
        const list = packages.filter((p) => p.categoryId === c.id);
        if (!list.length) return null;
        return (
          <div id={c.anchor} key={c.id}>
            {c.id === "bundles" ? (
              <section className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
                <div className="wrap">
                  <div className="index-head reveal"><h2 className="display display-md">Everything, together.</h2></div>
                </div>
              </section>
            ) : null}
            <PackageGroups packages={list} firstPadded={i === 0} />
          </div>
        );
      })}

      <CtaBand
        slate="Something else in mind?"
        heading={<>Every package bends<br />to fit your work.</>}
        lede="Mix services, add more, or start small. Tell us the goal and we'll send a tailored plan and quote."
        primary={{ href: "/start", label: "Request a Custom Quote" }}
      />
    </>
  );
}
