/**
 * One page per website service (/web-design/<path>), all from the same template and the
 * shared source in src/content/web-design.ts. Compact: a two-column top (who it's for +
 * the starting package, always visible), then organized dropdowns.
 */
import Link from "next/link";
import { ADDON_GROUPS, ADDONS, PREPARE_NOTE, PRICING_NOTE_SHORT, SUBSCRIPTIONS_NOTE, type WebService } from "@/content/web-design";
import { CtaBand } from "./blocks";
import { Faqs, ServiceArt, ToneRows, webStartHref } from "./WebDesign";

export function WebServicePage({ s }: { s: WebService }) {
  const start = webStartHref(s);
  const title = s.name.replace(/^\w/, (c) => c.toUpperCase());
  const groups = ADDON_GROUPS
    .map((g) => ({ title: g.title, keys: g.keys.filter((k) => s.addons.includes(k)) }))
    .filter((g) => g.keys.length);
  const sections = [
    { title: "Core pages", items: s.core },
    ...(s.entries ? [{ title: "Project entries", items: [s.entries] }] : []),
    { title: "Included", items: s.includes },
  ];

  return (
    <>
      {/* ============ TOP: who it's for + the starting package ============ */}
      <section className="wd-section wd-first">
        <div className="wrap">
          <Link href="/web-design" className="slate wsp-back">← All web design services</Link>
          <div className="wsp-top">
            <div className="wsp-intro wwd-tone-1">
              <ServiceArt s={s} className="wsp-art" />
              <h1 className="display display-lg">{title}.</h1>
              <p className="lede">{s.audience}</p>
              <p className="wsp-price"><b>{s.price}</b> · one-time starting price, USD</p>
              <Link href={start} className="btn btn-primary">Start your project</Link>
            </div>
            <div className="wsp-pkg wwd-tone-2">
              <h2 className="wsp-pkg-title">Starting package</h2>
              <div className="wsp-secs">
                {sections.map((sec, i) => (
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
              <p className="wsp-note">{PRICING_NOTE_SHORT}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DETAILS (dropdowns) ============ */}
      <section className="wd-section">
        <div className="wrap wd-two">
          <div>
            <h2 className="display display-sm wd-col-title">Optional additions</h2>
            <ToneRows
              items={groups.map((g) => ({
                title: g.title,
                meta: `${g.keys.length} option${g.keys.length > 1 ? "s" : ""}`,
                body: (
                  <ul className="wsp-addons">
                    {g.keys.map((k) => <li key={k}><span>{ADDONS[k].name}</span><span className="wsp-addon-price">{ADDONS[k].price}</span></li>)}
                  </ul>
                ),
              }))}
            />
            <p className="wsp-note">
              {SUBSCRIPTIONS_NOTE}
              {s.key === "production" && " A custom client portal or dashboard is its own project, not an add-on."}
            </p>

            <h2 className="display display-sm wd-col-title wd-col-gap">What to prepare</h2>
            <ToneRows items={[{
              title: "Your checklist",
              meta: `${s.materials.length} items`,
              body: (<><ul className="wsp-list">{s.materials.map((x) => <li key={x}>{x}</li>)}</ul><p className="wsp-note">{PREPARE_NOTE}</p></>),
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
        lede="Tell us what you're making, what materials you have, and when you'd like it live. We'll help define the scope and send a clear quote."
        primary={{ href: start, label: "Start your project" }}
        secondary={{ href: "/web-design", label: "All web design services" }}
      />
    </>
  );
}
