/**
 * Public-site building blocks. Markup and class names match the original static pages
 * exactly so styles.css (src/styles/site.css) applies unchanged.
 */
import Link from "next/link";
import type { Faq, PackageItem, ProcessStep, ServiceItem, Testimonial } from "@/lib/content/types";

export function Rule() {
  return <hr className="rule" />;
}

export function IndexList({ rows }: { rows: { role: string; title: string; desc: string }[] }) {
  return (
    <div className="index-list reveal-stagger reveal">
      {rows.map((r) => (
        <div className="index-row" key={r.title}>
          <span className="role">{r.role}</span>
          <span className="title">{r.title}</span>
          <span className="desc">{r.desc}</span>
        </div>
      ))}
    </div>
  );
}

/** Homepage hero: one card per craft. The media is a small motion graphic of real work. */
export type BrowserSite = { img: string; domain: string; title: string };
export type EditStill = { img: string; name: string };
export type ServiceCard = {
  href: string;
  title: string;
  line: string;
  media: { kind: "browser"; sites: BrowserSite[] } | { kind: "timeline"; stills: EditStill[] };
  services: ServiceItem[];
};

/** Web Design: a browser window that types each domain and loads the site (enhancements.ts). */
function BrowserMedia({ sites }: { sites: BrowserSite[] }) {
  return (
    <span className="svc-browser" data-svc-browser aria-hidden="true">
      <span className="brw-window">
        <span className="brw-bar">
          <span className="brw-dots"><i /><i /><i /></span>
          <span className="brw-nav">‹ ›</span>
          <span className="brw-url">
            <span className="brw-lock" />
            <span className="brw-domain" data-domain>{sites[0]?.domain}</span>
            <span className="brw-caret" />
          </span>
          <span className="brw-count">( <b data-count>1</b> / {sites.length} )</span>
        </span>
        <span className="brw-view">
          <span className="brw-load" />
          {sites.map((site, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={site.img} src={site.img} alt="" data-domain={site.domain} className={i === 0 ? "is-on" : undefined} loading="lazy" />
          ))}
        </span>
      </span>
    </span>
  );
}

// Timeline layout, in % of the sequence. V1 is the cut; V2 holds shorter overlays.
const V1 = [15, 12, 16, 11, 17, 14, 15];
const V2: [number, number][] = [[6, 9], [33, 8], [58, 10], [80, 11]];
const WAVE = Array.from({ length: 48 }, (_, i) => 22 + ((i * 37) % 70));

/** Post-Production: the reel plays in the program monitor over an edit timeline of real stills. */
function TimelineMedia({ stills }: { stills: EditStill[] }) {
  let x = 0;
  const v1 = V1.map((w, i) => { const clip = { left: x, width: w, still: stills[i % stills.length] }; x += w; return clip; });
  const v2 = V2.map(([left, width], i) => ({ left, width, still: stills[(V1.length + i) % stills.length] }));
  const clip = (c: { left: number; width: number; still: EditStill }, track: string) => (
    <span className="edt-clip" key={track + c.left} data-track={track} data-img={c.still.img}
      style={{ left: `${c.left}%`, width: `${c.width}%`, backgroundImage: `url(${c.still.img})` }}>
      <span className="edt-clip-name">{c.still.name}</span>
    </span>
  );
  return (
    <span className="svc-edit" data-svc-edit aria-hidden="true">
      <span className="edt-monitor">
        <video src="/assets/work/showreel.mp4" poster="/assets/work/showreel-poster.jpg" muted loop playsInline preload="metadata" data-reel-monitor />
        <span className="edt-safe" />
        <span className="edt-label">Program · MERAKI_CUT_v3</span>
        <span className="edt-tc" data-tc>00:00:00:00</span>
      </span>
      <span className="edt-timeline">
        <span className="edt-ruler">
          {Array.from({ length: 17 }, (_, i) => <i key={i}>{i % 4 === 0 ? `00:${String(i * 4).padStart(2, "0")}` : ""}</i>)}
        </span>
        <span className="edt-lanes">
          <span className="edt-lane"><span className="edt-tag">V2</span><span className="edt-track">{v2.map((c) => clip(c, "v2"))}</span></span>
          <span className="edt-lane"><span className="edt-tag">V1</span><span className="edt-track">{v1.map((c) => clip(c, "v1"))}</span></span>
          {["A1", "A2"].map((a) => (
            <span className={`edt-lane edt-audio edt-${a.toLowerCase()}`} key={a}>
              <span className="edt-tag">{a}</span>
              <span className="edt-track"><span className="edt-wave">{WAVE.map((h, i) => <i key={i} style={{ height: `${a === "A2" ? 100 - h : h}%` }} />)}</span></span>
            </span>
          ))}
          <span className="edt-playhead" />
        </span>
      </span>
    </span>
  );
}

