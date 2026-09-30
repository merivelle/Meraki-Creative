/**
 * Seed content, transcribed from the original static pages (see legacy/).
 * - `npm run seed:content` writes this into Supabase and publishes it.
 * - The public site falls back to this data only when Supabase isn't configured
 *   (e.g. a preview build with no database), so pages always render.
 * Prices are verbatim strings; do not compute or reformat them. Editing and bundle prices come
 * from legacy/packages.html; website prices come from src/content/web-design.ts.
 */
import type { ContentBlocks, Faq, PackageItem, PortfolioItem, PublicContent, ServiceItem, Testimonial } from "@/lib/content/types";
import { WEB_SERVICES } from "./web-design";

// Stable ids so re-seeding updates rows instead of duplicating them.
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const seedServices: ServiceItem[] = [
  // Post-production (legacy/post-production.html + services.html)
  { id: id(101), categoryId: "post-production", roleLabel: "Film", title: "Short Film Editing", description: "Story-first cuts that hold an audience from first frame to last. Structure, pacing, performance, and rhythm shaped to serve the film, with color and sound balanced across the whole piece.", summary: "Story-first cuts that hold an audience from first frame to last.", sort: 10 },
  { id: id(102), categoryId: "post-production", roleLabel: "Trailer", title: "Trailer Editing", description: "The two minutes that make programmers and audiences want the rest. Built to meet festival and distributor requirements.", summary: "The two minutes that make a festival or a buyer want the rest.", sort: 20 },
  { id: id(103), categoryId: "post-production", roleLabel: "Teaser", title: "Teaser Editing", description: "A short, sharp first look designed to travel: social-ready, mood-forward, and true to the world of the film.", summary: "A short, sharp first look built to travel and leave a mark.", sort: 30 },
  { id: id(104), categoryId: "post-production", roleLabel: "Reel", title: "Demo Reel Editing", description: "Your strongest work cut to lead, opening on a moment that holds and kept tight enough to get watched to the end. Color and sound balanced across sources, and exported ready for casting platforms.", summary: "Your strongest moments cut to lead, with a first ten seconds that hold.", sort: 40 },
  { id: id(105), categoryId: "post-production", roleLabel: "Scene", title: "Scene Editing", description: "Individual scenes cut, trimmed, and balanced so the performance, not the production, is what reads. Ideal for fresh reel material or a specific submission.", summary: "Individual scenes cut and balanced so the performance is what reads.", sort: 50 },
  { id: id(106), categoryId: "post-production", roleLabel: "Social", title: "Social Media Editing", description: "Vertical cutdowns and clips paced for the feed, cut from your film and kept on-tone, not chopped into noise.", summary: "Vertical cutdowns paced for the feed, true to the film's tone.", sort: 60 },
  { id: id(107), categoryId: "post-production", roleLabel: "Color", title: "Color Grading", description: "A grade that matches sources to each other and holds the tone of the film. See the before-and-after sliders in the work for what that changes.", summary: null, sort: 70 },
  // Web design (legacy/website-design.html)
  { id: id(111), categoryId: "web-design", roleLabel: "Actor", title: "Actor Websites", description: "A one-page site with your biography, headshots, reel, résumé, representation, casting links, and contact.", summary: "Your bio, headshots, reel, and résumé on one clear page.", sort: 10 },
  { id: id(112), categoryId: "web-design", roleLabel: "Director", title: "Director Websites", description: "Up to four pages, with up to three projects shown in one shared layout: video, stills, description, and credits.", summary: "Your work, bio, and contact across up to four pages.", sort: 20 },
  { id: id(113), categoryId: "web-design", roleLabel: "Co.", title: "Production Company Websites", description: "Up to five pages for your company, slate, team or services, and inquiries, with four projects in a shared layout.", summary: "Your company, slate, team, and inquiries in one place.", sort: 30 },
  { id: id(114), categoryId: "web-design", roleLabel: "Folio", title: "Portfolio Websites", description: "For individual creatives, like cinematographers, photographers, writers, designers, and composers: up to three pages and four projects.", summary: "Your body of work in one place, up to four projects.", sort: 40 },
  { id: id(115), categoryId: "web-design", roleLabel: "Film", title: "Film Websites", description: "A one-page site for a single film: poster, synopsis, trailer, stills, credits, festival information, press kit, and where to watch.", summary: "Poster, trailer, stills, and credits for one film.", sort: 50 },
  { id: id(117), categoryId: "web-design", roleLabel: "Studio", title: "Creative Business Websites", description: "Up to four pages that explain your services, show your work, and make it easy for clients to inquire.", summary: null, sort: 60 },
];

