import Link from "next/link";
import { getBlock, getContent } from "@/lib/content/queries";
import { graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { CtaBand, IndexList, PackageCard, Rule, Schedule, ServiceCards, Testimonials, serviceRows } from "@/components/site/blocks";

const TITLE = "Meraki Creative — Film Editing & Website Design in Los Angeles";
const DESCRIPTION =
  "Meraki Creative is a Los Angeles studio that edits films, reels, and trailers and designs websites for actors, directors, and production companies.";

export const metadata = pageMetadata({ path: "/", title: TITLE, description: DESCRIPTION, ogType: "website" });

// Homepage "Pick a starting point" — same four packages as the original page.
const FEATURED_SLUGS = ["acting-package", "reel-refresh", "scene-edit", "trailer"];

export default async function HomePage() {
  const content = await getContent();
  const process = await getBlock("home.process");
  const services = (cat: string) => content.services.filter((s) => s.categoryId === cat && s.summary);
  const web = services("web-design");
  const post = services("post-production");
  // Intro plates alternate crafts so the stack reads as one studio, not two lists.
  const plates = Array.from({ length: Math.max(web.length, post.length) }, (_, i) => [web[i], post[i]])
    .flat()
    .filter((s) => !!s);
  const featured = FEATURED_SLUGS.map((slug) => content.packages.find((p) => p.slug === slug)).filter((p) => !!p);

  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("WebPage", "/", TITLE, DESCRIPTION))} />

      {/* ============ HERO (type-led) ============ */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-title-row">
            <h1 className="hero-title display display-xl" aria-label="Meraki Creative">
              {["Meraki", "Creative"].map((word) => (
                <span className="mk-word" key={word} aria-hidden="true">
                  {word.split("").map((ch, i) => <span className="mk-ch" key={i}>{ch}</span>)}
                </span>
              ))}
            </h1>
            {/* Intro (first visit per session, see enhancements.ts): the words part, the services roll
                through the gap once, then the two craft plates drop into the service cards below. */}
            <div className="hero-roll" aria-hidden="true">
              {plates.map((s, i) => (
                <div className={`plate plate-${i % 3}`} key={s.id}>
                  <span className="plate-meta">
                    <span>( {String(i + 1).padStart(2, "0")} )</span>
                    <span>{s.categoryId === "web-design" ? "Web" : "Post"}</span>
                  </span>
                  <span className="plate-name">{s.title}</span>
                </div>
              ))}
              <div className="plate plate-1 plate-craft" data-craft="/web-design">
                <span className="plate-meta"><span>( 01 )</span><span>Craft</span></span>
                <span className="plate-name">Web Design</span>
              </div>
              <div className="plate plate-2 plate-craft" data-craft="/post-production">
                <span className="plate-meta"><span>( 02 )</span><span>Craft</span></span>
                <span className="plate-name">Post-Production</span>
              </div>
            </div>
          </div>
          <p className="hero-tag display">The story is already there.</p>
          <div className="btn-group hero-cta">
            <Link href="/start" className="btn btn-primary">Start Your Project</Link>
            <Link href="/services" className="btn btn-secondary">View Services</Link>
          </div>

          <div className="svc-rule">
            <span className="slate-tag">( Services )</span>
            <span className="slate hide-sm">Two crafts, one studio</span>
          </div>
          <ServiceCards
            cards={[
              { href: "/web-design", title: "Web Design", line: "We build the home for it.", media: { img: "/assets/work/site-angelique.jpg" }, services: web },
              { href: "/post-production", title: "Post-Production", line: "We cut the story.", media: { video: "/assets/work/scene-sunflower.mp4", poster: "/assets/work/scene-sunflower-poster.jpg" }, services: post },
            ]}
          />
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
            <p className="lede" style={{ marginBottom: "1.4rem" }}>We start with the story you&apos;re trying to tell, then build everything around it, from the edit to the site. Every project gets treated like its own film: one set of hands, real care, nothing left generic.</p>
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
