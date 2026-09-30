/**
 * Web Design: the single source for the six website services. The service cards, quick-view
 * popups, service pages (/web-design/<path>), the web-design packages in seed.ts, and the tests
 * all read from here, so prices and scope cannot drift. Illustrations reuse the Start a Project
 * engravings in public/assets/onboarding/. Prices are verbatim strings.
 * New copy is logged in docs/COPY_FOR_REVIEW.md for sign-off.
 */
import type { ProcessStep } from "@/lib/content/types";
import type { ServiceArea, StudioService } from "./services";

/** Optional additions at their approved one-time starting prices. */
export const ADDONS = {
  page: { name: "Additional standard page", price: "From $150" },
  entry: { name: "Additional project entry, using an existing layout", price: "From $50" },
  language: { name: "Additional language (with approved translations you supply)", price: "From $300" },
  blog: { name: "Blog or news section", price: "From $250" },
  form: { name: "Additional or advanced inquiry form", price: "From $150" },
  newsletter: { name: "Newsletter signup", price: "From $100" },
  booking: { name: "Booking, through a service you already use", price: "From $150" },
  editor: { name: "Content editor setup", price: "Quoted by platform" },
  restricted: { name: "Restricted press or project area", price: "Quoted by platform" },
  copy: { name: "Copywriting", price: "Quoted separately" },
  updates: { name: "Ongoing updates", price: "By quote" },
} as const;
export type AddonKey = keyof typeof ADDONS;

/** Add-ons are shown in these dropdown groups on the service pages (only groups a service uses). */
export const ADDON_GROUPS: { title: string; keys: AddonKey[] }[] = [
  { title: "Pages & content", keys: ["page", "entry", "blog", "copy"] },
  { title: "Reach", keys: ["language", "newsletter"] },
  { title: "Tools & access", keys: ["booking", "form", "editor", "restricted"] },
  { title: "Support", keys: ["updates"] },
];


export type WebService = {
  key: string;
  path: string; // /web-design/<path>
  pkg: string; // package slug in seed.ts; /start?package=<pkg> preselects it
  name: string;
  price: string;
  card: string; // one sentence: card, popup, page lede
  art: string; // engraving (same set as Start a Project)
  highlights: string[]; // popup, 4–5 short items
  addonNote: string; // popup, one line
  audience: string; // service page opening
  core: string[]; // core pages / sections
  entries?: string; // project entries using a shared layout
  includes: string[];
  separate: string;
  addons: AddonKey[];
  materials: string[];
  faqs: { q: string; a: string }[]; // 3–4
  cta: string;
};