// Website packages are generated from the Web Design source so prices and scope can't drift.
// Ids are fixed per slug (the CMS keys rows by id).
const WEB_PACKAGE_IDS: Record<string, number> = {
  "actor-website": 208, "director-website": 209, "production-website": 210,
  "portfolio-website": 215, "film-website": 216, "creative-business-website": 217,
};
const webPackages: PackageItem[] = WEB_SERVICES.map((w, i) => ({
  id: id(WEB_PACKAGE_IDS[w.pkg]), slug: w.pkg, categoryId: "web-design", groupTitle: "Websites",
  label: `Web / ${w.name.replace(/ websites$/, "")}`, name: w.name.replace(/websites$/, "Website").replace(/^\w/, (c) => c.toUpperCase()),
  priceDisplay: w.price, included: w.highlights.slice(0, 4), tagline: w.card, featured: false, sort: (i + 1) * 10,
}));

export const seedPackages: PackageItem[] = [
  { id: id(201), slug: "reel-refresh", categoryId: "post-production", groupTitle: "Demo Reels", label: "Post / Refresh", name: "Demo Reel Refresh", priceDisplay: "From $95", included: ["Up to two new clips added", "Existing reel trimmed and tightened", "Export-ready for casting platforms"], tagline: "A quick refresh to keep your reel current.", featured: false, sort: 10 },
  { id: id(202), slug: "reel-professional", categoryId: "post-production", groupTitle: "Demo Reels", label: "Post / Most booked", name: "Professional Demo Reel Edit", priceDisplay: "From $225", included: ["All footage reviewed, strongest scenes chosen", "Cut to a tight 60–90 second reel", "Audio cleaned, color balanced, titles", "Two revisions"], tagline: "A reel built to lead with your best work.", featured: true, sort: 20 },
  { id: id(203), slug: "reel-premium", categoryId: "post-production", groupTitle: "Demo Reels", label: "Post / Premium", name: "Premium Demo Reel", priceDisplay: "From $350", included: ["Everything in the Professional edit", "Advanced color grade and sound polish", "Scene-order consultation", "Multiple exports (drama, comedy, commercial)", "Three revisions"], tagline: "The full treatment, shaped genre by genre.", featured: false, sort: 30 },
  { id: id(204), slug: "scene-edit", categoryId: "post-production", groupTitle: "Scene Edits", label: "Post / Scene", name: "Basic Scene Edit", priceDisplay: "From $100", included: ["One scene, up to three minutes", "Dialogue cleaned up", "Color correction, music if wanted"], tagline: "Fresh, polished material for a reel or submission.", featured: false, sort: 40 },
  { id: id(205), slug: "scene-cinematic", categoryId: "post-production", groupTitle: "Scene Edits", label: "Post / Most booked", name: "Cinematic Scene Edit", priceDisplay: "From $150", included: ["Professional color grade", "Sound design and pacing adjustments", "Subtle effects", "Multiple exports"], tagline: "One scene, finished with a film's eye.", featured: true, sort: 50 },
  { id: id(206), slug: "scene-premium", categoryId: "post-production", groupTitle: "Scene Edits", label: "Post / Premium", name: "Premium Scene Polish", priceDisplay: "From $250", included: ["Full cinematic finish", "Advanced color grade and audio mix", "Titles where needed", "Social teaser included"], tagline: "A scene taken all the way, plus a cut for the feed.", featured: false, sort: 60 },
  { id: id(207), slug: "trailer", categoryId: "post-production", groupTitle: "Trailer", label: "Post / Trailer", name: "Trailer Package", priceDisplay: "From $850", included: ["Trailer or teaser cut", "Festival-spec exports", "Music & sound design pass", "Color balanced", "Revisions included"], tagline: "The two minutes that make programmers and audiences want the rest.", featured: false, sort: 70 },
  ...webPackages,
  { id: id(213), slug: "acting-package", categoryId: "bundles", groupTitle: "Bundles", label: "Bundle / Actor", name: "Acting Package", priceDisplay: "Quote on request", included: ["Actor website", "Demo reel edit", "One scene edit", "Materials set up to match"], tagline: "Your whole on-screen presence, edited and online in one go.", featured: true, sort: 10 },
  { id: id(214), slug: "filmmaker-package", categoryId: "bundles", groupTitle: "Bundles", label: "Bundle / Filmmaker", name: "Filmmaker Package", priceDisplay: "Quote on request", included: ["Director or company website", "Trailer or teaser edit", "One cohesive presentation"], tagline: "The site and the cut, designed as one to carry the project.", featured: true, sort: 20 },
];

