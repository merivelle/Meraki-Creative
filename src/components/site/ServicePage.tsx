import Link from "next/link";
import { getBlock, getContent } from "@/lib/content/queries";
import type { CategoryId } from "@/lib/content/types";
import { breadcrumbs, faqNode, graph, pageNode, serviceNode } from "@/lib/seo";
import { JsonLd } from "./JsonLd";
import { WorkCard } from "./WorkCard";
import { CtaBand, FaqSection, IndexList, PackageCard, PageHero, Rule, Schedule, serviceRows } from "./blocks";

export type ServicePageConfig = {
  category: CategoryId;
  path: string;
  title: string;
  description: string;
  crumb: string;
  schema: { name: string; serviceType: string };
  hero: { meta: [string, string]; title: React.ReactNode; lede: string };
  services: { slate: string; heading: string; lede: string };
  work: { slate: string; heading: string; grid: "work-grid-2" | "work-grid-3"; onlyFeatured: boolean; lede?: React.ReactNode };
  pricingLede: React.ReactNode;
  cta: { heading: string; lede: string };
};

export async function ServicePage({ cfg }: { cfg: ServicePageConfig }) {
  const content = await getContent();
  const process = await getBlock("services.process");
  const services = content.services.filter((s) => s.categoryId === cfg.category);
  const packages = content.packages.filter((p) => p.categoryId === cfg.category);
  const faqs = content.faqs.filter((f) => f.scope === cfg.category);
  const work = content.portfolio.filter(
    (w) => w.categories.includes(cfg.category) && (!cfg.work.onlyFeatured || w.featured),
  );
  const startHref = `/start?service=${cfg.category}`;

  return (
    <>
      <JsonLd data={graph(
        pageNode("WebPage", cfg.path, cfg.title, cfg.description),
        serviceNode(cfg.path, cfg.schema.name, cfg.schema.serviceType, cfg.description),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: cfg.crumb, path: cfg.path }]),
        ...(faqs.length ? [faqNode(cfg.path, faqs)] : []),
      )} />

      <PageHero meta={cfg.hero.meta} title={cfg.hero.title} lede={cfg.hero.lede}>
        <div className="btn-group">
          <Link href={startHref} className="btn btn-primary">Start Your Project</Link>
          <Link href={`/work?service=${cfg.category}`} className="btn btn-secondary">See the Work</Link>
        </div>
      </PageHero>

      <Rule />

      <section className="section">
        <div className="wrap">
          <div className="index-head reveal">
            <span className="slate-tag">{cfg.services.slate}</span>
            <h2 className="display display-lg">{cfg.services.heading}</h2>
          </div>
          <p className="lede reveal" style={{ marginBottom: "2rem" }}>{cfg.services.lede}</p>
          <IndexList rows={serviceRows(services)} />
        </div>
      </section>

      {work.length > 0 && (
        <>
          <Rule />
          <section className="section">
            <div className="wrap">
              <div className="index-head reveal">
                <span className="slate-tag">{cfg.work.slate}</span>
                <h2 className="display display-md">{cfg.work.heading}</h2>
              </div>
              <div className={`${cfg.work.grid} reveal`}>
                {work.map((w) => <WorkCard key={w.id} item={w} />)}
              </div>
              {cfg.work.lede && <p className="lede reveal" style={{ marginTop: "2rem" }}>{cfg.work.lede}</p>}
            </div>
          </section>
        </>
      )}

      <Rule />

      <Schedule slate="Process" heading={process.heading} steps={process.steps} />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <p className="lede reveal">{process.intro}</p>
        </div>
      </section>

      {packages.length > 0 && (
        <>
          <Rule />
          <section className="section">
            <div className="wrap">
              <div className="index-head reveal">
                <span className="slate-tag">Starting Points</span>
                <h2 className="display display-md">What it costs.</h2>
              </div>
              <div className="pkg-feature reveal">
                {packages.map((p) => <PackageCard key={p.id} pkg={p} withId={false} compact detailsHref={`/packages#${p.slug}`} />)}
              </div>
              <p className="lede reveal" style={{ marginTop: "2rem" }}>{cfg.pricingLede}</p>
            </div>
          </section>
        </>
      )}

      <Rule />

      <FaqSection faqs={faqs} />

      <CtaBand
        slate="Los Angeles · Booking 2026"
        heading={cfg.cta.heading}
        lede={cfg.cta.lede}
        primary={{ href: startHref, label: "Start Your Project" }}
        secondary={{ href: "/packages", label: "View Packages" }}
      />
    </>
  );
}
