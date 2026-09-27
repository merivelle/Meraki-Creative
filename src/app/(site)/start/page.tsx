import { getContent } from "@/lib/content/queries";
import { inquiryDefinition, preselect } from "@/lib/inquiry/definition";
import { issueFormToken } from "@/lib/security/abuse";
import { publicEnv } from "@/lib/env";
import { breadcrumbs, graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { SOCIAL_LINKS } from "@/lib/site";
import { InquiryForm } from "./InquiryForm";

const TITLE = "Contact — Start a Project | Meraki Creative, Los Angeles";
const DESCRIPTION =
  "Tell Meraki Creative about your film, reel, or website. You'll get a clear plan, a timeline, and a quote, usually within a couple of business days.";

export const metadata = pageMetadata({ path: "/start", title: TITLE, description: DESCRIPTION });

// The form carries a fresh anti-spam timestamp, so it can't be statically cached.
export const dynamic = "force-dynamic";

export default async function StartPage({ searchParams }: {
  searchParams: Promise<{ service?: string; package?: string; interest?: string }>;
}) {
  const params = await searchParams;
  const { packages } = await getContent();
  const def = inquiryDefinition(packages);
  const initial = preselect(packages, params);
  const preselectedNote = [params.service && `service=${params.service}`, (params.package ?? params.interest) && `package=${params.package ?? params.interest}`]
    .filter(Boolean).join("&");

  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("ContactPage", "/start", TITLE, DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Start a Project", path: "/start" }]))} />

      <section className="hero" style={{ paddingBottom: "clamp(24px,4vw,48px)" }}>
        <div className="wrap">
          <div className="hero-meta">
            <span className="slate">Contact</span>
            <span className="slate hide-sm">Start your project</span>
          </div>
          <h1 className="display display-xl">Let&apos;s talk<br />about your story.</h1>
          <p className="lede" style={{ marginTop: "1.4rem" }}>Tell me a little about your work and where you&apos;re trying to get. A few short questions now; the detailed ones come later, once we both know it&apos;s a fit. I&apos;ll reply by email, usually within a couple of business days.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "clamp(24px,4vw,48px)" }}>
        <div className="wrap contact-grid">
          <aside className="reveal">
            <div className="contact-detail">
              <span className="slate">Follow</span>
              {SOCIAL_LINKS.slice(0, 3).map((l, i) => (
                <span key={l.href}>{i > 0 && <>&nbsp;·&nbsp;</>}<a href={l.href} target="_blank" rel="noopener">{l.label}</a></span>
              ))}
            </div>
            <div className="contact-detail">
              <span className="slate">Who I work with</span>
              <p className="body-2" style={{ maxWidth: "34ch", fontSize: "0.95rem" }}>Actors at every stage, directors, photographers, production companies, and other creative businesses, from a first professional website to a complete set of materials.</p>
            </div>
            <div className="contact-detail">
              <span className="slate">Where</span>
              <p className="body-2" style={{ maxWidth: "34ch", fontSize: "0.95rem" }}>Los Angeles, California. The editing and the builds happen on files, so working from anywhere else is no barrier.</p>
            </div>
            <div className="contact-detail">
              <span className="slate">How it works</span>
              <p className="body-2" style={{ maxWidth: "34ch", fontSize: "0.95rem" }}>Everything runs in writing: this form, then email, then your own project page for questionnaires, files, reviews, and approvals. No calls needed.</p>
            </div>
            <div className="contact-detail">
              <span className="slate">Turnaround</span>
              <p className="body-2" style={{ maxWidth: "34ch", fontSize: "0.95rem" }}>Most projects begin within a week of booking. Reel and deck edits usually move fastest; a full website takes a little longer. Need it sooner? Ask about a rush.</p>
            </div>
          </aside>

          <div className="reveal">
            <InquiryForm
              def={def}
              initial={initial}
              token={issueFormToken()}
              preselected={preselectedNote}
              turnstileSiteKey={publicEnv.turnstileSiteKey}
            />
          </div>
        </div>
      </section>
    </>
  );
}
