/**
 * The shared shape behind both service areas (Web Design and Post-Production): the cards,
 * quick-view popups, and per-service pages in src/components/site/Services.tsx render from
 * this. Each area keeps its own source file (web-design.ts, post-production.ts).
 */

export type StudioService = {
  key: string;
  path: string; // <area base>/<path>
  pkg: string; // package slug in seed.ts; /start?package=<pkg> preselects it
  name: string; // card + page title, e.g. "Actor websites"
  price: string; // verbatim, e.g. "From $650"
  card: string; // one sentence: card, popup, page lede
  art: string; // engraving (same set as Start a Project)
  highlights: string[]; // popup, 4–5 short items
  addonNote: string; // popup, one line
  audience: string; // card body + service page opening
  sections: { title: string; items: string[] }[]; // the starting-package accordion
  separate: string; // italic line under the package
  addonGroups: { title: string; items: { name: string; price: string }[] }[];
  addonFootnote?: string; // extra line after the add-ons (e.g. the portal note)
  materials: string[];
  faqs: { q: string; a: string }[]; // 3–4
  cta: string;
};

/** Area-level wording shared by every service in that area. */
export type ServiceArea = {
  base: "/web-design" | "/post-production";
  allLabel: string; // back link + CTA secondary, e.g. "All web design services"
  pricingNote: string; // under the package + services heading
  popupNote: string;
  addonsNote: string; // after the optional additions
  prepareNote: string;
  ctaLede: string;
};

export const serviceHref = (area: ServiceArea, s: StudioService) => `${area.base}/${s.path}`;
export const serviceStartHref = (s: StudioService) => `/start?package=${s.pkg}`;
/** The line after a price: starting prices vs. services quoted per project. */
export const priceNote = (s: StudioService) =>
  s.price.startsWith("From") ? "one-time starting price, USD" : "tailored to your project";
export const capitalize = (t: string) => t.replace(/^\w/, (c) => c.toUpperCase());