export function ServiceCards({ cards }: { cards: ServiceCard[] }) {
  return (
    <div className="svc-cards">
      {cards.map((c, i) => (
        <Link href={c.href} className="svc-card" key={c.href}>
          <span className="svc-media">
            {c.media.kind === "browser" ? <BrowserMedia sites={c.media.sites} /> : <TimelineMedia stills={c.media.stills} />}
          </span>
          <span className="svc-body">
            <span className="svc-top">
              <span className="svc-idx">( {String(i + 1).padStart(2, "0")} )</span>
              <span className="svc-arrow" aria-hidden="true">→</span>
            </span>
            <span className="svc-title display">{c.title}</span>
            <span className="svc-line">{c.line}</span>
            <span className="svc-list">{c.services.map((s) => s.roleLabel).join(" · ")}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** "What we do" (Estrela-style): stacked rows, each a shade darker; the open row shows its
 *  full image and description, the rest collapse to strips (open state set in enhancements.ts). */
export type ServiceRow = { title: string; img: string; alt: string; desc: string; href: string };

export function WhatWeDo({ rows, intro }: { rows: ServiceRow[]; intro: string }) {
  return (
    <section className="section wwd-section">
      <div className="wrap">
        <div className="wwd-head reveal">
          <h2 className="display display-lg">What we do</h2>
          <p className="body-2">{intro}</p>
        </div>
        <ol className="wwd" data-wwd>
          {rows.map((r, i) => (
            <li className={`wwd-row wwd-tone-${i}${i === 0 ? " is-open" : ""}`} key={r.title}>
              <Link href={r.href} className="wwd-link">
                <span className="wwd-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.img} alt={r.alt} loading="lazy" />
                </span>
                <span className="wwd-text">
                  <span className="wwd-title">{r.title}</span>
                  <span className="wwd-desc">{r.desc}</span>
                </span>
                <span className="wwd-num">{String(i + 1).padStart(2, "0")}</span>
              </Link>
            </li>
          ))}
          <li className="wwd-row wwd-close">
            <span className="wwd-media" />
            <span className="wwd-text">
              <span className="wwd-statement display">Start with the story.</span>
              <Link href="/services" className="txt-link">View all services</Link>
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}

/**
 * "Featured Work" (Estrela-style): a black card, then project tiles that grow on hover. Every tile
 * keeps its media's own aspect ratio (nothing cropped) at one tall shared height, so the row runs
 * past the edge and scrolls sideways (drag, trackpad, or keyboard).
 */
export type FeaturedTile = { href: string; title: string; label: string; img: string; alt: string; ratio: number; video?: string; start?: number };

export function FeaturedWork({ items }: { items: FeaturedTile[] }) {
  return (
    <section className="section fw-section">
      <div className="wrap">
        <div className="fw" data-fw>
          <div className="fw-tile fw-card" style={{ "--ar": 0.72 } as React.CSSProperties}>
            <div className="fw-card-top">
              <h2 className="fw-card-title">Featured Work</h2>
              <p className="fw-card-line">Stories we&apos;ve helped shape.</p>
            </div>
            <Link href="/work" className="fw-card-all">All Work <span aria-hidden="true">→</span></Link>
          </div>
          {items.map((t) => (
            <Link href={t.href} className="fw-tile fw-project" key={t.href} style={{ "--ar": t.ratio } as React.CSSProperties}>
              <span className="fw-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.alt} loading="lazy" />
                {t.video && <video src={t.video} muted loop playsInline preload="none" aria-hidden="true" data-start={t.start} />}
              </span>
              <span className="fw-cap"><b>{t.title}</b> {t.label}</span>
            </Link>
          ))}
          <span className="fw-pill" aria-hidden="true">View project</span>
        </div>
      </div>
    </section>
  );
}

/**
 * A line whose letters roll up through their own windows and are replaced by identical copies
 * (Made With GSAP–style), fired by enhancements.ts. Delays come from a fixed scatter so server and
 * client render the same markup; screen readers read the sentence from aria-label.
 */
export function RollText({ text }: { text: string }) {
  let i = 0;
  return (
    <span className="roll" aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span className="roll-word" aria-hidden="true" key={w}>
          {Array.from(word).map((ch) => {
            const d = (((i++ * 37) % 11) / 11) * 0.28;
            return (
              <span className="roll-ch" key={i} style={{ "--d": `${d.toFixed(2)}s` } as React.CSSProperties}>
                <span className="roll-in" data-ch={ch}>{ch}</span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

export const serviceRows = (services: ServiceItem[], short = false) =>
  services.map((s) => ({ role: s.roleLabel, title: s.title, desc: short && s.summary ? s.summary : s.description }));

export function FaqSection({ faqs, slate = "Questions", heading = "Before you ask." }: { faqs: Faq[]; slate?: string; heading?: string }) {
  if (!faqs.length) return null;
  return (
    <section className="section">
      <div className="wrap">
        <div className="index-head reveal">
          <span className="slate-tag">{slate}</span>
          <h2 className="display display-md">{heading}</h2>
        </div>
        <IndexList rows={faqs.map((f) => ({ role: "Q", title: f.question, desc: f.answer }))} />
      </div>
    </section>
  );
}

/** Start-a-project link for a package. Keeps the original ?package=<name> contract. */
export const packageHref = (p: Pick<PackageItem, "name">) => `/start?package=${encodeURIComponent(p.name)}`;

export function PackageCard({ pkg, withId = true, compact = false, detailsHref }: {
  pkg: PackageItem;
  withId?: boolean;
  compact?: boolean;
  detailsHref?: string;
}) {
  const items = compact ? pkg.included.slice(0, 3) : pkg.included;
  return (
    <article className={`pkg-item${pkg.featured ? " is-featured" : ""}`} id={withId ? pkg.slug : undefined}>
      <span className="pkg-meta">{pkg.label}</span>
      <h3>{pkg.name}</h3>
      <p className="price"><b>{pkg.priceDisplay}</b></p>
      <ul className="incl">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
      {!compact && pkg.tagline && (
        <p className="muted" style={{ fontStyle: "italic", fontSize: "0.88rem" }}>{pkg.tagline}</p>
      )}
      {detailsHref ? (
        <Link href={detailsHref} className="txt-link">Details</Link>
      ) : (
        <Link href={packageHref(pkg)} className="txt-link">Start Your Project</Link>
      )}
    </article>
  );
}

/** Packages grouped under slate headings (Demo Reels, Scene Edits, …) in their stored order. */
export function PackageGroups({ packages, firstPadded = true }: { packages: PackageItem[]; firstPadded?: boolean }) {
  const groups: { title: string; items: PackageItem[] }[] = [];
  for (const p of packages) {
    const g = groups.find((x) => x.title === p.groupTitle);
    if (g) g.items.push(p);
    else groups.push({ title: p.groupTitle, items: [p] });
  }
  return (
    <>
      {groups.map((g, i) => {
        const cols = g.items.length === 1 ? "1fr" : g.items.length === 2 ? "repeat(2,1fr)" : undefined;
        return (
          <section className="section" key={g.title} style={i === 0 && firstPadded ? undefined : { paddingTop: 0 }}>
            <div className="wrap">
              <div className="index-head reveal"><span className="slate-tag">{g.title}</span></div>
              <div className="pkg-feature reveal" style={cols ? { gridTemplateColumns: cols } : undefined}>
                {g.items.map((p) => <PackageCard key={p.id} pkg={p} />)}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

export function Schedule({ slate, heading, steps }: { slate: string; heading: string; steps: ProcessStep[] }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="index-head reveal">
          <span className="slate-tag">{slate}</span>
          <h2 className="display display-md">{heading}</h2>
        </div>
        <div className="schedule reveal-stagger reveal">
          {steps.map((s) => (
            <div className="sched-row" key={s.tag}>
              <span className="t">{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ slate, heading, lede, primary, secondary }: {
  slate: string;
  heading: React.ReactNode;
  lede?: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="section cta-band on-night">
      <div className="wrap">
        <span className="slate reveal">{slate}</span>
        <h2 className="display display-lg reveal">{heading}</h2>
        {lede && <p className="lede reveal" style={{ margin: "0 auto 2rem", color: "var(--on-night-soft)" }}>{lede}</p>}
        <div className="btn-group reveal">
          <Link href={primary.href} className="btn btn-primary">{primary.label}</Link>
          {secondary && <Link href={secondary.href} className="btn btn-secondary">{secondary.label}</Link>}
        </div>
      </div>
    </section>
  );
}

/**
 * Fallback pull-quote when none is set in Admin: the first sentence, or, if that runs long,
 * its first clause with an ellipsis (always their own words, never rewritten).
 */
const firstSentence = (q: string) => {
  const sentence = (q.match(/^.*?[.!?](\s|$)/)?.[0] ?? q).trim();
  if (sentence.split(/\s+/).length <= 12) return sentence;
  const clause = sentence.match(/^[^;,:]+/)?.[0]?.trim();
  return clause && clause !== sentence ? `${clause}…` : sentence;
};

/**
 * Testimonials (Shed-style): a full-bleed track of big pull-quotes. Each quote has a faint copy
 * (sets the layout) and a solid copy that enhancements.ts splits into masked lines and animates.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="section tq-section">
      <div className="wrap">
        <span className="slate-tag reveal">In Their Words</span>
      </div>
      <div className="tq" data-testimonials role="group" aria-roledescription="carousel" aria-label="Client testimonials" tabIndex={-1}>
        <div className="tq-track">
          {items.map((t, i) => {
            const pull = t.pullQuote || firstSentence(t.quote);
            return (
              <figure className="tq-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`} key={t.id}>
                <blockquote className="tq-quote">
                  <span className="tq-pale">&ldquo;{pull}&rdquo;</span>
                  <span className="tq-ink" aria-hidden="true">&ldquo;{pull}&rdquo;</span>
                </blockquote>
                <figcaption className="tq-cite">&mdash; {t.name}, {t.roleLabel}</figcaption>
                {pull !== t.quote && <p className="tq-full">&ldquo;{t.quote}&rdquo;</p>}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function PageHero({ meta, title, lede, children }: {
  meta: [string, string?];
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-meta">
          <span className="slate">{meta[0]}</span>
          {meta[1] && <span className="slate hide-sm">{meta[1]}</span>}
        </div>
        <h1 className="display display-xl">{title}</h1>
        {(lede || children) && (
          <div className="hero-foot">
            {lede && <p className="lede">{lede}</p>}
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