export const WEB_SERVICES: WebService[] = [
  {
    key: "actor",
    path: "actor-websites",
    pkg: "actor-website",
    name: "Actor websites",
    price: "From $650",
    card: "Your headshots, reel, credits, and contact, all in one place.",
    art: "/assets/onboarding/who-actor.webp",
    highlights: [
      "One scrolling page",
      "Short bio and up to six headshots",
      "Up to two reel or video embeds",
      "Résumé download and casting-profile links",
      "Representation and contact details",
    ],
    addonNote: "Optional additions: extra pages, another language, and content editing.",
    audience: "For actors who want one clear link for casting, reps, and anyone else who asks where to see their work.",
    core: ["One scrolling page, with sections for your bio, headshots, reel, résumé, and contact"],
    includes: [
      "A short biography",
      "Up to six headshots you supply",
      "Up to two reel or video embeds",
      "Your résumé as a download",
      "Representation details and casting-profile links",
      "Contact details",
    ],
    separate: "More pages are optional and quoted separately.",
    addons: ["page", "language", "editor", "updates"],
    materials: ["A short biography", "Headshots (original files)", "Résumé or credits", "Reel links, if you have them", "Representation details", "Casting-profile links"],
    faqs: [
      { q: "Can I go live without a reel?", a: "Yes. The site can go live with your headshots, résumé, and contact, and a reel section can be added once your reel is ready. If that falls outside the original scope, it's a small quoted update." },
      { q: "Can I update my headshots and résumé later?", a: "Yes. How depends on the platform we agree on: you change them yourself in the site editor, or we make the update for you as a small paid change. Your proposal says which." },
      { q: "Can the site be in two languages?", a: "Yes, as an optional addition from $300, with approved translations you supply. The final scope is confirmed in your quote." },
    ],
    cta: "Start your actor website.",
  },
  {
    key: "director",
    path: "director-websites",
    pkg: "director-website",
    name: "Director websites",
    price: "From $1,000",
    card: "Your films, bio, and contact across a few focused pages.",
    art: "/assets/onboarding/who-director.webp",
    highlights: [
      "Up to four pages: home, work, about, contact",
      "Up to three projects in one shared layout",
      "Video links, stills, description, and credits for each",
      "Bio and contact details",
    ],
    addonNote: "Optional additions: more project entries, individually designed project pages, and another language.",
    audience: "For directors who want their work to lead, with each project presented clearly and consistently.",
    core: ["Home", "Work", "About", "Contact"],
    entries: "Up to three project entries, using one shared project layout",
    includes: ["Your video links and stills for each project", "A description and credits for each project", "Your bio and contact details"],
    separate: "Individually designed pages for each project are an additional cost.",
    addons: ["entry", "page", "language", "restricted", "editor"],
    materials: ["Biography", "Portrait", "Reel, if you have one", "Selected projects: titles, your role, descriptions, stills, video links, and credits"],
    faqs: [
      { q: "Can I separate different kinds of directing work?", a: "Yes. Projects can be grouped, say narrative, commercial, and music video, inside the shared project layout. Groups or entries beyond the starting scope are optional additions." },
      { q: "Can some projects stay private?", a: "Yes. A project can stay off the site entirely until you're ready. A password-protected area is a separate addition, quoted by platform." },
      { q: "Can I add projects later?", a: "Yes. New projects use the same layout, from $50 each, or in the site editor if your platform includes one." },
    ],
    cta: "Start your director website.",
  },
  {
    key: "production",
    path: "production-company-websites",
    pkg: "production-website",
    name: "Production company websites",
    price: "From $1,500",
    card: "Your company, slate, team, and a clear way to get in touch.",
    art: "/assets/onboarding/who-company.webp",
    highlights: [
      "Up to five pages",
      "Company information, work or slate, team or services, contact",
      "Up to four projects in a shared layout",
      "One standard inquiry form",
    ],
    addonNote: "Optional additions: more pages and projects, a restricted press area, and another language.",
    audience: "For production companies that need to show their slate and team, and make inquiries easy.",
    core: ["Up to five core pages, covering company information, selected work or slate, team or services, and contact"],
    entries: "Up to four project entries, using a shared layout",
    includes: ["One standard inquiry form", "Stills and trailers for each project", "Team information"],
    separate: "Large rosters, extensive slates, private portals, and complex workflows are scoped as separate projects.",
    addons: ["page", "entry", "restricted", "language", "blog", "editor"],
    materials: ["Logo and branding", "Company overview", "Services", "Team information", "Approved slate and project information", "Stills and trailers", "Who handles inquiries"],
    faqs: [
      { q: "Can we show projects in development?", a: "Yes, with whatever you're comfortable making public: a title, a logline, a still. Anything under embargo stays off the site until you approve it." },
      { q: "Can we add more projects and team members later?", a: "Yes. Projects and people use shared layouts, so adding them is straightforward: in the site editor if your platform includes one, or as a paid update." },
      { q: "Can we have a private area for partners or press?", a: "A restricted press or project area can be added, quoted by platform and your privacy needs. A custom client portal or dashboard is its own project, not an add-on." },
    ],
    cta: "Start your production company website.",
  },
  {
    key: "portfolio",
    path: "portfolio-websites",
    pkg: "portfolio-website",
    name: "Portfolio websites",
    price: "From $900",
    card: "A body of work, for cinematographers, photographers, writers, designers, and composers.",
    art: "/assets/onboarding/who-other.webp",
    highlights: [
      "Up to three pages",
      "Up to four projects in a shared layout",
      "Your images or media and project descriptions",
      "Biography and contact",
    ],
    addonNote: "Optional additions: more project entries, extra pages, and another language.",
    audience: "For individual creatives, like cinematographers, photographers, writers, designers, and composers, whose work needs to be seen in one place.",
    core: ["Up to three core pages, such as work, about, and contact"],
    entries: "Up to four project entries, using a shared layout",
    includes: ["Your images or media", "Project descriptions", "Biography and contact details"],
    separate: "More project entries can be added using the same layout.",
    addons: ["entry", "page", "language", "editor"],
    materials: ["Biography", "Your discipline", "Selected projects", "Your role on each project", "Descriptions", "Images or media"],
    faqs: [
      { q: "Can I show more than one creative discipline?", a: "Yes. Projects can be grouped by discipline, so a cinematographer who also writes can show both without the site feeling split in two." },
      { q: "How many projects do I need to go live?", a: "The starting scope holds up to four. A few strong projects tend to read better than a long list, and more can be added later." },
      { q: "What's the difference from a creative business site?", a: "A portfolio shows one person's work. A creative business site explains your services and helps clients get in touch." },
    ],
    cta: "Start your portfolio website.",
  },
  {
    key: "film",
    path: "film-websites",
    pkg: "film-website",
    name: "Film websites",
    price: "From $750",
    card: "One page for one film: poster, trailer, stills, and where to watch.",
    art: "/assets/onboarding/who-filmmaker.webp",
    highlights: [
      "One page for one film",
      "Poster, synopsis, and trailer if available",
      "Up to eight stills and selected credits",
      "Festival information and press-kit download",
      "Screening and watch links",
    ],
    addonNote: "Optional additions: another language, a restricted press area, and newsletter signup.",
    audience: "For filmmakers who want one home for a single film, through festivals, press, and release.",
    core: ["One page for one film"],
    includes: [
      "Your title artwork or poster",
      "Synopsis, and trailer if available",
      "Up to eight stills",
      "Selected credits",
      "Festival information you supply",
      "Press-kit download",
      "Contact, plus links to screenings or where to watch",
    ],
    separate: "Creating the poster, trailer, or press kit is separate.",
    addons: ["language", "restricted", "newsletter", "page"],
    materials: ["Title artwork or poster", "Logline and synopsis", "Film details", "Approved credits", "Stills", "Trailer, if available", "Any press kit, laurels, or screening links"],
    faqs: [
      { q: "Can the site go live before the trailer is ready?", a: "Yes. It can go live with the poster, synopsis, and stills, and the trailer is added when it's finished." },
      { q: "Can we add festival dates, press, and watch links later?", a: "Yes. How depends on the platform: in the site editor if your site has one, or as a small paid update." },
      { q: "What if some material is under embargo?", a: "Tell us what's private or embargoed, and it stays off the site until you approve it." },
    ],
    cta: "Start your film website.",
  },
  {
    key: "business",
    path: "creative-business-websites",
    pkg: "creative-business-website",
    name: "Creative business websites",
    price: "From $1,200",
    card: "Your services, your work, and an easy way for clients to inquire.",
    art: "/assets/onboarding/who-business.webp",
    highlights: [
      "Up to four pages",
      "Services, about, work or testimonials, contact",
      "Up to three work examples",
      "One standard inquiry form",
    ],
    addonNote: "Optional additions: booking through a service you use, newsletter signup, and a blog.",
    audience: "For studios and creative businesses that need to explain what they offer and make it easy to get in touch.",
    core: ["Services", "About", "Selected work or testimonials", "Contact"],
    entries: "Up to three work examples",
    includes: ["One standard inquiry form", "Your approved testimonials, if you have them"],
    separate: "Booking, payments, shops, and more involved integrations are optional additions.",
    addons: ["booking", "newsletter", "blog", "form", "copy", "language"],
    materials: ["Business overview", "Service descriptions", "Who you work with", "Branding", "Work examples", "Approved testimonials"],
    faqs: [
      { q: "Can visitors book or pay through the website?", a: "Booking can be added by connecting a service you already use, from $150. Payments and shops are scoped separately, depending on what you sell." },
      { q: "Can you help write our service descriptions?", a: "The starting price assumes you supply the text. Copywriting is available as a separate quote." },
      { q: "What's the difference from a portfolio?", a: "A creative business site explains your services and helps clients reach you. A portfolio shows one person's body of work." },
    ],
    cta: "Start your creative business website.",
  },
];

