/**
 * Post-Production: the single source for the six editing services. The service cards,
 * quick-view popups, service pages (/post-production/<path>), the post packages in seed.ts,
 * and the tests all read from here. Prices are verbatim strings. Color grading is not offered
 * as a service; it is only an add-on on an edit. Illustrations reuse the Start a Project
 * engravings until dedicated ones exist (docs/ONBOARDING_ILLUSTRATIONS.md).
 * New copy is logged in docs/COPY_FOR_REVIEW.md for sign-off.
 */
import type { ProcessStep } from "@/lib/content/types";
import type { ServiceArea, StudioService } from "./services";

const ADDONS = {
  color: { name: "Color grading", price: "Quoted separately" },
  captions: { name: "Captions or subtitles", price: "Quoted separately" },
  cutdown: { name: "Social cutdown", price: "From $75 per clip" },
  version: { name: "Extra version or aspect ratio", price: "Quoted separately" },
  revision: { name: "Extra revision round", price: "Quoted separately" },
  rush: { name: "Rush turnaround", price: "Quoted separately" },
} as const;
type AddonKey = keyof typeof ADDONS;

const GROUPS: { title: string; keys: AddonKey[] }[] = [
  { title: "Finishing", keys: ["color", "captions"] },
  { title: "Versions", keys: ["cutdown", "version"] },
  { title: "Timing", keys: ["revision", "rush"] },
];
const addonGroups = (keys: AddonKey[]) =>
  GROUPS.map((g) => ({ title: g.title, items: g.keys.filter((k) => keys.includes(k)).map((k) => ADDONS[k]) }))
    .filter((g) => g.items.length);

/** Shared answers, reused where a service needs them. */
const FAQ_WHERE = { q: "Do you work with people outside Los Angeles?", a: "Yes. The studio is in Los Angeles, but editing happens on files, so where you are is not a limit. Footage comes in over a link and cuts go back the same way." };
const FAQ_COLOR = { q: "Is color grading included?", a: "No. Sound is balanced as part of every edit, and color grading is available as an additional cost, quoted with your edit." };
const FAQ_TIME = { q: "How long does it take?", a: "It depends on the footage and the scope, so you get a specific timeline with your quote rather than a guess up front." };

type PostService = StudioService & { pkgName: string };