const site = (n: number, slug: string, title: string, typeLabel: string, img: string, alt: string, liveUrl: string, urlLabel: string, sort: number): PortfolioItem => ({
  id: id(n), slug, title, clientName: title, categories: ["web-design"], layout: "site", typeLabel,
  description: null, contribution: "Website design and build",
  images: [{ src: img, alt, role: "cover", width: 1200, height: 900 }],
  video: null, videoLinks: [], liveUrl, urlLabel, featured: true, sort,
});

export const seedPortfolio: PortfolioItem[] = [
  {
    id: id(301), slug: "director-demo-reel", title: "Director Demo Reel", clientName: "Merivelle", categories: ["post-production"], layout: "reel", typeLabel: "Demo Reel",
    description: null, contribution: "Edit", images: [{ src: "/assets/work/showreel-poster.jpg", alt: "Director demo reel poster frame", role: "poster", width: 1280, height: 720 }],
    video: { kind: "file", src: "/assets/work/showreel.mp4", poster: "/assets/work/showreel-poster.jpg", title: "Director demo reel preview" },
    videoLinks: [{ label: "Watch the full reel", url: "https://vimeo.com/merivelle/director-demo-reel" }], liveUrl: null, featured: true, sort: 10,
  },
  site(311, "meraki-creative", "Meraki Creative", "Our Studio Site", "/assets/work/site-meraki.jpg", "Meraki Creative website homepage", "https://www.merakicreative.co/", "merakicreative.co", 20),
  site(312, "merivelle", "Merivelle", "Personal Director Site", "/assets/work/site-merivelle.jpg", "Merivelle director website homepage", "https://merivelle.net", "merivelle.net", 30),
  site(313, "yonatan-shaham-vitos", "Yonatan Shaham Vitos", "Actor Site", "/assets/work/site-yonatan.jpg", "Yonatan Shaham Vitos actor website homepage", "https://yonatanshahamvitos.com", "yonatanshahamvitos.com", 40),
  site(317, "emily-loaiza", "Emily Loaiza", "Actor Site", "/assets/work/site-emily.jpg", "Emily Loaiza actor website homepage", "https://www.emilyloaiza.com", "emilyloaiza.com", 45),
  site(314, "angelique-antoniou", "Angelique Antoniou", "Fine Art Photographer Site", "/assets/work/site-angelique.jpg", "Angelique Antoniou fine art photography website homepage", "https://angeliqueantoniou.com", "angeliqueantoniou.com", 50),
  site(315, "boomerang", "Boomerang", "Trailer Music Studio Site", "/assets/work/site-boomerang.jpg", "Boomerang trailer music website homepage", "https://boomerang-music.com", "boomerang-music.com", 60),
  site(316, "nicky-chartraw", "Nicky Chartraw", "Actor Site", "/assets/work/site-nicky.jpg", "Nicky Chartraw actor website homepage", "https://merakicreativeco.wixsite.com/nickychartraw", "Nicky Chartraw — Actor", 70),
  {
    id: id(321), slug: "the-sitdown", title: "The Sitdown", clientName: null, categories: ["post-production"], layout: "film", typeLabel: "Short Film",
    description: null, contribution: "Edit", images: [{ src: "/assets/work/reel-sitdown-poster.jpg", alt: "The Sitdown poster frame", role: "poster", width: 1280, height: 676 }],
    video: { kind: "file", src: "/assets/work/reel-sitdown.mp4", poster: "/assets/work/reel-sitdown-poster.jpg", title: "The Sitdown excerpt preview" },
    videoLinks: [{ label: "Watch full", url: "https://vimeo.com/1031819637" }], liveUrl: null, featured: true, sort: 80,
  },
  {
    id: id(322), slug: "opa", title: "Opa", clientName: null, categories: ["post-production"], layout: "film", typeLabel: "Short Film",
    description: null, contribution: "Edit", images: [{ src: "/assets/work/film-opa-poster.jpg", alt: "Opa poster frame", role: "poster" }],
    video: { kind: "file", src: "/assets/work/film-opa.mp4", poster: "/assets/work/film-opa-poster.jpg", title: "Opa excerpt preview" },
    videoLinks: [{ label: "Watch full", url: "https://vimeo.com/853901364" }], liveUrl: null, featured: false, sort: 90,
  },
  {
    id: id(331), slug: "sunflower-in-the-field", title: "Sunflower in the Field", clientName: null, categories: ["post-production"], layout: "scene", typeLabel: "Scene",
    description: null, contribution: "Scene edit", images: [{ src: "/assets/work/scene-sunflower-poster.jpg", alt: "Sunflower in the Field poster frame", role: "poster" }],
    video: { kind: "file", src: "/assets/work/scene-sunflower.mp4", poster: "/assets/work/scene-sunflower-poster.jpg", title: "Sunflower in the Field scene preview" },
    videoLinks: [], liveUrl: null, featured: false, sort: 100,
  },
  {
    id: id(332), slug: "i-felt-butterflies", title: "I Felt Butterflies", clientName: null, categories: ["post-production"], layout: "scene", typeLabel: "Scene",
    description: null, contribution: "Scene edit", images: [{ src: "/assets/work/scene-butterflies-poster.jpg", alt: "I Felt Butterflies poster frame", role: "poster" }],
    video: { kind: "file", src: "/assets/work/scene-butterflies.mp4", poster: "/assets/work/scene-butterflies-poster.jpg", title: "I Felt Butterflies scene preview" },
    videoLinks: [], liveUrl: null, featured: false, sort: 110,
  },
  {
    id: id(341), slug: "the-sitdown-trailer", title: "The Sitdown · Official Trailer", clientName: null, categories: ["post-production"], layout: "trailer", typeLabel: "Trailer Edit",
    description: null, contribution: "Trailer edit", images: [],
    video: { kind: "youtube", src: "https://www.youtube-nocookie.com/embed/33llCJ9D4Pg", title: "The Sitdown — official trailer, edited by Meraki Creative" },
    videoLinks: [], liveUrl: null, featured: false, sort: 120,
  },
  {
    id: id(342), slug: "opa-trailer", title: "Opa · Official Trailer", clientName: null, categories: ["post-production"], layout: "trailer", typeLabel: "Trailer Edit",
    description: null, contribution: "Trailer edit", images: [],
    video: { kind: "youtube", src: "https://www.youtube-nocookie.com/embed/G6sOHBuDL08", title: "Opa — official trailer, edited by Meraki Creative" },
    videoLinks: [], liveUrl: null, featured: false, sort: 130,
  },
  {
    id: id(351), slug: "narrative-scene-grade", title: "Narrative scene", clientName: null, categories: ["post-production"], layout: "grade", typeLabel: "Color Grade",
    description: null, contribution: "Color grade",
    images: [
      { src: "/assets/work/grade1-before.jpg", alt: "Narrative scene frame before color grading", role: "before", width: 1600, height: 900 },
      { src: "/assets/work/grade1-after.jpg", alt: "The same narrative scene frame after color grading by Meraki Creative", role: "after", width: 1600, height: 900 },
    ],
    video: null, videoLinks: [], liveUrl: null, featured: false, sort: 140,
  },
  {
    id: id(352), slug: "reel-frame-grade", title: "Reel frame", clientName: null, categories: ["post-production"], layout: "grade", typeLabel: "Color Grade",
    description: null, contribution: "Color grade",
    images: [
      { src: "/assets/work/grade2-before.jpg", alt: "Demo reel frame before color grading", role: "before", width: 1600, height: 900 },
      { src: "/assets/work/grade2-after.jpg", alt: "The same demo reel frame after color grading by Meraki Creative", role: "after", width: 1600, height: 900 },
    ],
    video: null, videoLinks: [], liveUrl: null, featured: false, sort: 150,
  },
];

