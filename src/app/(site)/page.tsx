import Link from "next/link";
import { getBlock, getContent } from "@/lib/content/queries";
import { graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { CtaBand, IndexList, PackageCard, Rule, Schedule, Testimonials, serviceRows } from "@/components/site/blocks";

const TITLE = "Meraki Creative — Film Editing & Website Design in Los Angeles";
const DESCRIPTION =
  "Meraki Creative is a Los Angeles studio that edits films, reels, and trailers and designs websites for actors, directors, and production companies.";

export const metadata = pageMetadata({ path: "/", title: TITLE, description: DESCRIPTION, ogType: "website" });

// Homepage "Pick a starting point" — same four packages as the original page.
const FEATURED_SLUGS = ["acting-package", "reel-refresh", "scene-edit", "trailer"];

const CLIPS_V2 = [
  { flex: 1.4, name: "tl-demoreel-table" },
  { flex: 1, name: "tl-sunflower-cu" },
  { flex: 1.7, name: "tl-demoreel-bar" },
];
const CLIPS_V1 = [
  { flex: 1, name: "tl-demoreel-end" },
  { flex: 1.5, name: "tl-butterflies" },
  { flex: 1.1, name: "tl-car" },
];

function Clip({ flex, name }: { flex: number; name: string }) {
  return (
    <span className="clip" style={{ flex }}>
      <video src={`/assets/work/${name}.mp4`} poster={`/assets/work/${name}.jpg`} muted loop playsInline preload="none" />
    </span>
  );
}

export default async function HomePage() {
  const content = await getContent();
  const process = await getBlock("home.process");
  const services = (cat: string) => content.services.filter((s) => s.categoryId === cat && s.summary);
  const featured = FEATURED_SLUGS.map((slug) => content.packages.find((p) => p.slug === slug)).filter((p) => !!p);

  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("WebPage", "/", TITLE, DESCRIPTION))} />

      {/* ============ HERO (type-led) ============ */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-meta">
            <span className="slate">Meraki Creative · Est. 2026</span>
            <span className="slate hide-sm">A creative studio for storytellers · Now Booking</span>
          </div>
          <h1 className="display display-xl">The story is<br />already there.</h1>
          <div className="hero-foot">
            <p className="lede">We&apos;re here to help it be seen. Meraki Creative is a Los Angeles creative studio for storytellers. We edit the films, build the sites, and shape the materials that carry your work.</p>
            <div className="btn-group">
              <Link href="/start" className="btn btn-primary">Start Your Project</Link>
              <Link href="/services" className="btn btn-secondary">View Services</Link>
            </div>
          </div>

          {/* Editing-timeline motion graphic. Decorative; static assembled timeline without JS/reduced-motion. */}
          <div className="stage" data-motion aria-hidden="true">
            <div className="stage-screen">
              <div className="act act-cut">
                <span className="act-tag">Timeline / Cut</span>
                <div className="tl-block">
                  <div className="ruler">{Array.from({ length: 16 }, (_, i) => <i key={i} />)}</div>
                  <div className="lanes">
                    <div className="lane"><span className="lane-label">V2</span><div className="track">{CLIPS_V2.map((c) => <Clip key={c.name} {...c} />)}</div></div>
                    <div className="lane"><span className="lane-label">V1</span><div className="track">{CLIPS_V1.map((c) => <Clip key={c.name} {...c} />)}</div></div>
                    <div className="lane"><span className="lane-label">A1</span><div className="track audio">
                      <div className="waveform">{Array.from({ length: 36 }, (_, i) => <i key={i} />)}</div>
                    </div></div>
                  </div>
                  <span className="playhead" />
                </div>
              </div>
            </div>
            <p className="stage-cap"><span className="stage-cap-k">The cut</span> Where the story is found.</p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ============ STATEMENT ============ */}
      <section className="section">
        <div className="wrap statement">
          <div className="lead-note reveal">
            <span className="slate-tag">The studio</span>
            <p className="display display-sm" style={{ marginTop: "1.2rem" }}>The work matters. So does how it&apos;s experienced.</p>
          </div>
          <div className="reveal">
            <p className="lede" style={{ marginBottom: "1.4rem" }}>We start with the story you&apos;re trying to tell, then build everything around it. The edit, the site, the materials. Every project gets treated like its own film: one set of hands, real care, nothing left generic.</p>
            <p className="body-2">That care is the whole point. <i>Meraki</i> means doing something with soul, creativity, and love, and leaving a piece of yourself in it. We bring that same care to your work, so your story lands the way you felt it.</p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ============ PILLAR 1 — POST-PRODUCTION ============ */}
      <section className="section" id="post">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <div className="index-head">
                <span className="slate-tag">Post-Production</span>
                <h2 className="display display-lg">We cut the story.</h2>
              </div>
              <p className="body-2" style={{ marginTop: "1.2rem", maxWidth: "42ch" }}>Film editing and post-production for actors and filmmakers in Los Angeles. Narrative edits, trailers, and reels cut with a director&apos;s instinct for tension and release. The footage is yours; the shape is ours.</p>
              <Link href="/post-production" className="txt-link" style={{ display: "inline-block", marginTop: "1.5rem" }}>All post-production</Link>
            </div>
            <IndexList rows={serviceRows(services("post-production"), true)} />
          </div>
        </div>
      </section>

      <Rule />

      {/* ============ PILLAR 2 — DIGITAL PRESENCE ============ */}
      <section className="section" id="digital">
        <div className="wrap">
          <div className="split reverse">
            <div className="reveal">
              <div className="index-head">
                <span className="slate-tag">Digital Presence</span>
                <h2 className="display display-lg">We build the home for it.</h2>
              </div>
              <p className="body-2" style={{ marginTop: "1.2rem", maxWidth: "42ch" }}>Website design for actors, directors, and production companies. Clean, cinematic websites that read as seriously as the work actors, directors, and companies put into them.</p>
              <Link href="/web-design" className="txt-link" style={{ display: "inline-block", marginTop: "1.5rem" }}>All digital presence</Link>
            </div>
            <IndexList rows={serviceRows(services("web-design"), true)} />
          </div>
        </div>
      </section>

      <Rule />

      {/* ============ PILLAR 3 — CREATIVE MATERIALS ============ */}
      <section className="section" id="materials">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <div className="index-head">
                <span className="slate-tag">Creative Materials</span>
                <h2 className="display display-lg">We design what speaks for it.</h2>
              </div>
              <p className="body-2" style={{ marginTop: "1.2rem", maxWidth: "42ch" }}>Pitch deck and lookbook design for films in development. The documents that carry your project: designed with the same eye as the film, so the vision reads on the page the way it does on screen.</p>
              <Link href="/creative-materials" className="txt-link" style={{ display: "inline-block", marginTop: "1.5rem" }}>All creative materials</Link>
            </div>
            <IndexList rows={serviceRows(services("creative-materials"), true)} />
          </div>
        </div>
      </section>

      <Rule />

      {/* ============ SHOWREEL (cutting-room frame) ============ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="index-head reveal" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <div><span className="slate-tag">Selected Work</span><h2 className="display display-md" style={{ marginTop: "0.8rem" }}>The reel.</h2></div>
            <a href="https://vimeo.com/merivelle/director-demo-reel" target="_blank" rel="noopener" className="txt-link">Watch the full reel</a>
          </div>
          <figure className="showreel reveal" data-showreel>
            <video src="/assets/work/showreel.mp4" poster="/assets/work/showreel-poster.jpg" muted loop playsInline preload="metadata" aria-label="Director demo reel excerpt by Merivelle" />
            <span className="sr-grain" aria-hidden="true" />
            <span className="sr-label">TL / CUT · Director Demo Reel</span>
            <span className="sr-tc" id="sr-tc">00:00</span>
            <a className="sr-cta" href="https://vimeo.com/merivelle/director-demo-reel" target="_blank" rel="noopener" aria-label="Watch the full reel on Vimeo">
              <span className="sr-cta-play" aria-hidden="true" /><span className="sr-cta-txt">Watch the full reel</span>
            </a>
            <span className="sr-ticks" aria-hidden="true" />
            <span className="sr-progress" aria-hidden="true"><span className="sr-progress-fill" /></span>
          </figure>
        </div>
      </section>

      <Rule />

      <Testimonials items={content.testimonials} />

      <Rule />

      {/* ============ FEATURED PACKAGES ============ */}
      <section className="section">
        <div className="wrap">
          <div className="index-head reveal" style={{ justifyContent: "space-between" }}>
            <h2 className="display display-md">Pick a starting point.</h2>
            <Link href="/packages" className="txt-link">See all packages</Link>
          </div>
          <div className="pkg-feature cols-4 reveal">
            {featured.map((p) => (
              <PackageCard key={p.id} pkg={p} withId={false} compact detailsHref={`/packages#${p.slug}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY (DARK BAND) ============ */}
      <section className="section band-night on-night">
        <div className="wrap">
          <div className="index-head reveal">
            <span className="slate-tag">Why Meraki</span>
            <h2 className="display display-md">Thoughtful work, made personal.</h2>
          </div>
          <div className="why-grid reveal-stagger reveal">
            <div className="why">
              <span className="k">Fluent</span>
              <h3>We build for the industry</h3>
              <p>Casting offices, reps, festival programmers, and financiers all expect certain things. We build to those conventions, so your work reads as professional before anyone hits play.</p>
            </div>
            <div className="why">
              <span className="k">Cinematic</span>
              <h3>Cinematic, never corporate</h3>
              <p>Everything we make is meant to belong in film and theatre: editorial, restrained, and human. No template look, no stock-photo energy.</p>
            </div>
            <div className="why">
              <span className="k">Personal</span>
              <h3>You work with Merivelle</h3>
              <p>A small studio with real attention. Every decision is made for your goals, not run through a content line that treats everyone the same.</p>
            </div>
            <div className="why">
              <span className="k">Fast</span>
              <h3>Built to share</h3>
              <p>Clear packages, a simple process, and quick turnarounds. You&apos;re sending the link and submitting the work in days, not someday.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROCESS (SCHEDULE) ============ */}
      <Schedule slate="The Schedule" heading={process.heading} steps={process.steps} />

      <CtaBand
        slate="Ready when you are"
        heading={<>Start with<br />the story.</>}
        primary={{ href: "/start", label: "Start Your Project" }}
        secondary={{ href: "/packages", label: "View Packages" }}
      />
    </>
  );
}
