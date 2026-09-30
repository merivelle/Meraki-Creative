import Link from "next/link";
import { getContent } from "@/lib/content/queries";
import { breadcrumbs, faqNode, graph, pageMetadata, pageNode, serviceNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { WorkCard } from "@/components/site/WorkCard";
import { CtaBand } from "@/components/site/blocks";
import { Faqs, LineIcon, ProcessRows, QuickViews, ServiceCards, cardIndex } from "@/components/site/Services";
import { INCLUDED_HIGHLIGHTS, PRICING_NOTE_SHORT, PROCESS, WEB_AREA, WEB_STUDIO } from "@/content/web-design";

const PATH = "/web-design";
const TITLE = "Website Design for Actors & Filmmakers | Los Angeles";
const DESCRIPTION =
  "Website design for actors, directors, filmmakers, and creative businesses in Los Angeles, with clear starting prices: from $650 for an actor site.";

// Three selected examples, one per kind of site (all client work).
const SELECTED = ["emily-loaiza", "boomerang", "angelique-antoniou"];

export const metadata = pageMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

export default async function WebDesignPage() {
  const content = await getContent();
  const faqs = content.faqs.filter((f) => f.scope === "web-design");
  const selected = SELECTED.map((slug) => content.portfolio.find((p) => p.slug === slug)).filter((p) => !!p);
  const startHref = "/start?service=web-design";

  return (
    <>
      <JsonLd data={graph(
        pageNode("WebPage", PATH, TITLE, DESCRIPTION),
        serviceNode(PATH, "Website Design for Actors and Filmmakers", "Website design", DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: "Web Design", path: PATH }]),
        ...(faqs.length ? [faqNode(PATH, faqs)] : []),
      )} />

      {/* ============ HERO PANEL (illustration + tags) ============ */}
      <section className="wd-section wd-first">
        <div className="wrap">
          <div className="wd-hero">
            <div className="wd-hero-copy">
              <span className="slate">Web Design · Los Angeles</span>
              <h1 className="display display-xl">Website design for storytellers.</h1>
              <p className="lede">Websites for actors, filmmakers, and creative businesses. Your work, your story, and your contact details in one site, designed around the people you want to reach.</p>
              <div className="btn-group">
                <Link href={startHref} className="btn btn-primary">Start Your Project</Link>
                <Link href="#services" className="btn btn-secondary">See the services</Link>
              </div>
            </div>
            <div className="wd-hero-art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/onboarding/service-web.webp" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="wd-section" id="services">
        <div className="wrap">
          <div className="wd-head reveal">
            <h2 className="display display-md">A site for every story.</h2>
            <p className="body-2">{PRICING_NOTE_SHORT}</p>
          </div>
          <ServiceCards services={WEB_STUDIO} area={WEB_AREA} />
        </div>
      </section>

      {/* ============ SELECTED WEBSITES ============ */}
      {selected.length > 0 && (
        <section className="wd-section">
          <div className="wrap">
            <div className="wd-head reveal">
              <h2 className="display display-md">Sites we&apos;ve built.</h2>
              <Link href="/work?service=web-design" className="btn btn-secondary">See all websites</Link>
            </div>
            <div className="work-grid-3 wd-work reveal">
              {selected.map((w) => <WorkCard key={w!.id} item={w!} />)}
            </div>
          </div>
        </section>
      )}

      {/* ============ INCLUDED IN EVERY WEBSITE ============ */}
      <section className="wd-section">
        <div className="wrap">
          <div className="wd-head reveal">
            <h2 className="display display-md">Included in every website.</h2>
          </div>
          <ul className="wd-cards wd-cards-4 reveal">
            {INCLUDED_HIGHLIGHTS.map((h, i) => (
              <li className="wd-card wd-card-sm" key={h.title}>
                <span className="wd-card-num">{cardIndex(i)}</span>
                <span className="wd-card-art wd-card-icon"><LineIcon name={h.icon} /></span>
                <h3 className="wd-card-title">{h.title}</h3>
                <p className="wd-card-body">{h.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ PROCESS (tone-stepped rows, like "What we do") ============ */}
      <section className="wd-section">
        <div className="wrap">
          <div className="wd-head reveal">
            <h2 className="display display-md">How a site comes together.</h2>
          </div>
          <div className="reveal">
            <ProcessRows items={PROCESS.map((p) => ({ title: p.title, body: <p>{p.body}</p> }))} />
          </div>
        </div>
      </section>

      {/* ============ FAQ (hairline accordion) ============ */}
      <section className="wd-section">
        <div className="wrap wd-faq-wrap">
          <h2 className="display display-md reveal">Before you ask.</h2>
          <div className="reveal">
            <Faqs items={faqs.map((f) => ({ title: f.question, body: <p>{f.answer}</p> }))} />
          </div>
        </div>
      </section>

      <CtaBand
        slate="Los Angeles · Booking 2026"
        heading="Let's build your home."
        lede="Tell us what you're making, what materials you have, and when you'd like it live. We'll help define the scope and send a clear quote."
        primary={{ href: startHref, label: "Start Your Project" }}
      />

      <QuickViews services={WEB_STUDIO} area={WEB_AREA} />
    </>
  );
}
