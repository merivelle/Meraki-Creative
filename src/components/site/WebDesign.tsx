/**
 * Web Design blocks, in the site's flat look: hairline cards with a mono index, quick-view
 * popups, tone-stepped rows (the homepage "What we do" shades), hairline FAQs, and line icons.
 * "Quick view" is a real link to the service page; enhancements.ts intercepts the click and
 * opens the matching <dialog> instead, so it still works without JS.
 */
import Link from "next/link";
import { POPUP_NOTE, type WebService } from "@/content/web-design";

export const webServiceHref = (s: WebService) => `/web-design/${s.path}`;
export const webStartHref = (s: WebService) => `/start?package=${s.pkg}`;
const index = (i: number) => String(i + 1).padStart(3, "0");

/** The service's engraving. Decorative: the name always sits beside it. */
export function ServiceArt({ s, className }: { s: WebService; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={s.art} alt="" loading="lazy" />;
}

export function WebServiceCards({ services }: { services: WebService[] }) {
  return (
    <ul className="wd-cards wd-cards-3 reveal">
      {services.map((s, i) => (
        <li className="wd-card" key={s.key}>
          <span className="wd-card-num">{index(i)}</span>
          <span className="wd-card-art"><ServiceArt s={s} /></span>
          <h3 className="wd-card-title">{s.name.replace(/^\w/, (c) => c.toUpperCase())}</h3>
          <p className="wd-card-tag">{s.card}</p>
          <p className="wd-card-body">{s.audience}</p>
          <div className="wd-card-foot">
            <p className="wd-card-price">{s.price}</p>
            <div className="wd-card-actions">
              <a href={webServiceHref(s)} className="btn btn-secondary" data-quick-view={s.key} aria-haspopup="dialog">
                Quick view<span className="visually-hidden">: {s.name}</span>
              </a>
              <Link href={webServiceHref(s)} className="txt-link">Full details<span className="visually-hidden"> about {s.name.toLowerCase()}</span></Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function QuickViews({ services }: { services: WebService[] }) {
  return (
    <>
      {services.map((s) => (
        <dialog className="qv" id={`qv-${s.key}`} key={s.key} aria-labelledby={`qv-${s.key}-title`}>
          <div className="qv-art"><ServiceArt s={s} /></div>
          <div className="qv-body">
            <form method="dialog" className="qv-close-row">
              <button className="qv-close" aria-label={`Close ${s.name} quick view`}><span aria-hidden="true">×</span></button>
            </form>
            <h2 className="qv-title" id={`qv-${s.key}-title`}>{s.name.replace(/^\w/, (c) => c.toUpperCase())}</h2>
            <p className="qv-line">{s.card}</p>
            <p className="qv-price"><b>{s.price}</b> · one-time starting price, USD</p>
            <ul className="qv-list">{s.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            <p className="qv-addons">{s.addonNote}</p>
            <div className="qv-actions">
              <Link href={webStartHref(s)} className="btn btn-primary">Start your project</Link>
              <Link href={webServiceHref(s)} className="btn btn-secondary">More details</Link>
            </div>
            <p className="qv-note">{POPUP_NOTE}</p>
          </div>
        </dialog>
      ))}
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

/** Monoline icons for "Included in every website" (ink, one stroke weight). */
const ICONS: Record<string, React.ReactNode> = {
  mobile: (<><rect x="3" y="7" width="20" height="14" /><path d="M9 25h8" /><rect x="20" y="11" width="9" height="16" /></>),
  media: (<><rect x="3" y="5" width="26" height="22" /><rect x="7" y="9" width="18" height="14" /><path d="M14 13l5 3-5 3z" /></>),
  live: (<><circle cx="16" cy="16" r="12.5" /><circle cx="16" cy="16" r="8" /><circle cx="16" cy="16" r="3" /></>),
  handover: (<><circle cx="10" cy="16" r="6" /><path d="M16 16h13M24 16v5M28 16v4" /></>),
};
export function LineIcon({ name }: { name: keyof typeof ICONS | string }) {
  return (
    <svg className="wd-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export { index as cardIndex };