export const webServiceByPath = (path: string) => WEB_SERVICES.find((s) => s.path === path);

export const PRICING_NOTE_SHORT =
  "One-time starting prices in USD. Includes supplied content and two revision rounds. Hosting, domain, and third-party subscriptions are separate.";

export const POPUP_NOTE = "Hosting and domain fees are separate. Final scope is confirmed before booking.";

export const SUBSCRIPTIONS_NOTE =
  "These are one-time setup prices. Anything you connect, like a newsletter tool or booking app, bills its own subscription directly to you.";

export const PREPARE_NOTE =
  "You can get in touch before everything is ready. A tailored checklist follows once you book.";

export const INCLUDED_HIGHLIGHTS: { icon: "mobile" | "media" | "live" | "handover"; title: string; body: string }[] = [
  { icon: "mobile", title: "Mobile-ready", body: "Layouts for phones and desktops." },
  { icon: "media", title: "Media prepared", body: "Optimized images and embedded video." },
  { icon: "live", title: "Going live included", body: "Domain connection and final testing." },
  { icon: "handover", title: "Supported handover", body: "Instructions, and 14 days of fixes for issues with the agreed build." },
];

export const PROCESS: ProcessStep[] = [
  { tag: "Step 01", title: "Tell us about the site", body: "Share who it's for, what it needs, and when you'd like it live." },
  { tag: "Step 02", title: "Gather the materials", body: "You get a checklist for your kind of site, and we agree on the structure." },
  { tag: "Step 03", title: "Design, build, refine", body: "You review a working preview and send one set of notes per round." },
  { tag: "Step 04", title: "Go live and hand over", body: "We connect your domain, run final checks, and show you around." },
];

