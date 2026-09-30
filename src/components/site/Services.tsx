/**
 * Service blocks shared by Web Design and Post-Production, in the site's flat look: hairline
 * cards with a mono index, quick-view popups, the per-service page, tone-stepped rows (the
 * homepage "What we do" shades), hover-opening process rows, hairline FAQs, and line icons.
 * "Quick view" is a real link to the service page; enhancements.ts intercepts the click and
 * opens the matching <dialog> instead, so it still works without JS.
 */
import Link from "next/link";
import { capitalize, priceNote, serviceHref, serviceStartHref, type ServiceArea, type StudioService } from "@/content/services";
import { CtaBand } from "./blocks";

export const cardIndex = (i: number) => String(i + 1).padStart(3, "0");

/** The service's engraving. Decorative: the name always sits beside it. */
export function ServiceArt({ s, className }: { s: StudioService; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={s.art} alt="" loading="lazy" />;
}

export function ServiceCards({ services, area }: { services: StudioService[]; area: ServiceArea }) {
  return (
    <ul className="wd-cards wd-cards-3 reveal">
      {services.map((s, i) => (
        <li className="wd-card" key={s.key}>
          <span className="wd-card-num">{cardIndex(i)}</span>
          <span className="wd-card-art"><ServiceArt s={s} /></span>
          <h3 className="wd-card-title">{capitalize(s.name)}</h3>
          <p className="wd-card-tag">{s.card}</p>
          <p className="wd-card-body">{s.audience}</p>
          <div className="wd-card-foot">
            <p className="wd-card-price">{s.price}</p>
            <div className="wd-card-actions">
              <a href={serviceHref(area, s)} className="btn btn-secondary" data-quick-view={s.key} aria-haspopup="dialog">
                Quick view<span className="visually-hidden">: {s.name}</span>
              </a>
              <Link href={serviceHref(area, s)} className="txt-link">Full details<span className="visually-hidden"> about {s.name.toLowerCase()}</span></Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function QuickViews({ services, area }: { services: StudioService[]; area: ServiceArea }) {
  return (
    <>
      {services.map((s) => (
        <dialog className="qv" id={`qv-${s.key}`} key={s.key} aria-labelledby={`qv-${s.key}-title`}>
          <div className="qv-art"><ServiceArt s={s} /></div>
          <div className="qv-body">
            <form method="dialog" className="qv-close-row">
              <button className="qv-close" aria-label={`Close ${s.name} quick view`}><span aria-hidden="true">×</span></button>
            </form>
            <h2 className="qv-title" id={`qv-${s.key}-title`}>{capitalize(s.name)}</h2>
            <p className="qv-line">{s.card}</p>
            <p className="qv-price"><b>{s.price}</b> · {priceNote(s)}</p>
            <ul className="qv-list">{s.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            <p className="qv-addons">{s.addonNote}</p>
            <div className="qv-actions">
              <Link href={serviceStartHref(s)} className="btn btn-primary">Start your project</Link>
              <Link href={serviceHref(area, s)} className="btn btn-secondary">More details</Link>
            </div>
            <p className="qv-note">{area.popupNote}</p>
          </div>
        </dialog>
      ))}
    </>
  );
}

/**
 * One page per service (<area>/<path>), all from this template: a two-column top (who it's
 * for + the starting package), then organized dropdowns, questions, and the CTA.
 */
export function ServiceDetailPage({ s, area }: { s: StudioService; area: ServiceArea }) {
  const start = serviceStartHref(s);
  return (
    <>
      <section className="wd-section wd-first">
        <div className="wrap">
          <Link href={area.base} className="slate wsp-back">← {area.allLabel}</Link>
          <div className="wsp-top">
            <div className="wsp-intro wwd-tone-1">
              <ServiceArt s={s} className="wsp-art" />
              <h1 className="display display-lg">{capitalize(s.name)}.</h1>
              <p className="lede">{s.audience}</p>
              <p className="wsp-price"><b>{s.price}</b> · {priceNote(s)}</p>
              <Link href={start} className="btn btn-primary">Start your project</Link>
            </div>
            <div className="wsp-pkg wwd-tone-2">
              <h2 className="wsp-pkg-title">Starting package</h2>
              <div className="wsp-secs">
                {s.sections.map((sec, i) => (
                  <details className="wsp-sec" key={sec.title} open={i === 0}>
                    <summary>
                      <span className="wsp-sec-title">{sec.title}</span>
                      <span className="wsp-sec-count">{sec.items.length}</span>
                      <span className="wd-plus" aria-hidden="true" />
                    </summary>
                    <ul className="wsp-list">{sec.items.map((x) => <li key={x}>{x}</li>)}</ul>
                  </details>
                ))}
              </div>
              <p className="wsp-sep">{s.separate}</p>
              <p className="wsp-note">{area.pricingNote}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="wd-section">
        <div className="wrap wd-two">
          <div>
            <h2 className="display display-sm wd-col-title">Optional additions</h2>
            <ToneRows
              items={s.addonGroups.map((g) => ({
                title: g.title,
                meta: `${g.items.length} option${g.items.length > 1 ? "s" : ""}`,
                body: (
                  <ul className="wsp-addons">
                    {g.items.map((a) => <li key={a.name}><span>{a.name}</span><span className="wsp-addon-price">{a.price}</span></li>)}
                  </ul>
                ),
              }))}
            />
            <p className="wsp-note">
              {area.addonsNote}
              {s.addonFootnote && ` ${s.addonFootnote}`}
            </p>

            <h2 className="display display-sm wd-col-title wd-col-gap">What to prepare</h2>
            <ToneRows items={[{
              title: "Your checklist",
              meta: `${s.materials.length} items`,
              body: (<><ul className="wsp-list">{s.materials.map((x) => <li key={x}>{x}</li>)}</ul><p className="wsp-note">{area.prepareNote}</p></>),
            }]} />
          </div>
          <div>
            <h2 className="display display-sm wd-col-title">Questions</h2>
            <Faqs items={s.faqs.map((f) => ({ title: f.q, body: <p>{f.a}</p> }))} />
          </div>
        </div>
      </section>

      <CtaBand
        slate="Los Angeles · Booking 2026"
        heading={s.cta}
        lede={area.ctaLede}
        primary={{ href: start, label: "Start your project" }}
        secondary={{ href: area.base, label: area.allLabel }}
      />
    </>
  );
}

type Item = { title: React.ReactNode; meta?: React.ReactNode; body: React.ReactNode };

/**
 * Flat stacked rows that step one shade darker each time, like the homepage "What we do"
 * list. Native <details>, so they work without JS and by keyboard.
 */
export function ToneRows({ items, firstOpen = false }: { items: Item[]; firstOpen?: boolean }) {
  return (
    <div className="wd-rows">
      {items.map((it, i) => (
        <details className={`wd-row wwd-tone-${Math.min(i, 3)}`} key={i} open={firstOpen && i === 0}>
          <summary>
            <span className="wd-row-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="wd-row-title">{it.title}</span>
            {it.meta && <span className="wd-row-meta">{it.meta}</span>}
            <span className="wd-plus" aria-hidden="true" />
          </summary>
          <div className="wd-row-body">{it.body}</div>
        </details>
      ))}
    </div>
  );
}

/**
 * The process: tone-stepped rows that open on hover like the homepage "What we do" list
 * (enhancements.ts, [data-wd-steps]). One open at a time; the first is open from the server.
 */
export function ProcessRows({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <ul className="wd-steps" data-wd-steps>
      {items.map((it, i) => (
        <li className={`wd-step wwd-tone-${Math.min(i, 3)}${i === 0 ? " is-open" : ""}`} key={it.title}>
          <button type="button" className="wd-step-head" aria-expanded={i === 0} aria-controls={`wd-step-${i}`}>
            <span className="wd-row-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="wd-row-title">{it.title}</span>
            <span className="wd-plus" aria-hidden="true" />
          </button>
          <div className="wd-step-body" id={`wd-step-${i}`}>
            <div className="wd-step-inner">{it.body}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Boxless accordion: hairline between items, sharp +/−. */
export function Faqs({ items }: { items: Item[] }) {
  return (
    <div className="wd-faqs">
      {items.map((it, i) => (
        <details className="wd-faq" key={i}>
          <summary>
            <span className="wd-faq-q">{it.title}</span>
            <span className="wd-plus" aria-hidden="true" />
          </summary>
          <div className="wd-faq-a">{it.body}</div>
        </details>
      ))}
    </div>
  );
}

/** Monoline icons for the "Included in every…" cards (ink, one stroke weight). */
const ICONS: Record<string, React.ReactNode> = {
  // Web Design
  mobile: (<><rect x="3" y="7" width="20" height="14" /><path d="M9 25h8" /><rect x="20" y="11" width="9" height="16" /></>),
  media: (<><rect x="3" y="5" width="26" height="22" /><rect x="7" y="9" width="18" height="14" /><path d="M14 13l5 3-5 3z" /></>),
  live: (<><circle cx="16" cy="16" r="12.5" /><circle cx="16" cy="16" r="8" /><circle cx="16" cy="16" r="3" /></>),
  handover: (<><circle cx="10" cy="16" r="6" /><path d="M16 16h13M24 16v5M28 16v4" /></>),
  // Post-Production
  cut: (<><rect x="3" y="8" width="26" height="16" /><path d="M11 8v16M21 8v16" /></>),
  sound: (<><path d="M4 16h2M9 12v8M13 7v18M17 11v10M21 13v6M25 9v14M28 16h1" /></>),
  rounds: (<><path d="M26 13a10.5 10.5 0 0 0-19.5-1.5" /><path d="M6 19a10.5 10.5 0 0 0 19.5 1.5" /><path d="M26 6v7h-7M6 26v-7h7" /></>),
  export: (<><rect x="4" y="11" width="17" height="17" /><path d="M14 18L28 4M20 4h8v8" /></>),
};
export function LineIcon({ name }: { name: keyof typeof ICONS | string }) {
  return (
    <svg className="wd-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