export const seedTestimonials: Testimonial[] = [
  { id: id(401), pullQuote: "A true asset to any production.", quote: "Merivelle is a true asset to any production. She is assertive, skilled, and highly intuitive in her execution. She delivered our edit on time and with excellence.", roleLabel: "Artistic Director", name: "Liquid Theatre Collective", sort: 10 },
  { id: id(402), pullQuote: "An incredible gift for storytelling through her editing.", quote: "Working with Merivelle was nothing short of amazing; she has an incredible gift for storytelling through her editing. Her creativity, attention to detail, and instinct for storytelling turned my reel into something I was genuinely proud of. For the first time, I watched myself on screen and actually enjoyed what I saw. Not because of me, but because of her ability to bring out the story, emotion, and authenticity in every moment.", roleLabel: "Actor", name: "Nicky Chartraw", sort: 20 },
  { id: id(403), pullQuote: "The reel also helped me land my first feature film.", quote: "Merivelle helped me put together my acting reel, and honestly it came out better than I expected. She was really thoughtful about which moments to use and how to tell a story through the footage. The final reel felt much more professional and much more like me. Since updating it, I’ve been getting more auditions, and it definitely gave me more confidence when submitting myself for projects. The reel also helped me land my first feature film, which was a huge milestone for me as an actor. I’m really happy with the result and grateful for all the work she put into it.", roleLabel: "Actor", name: "Yonatan Shaham Vitos", sort: 30 },
];