export const POST_SERVICES: PostService[] = [
  {
    key: "reel",
    path: "demo-reel-editing",
    pkg: "demo-reel",
    pkgName: "Demo Reel Edit",
    name: "Demo reels",
    price: "From $150",
    card: "Your strongest moments, cut to lead, with a first ten seconds that hold.",
    art: "/assets/onboarding/welcome-projector.webp",
    highlights: [
      "Footage reviewed, strongest moments chosen",
      "Cut to a tight 60 to 90 seconds",
      "Sound cleaned and levels matched",
      "Name and contact titles",
      "Exports ready for casting platforms",
    ],
    addonNote: "Optional additions: color grading, extra versions, and rush turnaround.",
    audience: "For actors who have the footage and want a reel that leads with their best work.",
    sections: [
      { title: "Included", items: ["All your footage reviewed", "The strongest moments chosen and ordered", "A tight 60 to 90 second cut", "Sound cleaned and levels matched across sources", "Name and contact titles", "Two revision rounds", "Exports ready for casting platforms"] },
      { title: "What you send", items: ["Your footage, or links to it", "Notes on favourite takes, if you have them"] },
    ],
    separate: "Color grading and extra versions are optional and quoted separately.",
    addonGroups: addonGroups(["color", "version", "revision", "rush"]),
    materials: ["Footage files or download links", "Your name and contact for the titles", "Notes on favourite moments (optional)", "Where the reel will live: casting sites, reps, your website"],
    faqs: [
      { q: "Can you cut a reel from footage I already have?", a: "That is most of the work. Scenes come from different shoots with different sound, and the job is to balance them so the performance reads as one piece." },
      { q: "How long should my reel be?", a: "Most reels land between 60 and 90 seconds. We open on a moment that holds and keep it tight enough to be watched to the end." },
      { q: "Can you add new clips to my reel later?", a: "Yes. Adding new material to an existing reel is quoted as a small update." },
      FAQ_COLOR,
    ],
    cta: "Send us your footage.",
  },
  {
    key: "scene",
    path: "scene-editing",
    pkg: "scene-edit",
    pkgName: "Scene Edit",
    name: "Scene edits",
    price: "From $200",
    card: "Individual scenes cut and balanced so the performance is what reads.",
    art: "/assets/onboarding/who-director.webp",
    highlights: [
      "One scene, up to three minutes",
      "A cut shaped around the performance",
      "Dialogue cleaned up",
      "Music, if wanted",
      "Exports for your reel or a submission",
    ],
    addonNote: "Optional additions: color grading, captions, a social cutdown, and rush turnaround.",
    audience: "For actors and filmmakers who need a scene finished, for fresh reel material or a specific submission.",
    sections: [
      { title: "Included", items: ["One scene, up to three minutes", "A cut shaped around the performance", "Dialogue cleaned up and levels balanced", "Music, if wanted", "Two revision rounds", "Exports for your reel or a submission"] },
      { title: "What you send", items: ["All takes and angles for the scene", "The script pages, if you have them"] },
    ],
    separate: "Longer scenes and color grading are quoted separately.",
    addonGroups: addonGroups(["color", "captions", "cutdown", "revision", "rush"]),
    materials: ["Every take and angle of the scene", "Separate audio files, if they were recorded", "The script pages (optional)", "Where the scene is going: a reel, a submission, or online"],
    faqs: [
      { q: "What do you need from me to start?", a: "Your footage and a sense of where you are trying to get: a rep, a festival, a casting submission. Notes on favourite takes help, but they are not required." },
      { q: "Can the scene go into my reel?", a: "Yes. A finished scene can go into a new or existing reel. The reel edit is quoted on its own." },
      FAQ_COLOR,
    ],
    cta: "Send us the scene.",
  },
  {
    key: "teaser",
    path: "teaser-editing",
    pkg: "teaser",
    pkgName: "Teaser Edit",
    name: "Teasers",
    price: "From $350",
    card: "A short, sharp first look, built to travel and true to the world of the film.",
    art: "/assets/onboarding/who-company.webp",
    highlights: [
      "A first look true to the film",
      "Mood-forward pacing",
      "Music and sound pass",
      "Widescreen and vertical exports",
      "Two revision rounds",
    ],
    addonNote: "Optional additions: color grading, captions, extra versions, and rush turnaround.",
    audience: "For filmmakers who want a first look at the film that sets the mood without giving the story away.",
    sections: [
      { title: "Included", items: ["A short cut true to the world of the film", "Mood-forward pacing", "Music and sound pass", "Widescreen and vertical exports", "Two revision rounds"] },
      { title: "What you send", items: ["The film or its selects", "Music you have the rights to, or a note that you need some"] },
    ],
    separate: "Color grading, captions, and extra versions are quoted separately.",
    addonGroups: addonGroups(["color", "captions", "cutdown", "version", "revision", "rush"]),
    materials: ["The cut of the film, or its selects", "Any music you have the rights to", "Title and credit text", "Where the teaser will be shared"],
    faqs: [
      { q: "What's the difference between a teaser and a trailer?", a: "A teaser is a short first look that sets the mood. A trailer is longer and shows more of the story, built to festival and distributor requirements." },
      FAQ_TIME,
      FAQ_COLOR,
    ],
    cta: "Send us the film.",
  },
  {
    key: "trailer",
    path: "trailer-editing",
    pkg: "trailer",
    pkgName: "Trailer Edit",
    name: "Trailers",
    price: "From $850",
    card: "The two minutes that make programmers and audiences want the rest.",
    art: "/assets/onboarding/service-post.webp",
    highlights: [
      "A trailer cut from the full film",
      "Built to festival and distributor requirements",
      "Music and sound design pass",
      "Festival-spec exports",
      "Two revision rounds",
    ],
    addonNote: "Optional additions: color grading, captions, social cutdowns, and rush turnaround.",
    audience: "For filmmakers taking a finished film to festivals, distributors, and audiences.",
    sections: [
      { title: "Included", items: ["A trailer cut from the full film", "Built to festival and distributor requirements", "Music and sound design pass", "Festival-spec exports", "Two revision rounds"] },
      { title: "What you send", items: ["The film, or its selects", "Music you have the rights to, or a note that you need some", "Any festival or distributor specs"] },
    ],
    separate: "Color grading, captions, and social cutdowns are quoted separately.",
    addonGroups: addonGroups(["color", "captions", "cutdown", "version", "revision", "rush"]),
    materials: ["The film, or its selects", "Any music you have the rights to", "Title, credit, and laurel text", "Festival or distributor delivery specs"],
    faqs: [
      { q: "Can you cut social versions from the trailer?", a: "Yes. Social cutdowns are an optional addition, from $75 per clip." },
      FAQ_TIME,
      FAQ_COLOR,
      FAQ_WHERE,
    ],
    cta: "Send us the film.",
  },
  {
    key: "film",
    path: "short-film-editing",
    pkg: "short-film-edit",
    pkgName: "Short Film Edit",
    name: "Short films",
    price: "Quote on request",
    card: "Story-first cuts that hold an audience from first frame to last.",
    art: "/assets/onboarding/who-filmmaker.webp",
    highlights: [
      "Structure, pacing, and performance shaped",
      "Sound balanced across the whole film",
      "Two revision rounds",
      "Festival-ready exports",
      "Quoted on runtime and footage",
    ],
    addonNote: "Optional additions: color grading, captions, a trailer or teaser, and rush turnaround.",
    audience: "For filmmakers with a short film shot and ready to find its shape in the edit.",
    sections: [
      { title: "Included", items: ["Structure, pacing, performance, and rhythm shaped to serve the film", "Sound balanced across the whole piece", "Two revision rounds", "Festival-ready exports"] },
      { title: "What you send", items: ["All footage and audio", "The script", "Your notes on the story you want to tell"] },
    ],
    separate: "Every short film is quoted on its own, based on runtime and footage.",
    addonGroups: addonGroups(["color", "captions", "cutdown", "revision", "rush"]),
    materials: ["All footage and separate audio", "The script and any shot notes", "Music you have the rights to", "Festival or delivery specs, if you have them"],
    faqs: [
      { q: "How is a short film priced?", a: "Each film is quoted on its own, based on runtime and footage. Tell us about the film and you'll get a clear quote before anything starts." },
      { q: "Can you cut the trailer too?", a: "Yes. A trailer or teaser can be quoted with the film, or on its own later." },
      FAQ_COLOR,
      FAQ_WHERE,
    ],
    cta: "Send us the film.",
  },
  {
    key: "social",
    path: "social-cutdowns",
    pkg: "social-cutdowns",
    pkgName: "Social Cutdowns",
    name: "Social cutdowns",
    price: "From $75 per clip",
    card: "Vertical cutdowns paced for the feed, true to the film's tone.",
    art: "/assets/onboarding/who-other.webp",
    highlights: [
      "Cut from your film or footage",
      "Paced for the feed",
      "Kept on-tone, not chopped into noise",
      "Vertical, square, or widescreen",
    ],
    addonNote: "Optional additions: color grading, captions, and rush turnaround.",
    audience: "For filmmakers and actors who want clips from their work that feel like the film, not an ad for it.",
    sections: [
      { title: "Included", items: ["A clip cut from your film or footage", "Paced for the feed", "Kept on-tone with the film", "Vertical, square, or widescreen export"] },
      { title: "What you send", items: ["The film or the footage", "The moments you'd like to share, if you know them"] },
    ],
    separate: "Priced per clip. Color grading and captions are quoted separately.",
    addonGroups: addonGroups(["color", "captions", "revision", "rush"]),
    materials: ["The film or footage", "Moments you'd like to use (optional)", "Where the clips will be posted"],
    faqs: [
      { q: "How many clips can I order?", a: "As many as the film needs. Each clip starts from $75, and your quote confirms the total." },
      FAQ_TIME,
      FAQ_COLOR,
    ],
    cta: "Send us the film.",
  },
];

