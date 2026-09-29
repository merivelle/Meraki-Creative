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

/** Homepage hero: one tall card per craft, media from real work. */
export type ServiceCard = {
  href: string;
  title: string;
  line: string;
  media: { img: string } | { video: string; poster: string };
  services: ServiceItem[];
};

export function ServiceCards({ cards }: { cards: ServiceCard[] }) {
  return (
    <div className="svc-cards">
      {cards.map((c, i) => (
        <Link href={c.href} className="svc-card" key={c.href}>
          <span className="svc-media">
            {"img" in c.media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.media.img} alt="" loading="eager" />
            ) : (
              <video src={c.media.video} poster={c.media.poster} muted loop playsInline preload="metadata" data-svc-video />
            )}
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

export const serviceRows =(services: ServiceItem[], short = false) =>
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