export const seedFaqs: Faq[] = [
  // legacy/post-production.html
  { id: id(501), scope: "post-production", question: "Do you work with people outside Los Angeles?", answer: "Yes. The studio is in Los Angeles, but editing happens on files, so where you are is not a limit. Footage comes in over a link and cuts go back the same way.", sort: 10 },
  { id: id(502), scope: "post-production", question: "What do you need from me to start?", answer: "Your footage and a sense of where you are trying to get: a rep, a festival, a casting submission. Notes on favourite takes help, but they are not required.", sort: 20 },
  { id: id(503), scope: "post-production", question: "How long does an edit take?", answer: "It depends on scope, so you get a specific timeline with your quote rather than a guess up front. Most inquiries are answered within a couple of business days.", sort: 30 },
  { id: id(504), scope: "post-production", question: "Can you cut a reel from footage I already have?", answer: "That is most of the work. Scenes come from different shoots with different color and sound, and the job is to balance them so the performance reads as one piece.", sort: 40 },
  { id: id(505), scope: "post-production", question: "Do you handle color and sound too?", answer: "Yes. Color grading, audio balance, and sound design are part of the edit rather than a separate vendor you have to brief again.", sort: 50 },
  // NEW (see docs/COPY_FOR_REVIEW.md)
  { id: id(506), scope: "post-production", question: "How do I send large footage?", answer: "Through a private transfer link from whatever you already use: Frame.io, Google Drive, Dropbox, or WeTransfer. You paste the link into your project page, so nothing has to squeeze through email.", sort: 60 },
  { id: id(507), scope: "post-production", question: "How do notes work?", answer: "Each cut goes up in your project page with a review link. You collect everyone's notes in one place, add timestamps where they help, and send them back as a single set. When a cut is right, you approve that version.", sort: 70 },
  // Web design: general questions (service-specific ones live in src/content/web-design.ts)
  { id: id(511), scope: "web-design", question: "How much will my website cost?", answer: "Each service has a starting price for a defined scope, from $650 for an actor site to $1,500 for a production company site. Your proposal confirms the total, including any optional additions, before anything starts.", sort: 10 },
  { id: id(512), scope: "web-design", question: "How long will it take?", answer: "It depends on the scope, how ready your materials are, and how quickly notes come back. Your proposal includes a timeline for your project.", sort: 20 },
  { id: id(513), scope: "web-design", question: "Do I need a domain or hosting already?", answer: "No. If you have a domain, we connect it; if not, we help you register one in your own name. Domain renewal and hosting or a platform subscription are billed to you by those providers, and your proposal lists what applies.", sort: 30 },
  { id: id(514), scope: "web-design", question: "Can I update it myself?", answer: "That depends on the platform we agree on. Some sites include an editor for the parts you'll change most, like headshots, credits, or projects; others are updated by us as a small paid change. Your proposal says which before you commit.", sort: 40 },
  { id: id(515), scope: "web-design", question: "Who controls the website and accounts?", answer: "You do. Your domain, hosting, and platform accounts are set up in your name, and we work through collaborator access. What's handed over, including any custom work and third-party licenses like fonts, is set out in your proposal.", sort: 50 },
];

const asyncSteps = [
  { tag: "Step 01", title: "Inquiry", body: "Tell us about the work through a short form. We reply in writing with questions or a plan and a quote." },
  { tag: "Step 02", title: "Plan", body: "Once the scope is agreed, you get a project page with a questionnaire and a checklist of what we need from you." },
  { tag: "Step 03", title: "Build", body: "We design and edit, then post each version to your page. You send your notes as one set and approve what's ready. Revisions are part of the process." },
  { tag: "Step 04", title: "Deliver", body: "Final files and handoff notes land on your page, ready to send to reps, casting, and festivals." },
];

export const seedBlocks: ContentBlocks = {
  "home.process": { heading: "Four steps, no guesswork.", steps: asyncSteps },
  "services.process": {
    heading: "How a project runs.",
    intro: "Everything happens in writing, on your own schedule. No calls are needed to book or finish a project, though you can always ask for one.",
    steps: asyncSteps,
  },
  "site.status": { text: "Booking 2026" },
};

export const seedContent: PublicContent = {
  services: seedServices,
  packages: seedPackages,
  portfolio: seedPortfolio,
  testimonials: seedTestimonials,
  faqs: seedFaqs,
  blocks: seedBlocks,
};