export const postServiceByPath = (path: string) => POST_SERVICES.find((s) => s.path === path);

export const POST_PRICING_NOTE =
  "One-time starting prices in USD, with two revision rounds. The final price depends on the footage and runtime.";

export const POST_AREA: ServiceArea = {
  base: "/post-production",
  allLabel: "All post-production services",
  pricingNote: POST_PRICING_NOTE,
  popupNote: "Color grading is an additional cost. Final scope is confirmed before booking.",
  addonsNote: "Add-ons are quoted with your edit, so you know the full price before we start.",
  prepareNote: "You can get in touch before everything is ready. We'll confirm what we need once you book.",
  ctaLede: "Tell us what the piece is for and where it needs to go. You'll get a clear plan, a timeline, and a quote.",
};

export const POST_INCLUDED: { icon: "cut" | "sound" | "rounds" | "export"; title: string; body: string }[] = [
  { icon: "cut", title: "Story-first cut", body: "Structure and pacing shaped around what the piece is trying to say." },
  { icon: "sound", title: "Sound balanced", body: "Dialogue cleaned up and levels matched across sources." },
  { icon: "rounds", title: "Two revision rounds", body: "One set of notes per round, from everyone at once." },
  { icon: "export", title: "Ready to share", body: "Exports for wherever it's going: casting sites, festivals, or the feed." },
];

export const POST_PROCESS: ProcessStep[] = [
  { tag: "Step 01", title: "Tell us about the piece", body: "Share what it is, where it's going, and when you need it." },
  { tag: "Step 02", title: "Send the footage", body: "Through a private link from whatever you already use: Frame.io, Google Drive, Dropbox, or WeTransfer." },
  { tag: "Step 03", title: "Cut and refine", body: "You review each cut and send one set of notes per round." },
  { tag: "Step 04", title: "Deliver", body: "You get final exports for wherever the work is going." },
];
