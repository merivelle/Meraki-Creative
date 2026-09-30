import Link from "next/link";
import { getContent } from "@/lib/content/queries";
import { breadcrumbs, faqNode, graph, pageMetadata, pageNode, serviceNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { WorkCard } from "@/components/site/WorkCard";
import { CtaBand } from "@/components/site/blocks";
import { Faqs, LineIcon, ProcessRows, QuickViews, ServiceCards, cardIndex } from "@/components/site/Services";
import { POST_AREA, POST_INCLUDED, POST_PRICING_NOTE, POST_PROCESS, POST_SERVICES } from "@/content/post-production";

const PATH = "/post-production";
const TITLE = "Post-Production & Video Editing in Los Angeles | Meraki Creative";
const DESCRIPTION =
  "Film, trailer, teaser, scene, and demo reel editing in Los Angeles, with clear starting prices: from $150 for a demo reel.";

// Three selected edits, one per kind of cut.
const SELECTED = ["director-demo-reel", "i-felt-butterflies", "opa"];

export const metadata = pageMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

export default async function PostProductionPage() {
  const content = await getContent();
  const faqs = content.faqs.filter((f) => f.scope === "post-production");
  const selected = SELECTED.map((slug) => content.portfolio.find((p) => p.slug === slug)).filter((p) => !!p);
  const startHref = "/start?service=post-production";

  return (
    <>
      <JsonLd data={graph(
        pageNode("WebPage", PATH, TITLE, DESCRIPTION),
        serviceNode(PATH, "Post-Production and Video Editing", "Video editing and post-production", DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: "Post-Production", path: PATH }]),
        ...(faqs.length ? [faqNode(PATH, faqs)] : []),
      )} />

      {/* ============ HERO PANEL ============ */}
      <section className="wd-section wd-first">
        <div className="wrap">
          <div className="wd-hero">
            <div className="wd-hero-copy">
              <span className="slate">Post-Production · Los Angeles</span>
              {/* Non-breaking hyphen keeps "Post-production" on one line. */}
              <h1 className="display display-xl">Post‑production for storytellers.</h1>
              <p className="lede">Film, trailer, scene, and demo reel editing out of Los Angeles, by a director who has been cutting since she was eight years old. Story, pacing, and sound, handled in one place.</p>
              <div className="btn-group">
                <Link href={startHref} className="btn btn-primary">Start Your Project</Link>
                <Link href="#services" className="btn btn-secondary">See the services</Link>
              </div>
            </div>
            <div className="wd-hero-art" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/onboarding/service-post.webp" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="wd-section" id="services">
        <div className="wrap">
          <div className="wd-head reveal">
            <h2 className="display display-md">An edit for every story.</h2>
            <p className="body-2">{POST_PRICING_NOTE}</p>
          </div>
          <ServiceCards services={POST_SERVICES} area={POST_AREA} />
        </div>
      </section>

      {/* ============ SELECTED EDITS ============ */}
      {selected.length > 0 && (
        <section className="wd-section">
          <div className="wrap">
            <div className="wd-head reveal">
              <h2 className="display display-md">Stories we&apos;ve helped shape.</h2>
              <Link href="/work?service=post-production" className="btn btn-secondary">See all edits</Link>
            </div>
            <div className="work-grid-3 wd-work reveal">
              {selected.map((w) => <WorkCard key={w!.id} item={w!} />)}
            </div>
          </div>
        </section>
      )}

      {/* ============ INCLUDED IN EVERY EDIT ============ */}
      <section className="wd-section">
        <div className="wrap">
          <div className="wd-head reveal">
            <h2 className="display display-md">Included in every edit.</h2>
          </div>
          <ul className="wd-cards wd-cards-4 reveal">
            {POST_INCLUDED.map((h, i) => (
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
            <h2 className="display display-md">How an edit comes together.</h2>
          </div>
          <div className="reveal">
            <ProcessRows items={POST_PROCESS.map((p) => ({ title: p.title, body: <p>{p.body}</p> }))} />
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
        heading="Send us the footage."
        lede={POST_AREA.ctaLede}
        primary={{ href: startHref, label: "Start Your Project" }}
      />

      <QuickViews services={POST_SERVICES} area={POST_AREA} />
    </>
  );
}
