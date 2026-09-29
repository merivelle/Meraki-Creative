import Link from "next/link";
import { getBlock, getContent } from "@/lib/content/queries";
import { graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { CtaBand, FeaturedWork, PackageCard, Rule, Schedule, ServiceCards, Testimonials, WhatWeDo } from "@/components/site/blocks";

const TITLE = "Meraki Creative — Film Editing & Website Design in Los Angeles";
const DESCRIPTION =
  "Meraki Creative is a Los Angeles studio that edits films, reels, and trailers and designs websites for actors, directors, and production companies.";

export const metadata = pageMetadata({ path: "/", title: TITLE, description: DESCRIPTION, ogType: "website" });

// Homepage "Pick a starting point" — same four packages as the original page.
const FEATURED_SLUGS = ["acting-package", "reel-refresh", "scene-edit", "trailer"];

// Stills from real edits, laid onto the Post-Production card's timeline (V1 first, then V2).
const EDIT_STILLS = [
  ["tl-demoreel-table.jpg", "DEMOREEL_TABLE.mov"],
  ["tl-sunflower-cu.jpg", "SUNFLOWER_CU.mov"],
  ["film-opa-poster.jpg", "OPA_SC04.mov"],
  ["tl-butterflies.jpg", "BUTTERFLIES_WS.mov"],
  ["tl-demoreel-bar.jpg", "DEMOREEL_BAR.mov"],
  ["reel-sitdown-poster.jpg", "SITDOWN_MCU.mov"],
  ["tl-car.jpg", "CAR_INT.mov"],
  ["scene-butterflies-poster.jpg", "BUTTERFLIES_CU.mov"],
  ["tl-demoreel-end.jpg", "DEMOREEL_END.mov"],
  ["scene-sunflower-poster.jpg", "SUNFLOWER_WS.mov"],
  ["grade1-after.jpg", "GRADE_A01.mov"],
].map(([file, name]) => ({ img: `/assets/work/${file}`, name }));

// "What we do" rows: the four kinds of work, each with a real image. Copy is the services' own summaries.
const SERVICE_ROWS = [
  { title: "Film & trailer editing", img: "/assets/work/film-opa-poster.jpg", alt: "Still from Opa, a short film edited by Meraki Creative", href: "/post-production",
    desc: "Story-first cuts that hold an audience from first frame to last, and the two minutes that make a festival or a buyer want the rest." },
  { title: "Demo reels & scenes", img: "/assets/work/still-reel-cu.jpg", alt: "Still from a demo reel scene edited by Meraki Creative", href: "/post-production",
    desc: "Your strongest moments cut to lead, with a first ten seconds that hold. Scenes cut and balanced so the performance is what reads." },
  { title: "Actor & director websites", img: "/assets/work/site-emily.jpg", alt: "Emily Loaiza's actor website", href: "/web-design",
    desc: "The one clean link you put everywhere: reel, headshots, contact. For directors, a work-first portfolio." },
  { title: "Production company & film websites", img: "/assets/work/site-boomerang.jpg", alt: "Boomerang's studio website", href: "/web-design",
    desc: "A credible home for your slate, team, and contact. Trailer, stills, credits, and press in one cinematic place." },
];

// Featured Work tiles, in order (a mix of edits and sites).
const FEATURED_WORK = ["director-demo-reel", "emily-loaiza", "the-sitdown", "boomerang"];

// Hover previews for the website tiles: a recorded scroll through the live site
// (scripts/record-site-scroll.mjs). `start` skips the page load at the top of the recording.
const FEATURED_PREVIEW: Record<string, { src: string; start: number }> = {
  "emily-loaiza": { src: "/assets/work/scroll-emily.webm", start: 5.4 },
  boomerang: { src: "/assets/work/scroll-boomerang.webm", start: 8.3 },
};

/** The domain shown in the browser's URL bar (a path slug when the site has no clean domain). */
const domainOf = (label: string | null | undefined, url: string | null) =>
  label && !/\s/.test(label) ? label : (url ?? "").replace(/\/+$/, "").split("/").pop() ?? "";

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
  const sites = content.portfolio
    .filter((p) => p.categories.includes("web-design") && p.images[0] && p.slug !== "meraki-creative") // client work only
    .map((p) => ({ img: p.images[0].src, domain: domainOf(p.urlLabel, p.liveUrl), title: p.title }));
  const featuredWork = FEATURED_WORK.map((slug) => content.portfolio.find((p) => p.slug === slug))
    .filter((p) => !!p && !!p.images[0])
    .map((p) => {
      const cover = p!.images.find((i) => i.role === "poster" || i.role === "cover") ?? p!.images[0];
      const preview = FEATURED_PREVIEW[p!.slug];
      const isSite = p!.categories.includes("web-design");
      return {
        href: `/work/${p!.slug}`, title: p!.title, label: p!.typeLabel ?? "", img: cover.src, alt: cover.alt,
        // The tile takes the media's own shape, so nothing is cropped.
        ratio: cover.width && cover.height ? cover.width / cover.height : isSite ? 4 / 3 : 16 / 9,
        video: preview?.src ?? (p!.video?.kind === "file" ? p!.video.src : undefined),
        start: preview?.start,
      };
    });
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
          </div>
          <ServiceCards
            cards={[
              { href: "/web-design", title: "Web Design", line: "We build the home for it.", media: { kind: "browser", sites }, services: web },
              { href: "/post-production", title: "Post-Production", line: "We cut the story.", media: { kind: "timeline", stills: EDIT_STILLS }, services: post },
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

      {/* ============ WHAT WE DO ============ */}
      <WhatWeDo rows={SERVICE_ROWS} intro="Film editing and website design for actors, directors, and production companies in Los Angeles." />

      <Rule />

      {/* ============ FEATURED WORK ============ */}
      <FeaturedWork items={featuredWork} />

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