/** Web services in the shared shape the cards, popups, and service pages render from. */
export const WEB_AREA: ServiceArea = {
  base: "/web-design",
  allLabel: "All web design services",
  pricingNote: PRICING_NOTE_SHORT,
  popupNote: POPUP_NOTE,
  addonsNote: SUBSCRIPTIONS_NOTE,
  prepareNote: PREPARE_NOTE,
  ctaLede: "Tell us what you're making, what materials you have, and when you'd like it live. We'll help define the scope and send a clear quote.",
};

export const toStudio = (s: WebService): StudioService => ({
  key: s.key, path: s.path, pkg: s.pkg, name: s.name, price: s.price, card: s.card, art: s.art,
  highlights: s.highlights, addonNote: s.addonNote, audience: s.audience,
  sections: [
    { title: "Core pages", items: s.core },
    ...(s.entries ? [{ title: "Project entries", items: [s.entries] }] : []),
    { title: "Included", items: s.includes },
  ],
  separate: s.separate,
  addonGroups: ADDON_GROUPS
    .map((g) => ({ title: g.title, items: g.keys.filter((k) => s.addons.includes(k)).map((k) => ADDONS[k]) }))
    .filter((g) => g.items.length),
  addonFootnote: s.key === "production" ? "A custom client portal or dashboard is its own project, not an add-on." : undefined,
  materials: s.materials, faqs: s.faqs, cta: s.cta,
});

export const WEB_STUDIO: StudioService[] = WEB_SERVICES.map(toStudio);
