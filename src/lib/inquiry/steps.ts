/**
 * Screen-by-screen layout for the Start a Project onboarding.
 * The questions, options, branching (showIf) and validation all come from
 * `inquiryDefinition()` in ./definition.ts. This file only decides how they're
 * grouped into screens and presented. A step appears when any of its questions
 * is visible for the current answers.
 */

export type Display =
  | "cards" | "chips" | "text" | "textarea" | "email" | "date" | "url" | "links"
  // Design brief: choice cards with a live sample, colour pickers, and an ordered list.
  | "moodCards" | "typeCards" | "paletteCards" | "colors" | "order";

export type Step = {
  id: string;
  kind: "welcome" | "question" | "review";
  /** Small mono label above the question. */
  label?: string;
  title: string;
  /** Welcome only: the line revealed under the greeting. */
  subtitle?: string;
  lead?: string;
  questions: { id: string; display: Display }[];
  /** A single-choice pick moves straight on. */
  autoAdvance?: boolean;
  /** Offers a Skip link (every question on the step must be optional). */
  skippable?: boolean;
};

export const STEPS: Step[] = [
  {
    id: "welcome",
    kind: "welcome",
    title: "Hi there.",
    subtitle: "The story is already there. Let's start with yours.",
    lead: "A few short questions · about three minutes · no account needed",
    questions: [],
  },
  {
    id: "services",
    kind: "question",
    label: "The work",
    title: "What are we making together?",
    lead: "Choose as many as fit.",
    questions: [{ id: "services", display: "cards" }],
  },
  {
    id: "client_type",
    kind: "question",
    label: "About you",
    title: "And you are…",
    questions: [{ id: "client_type", display: "cards" }],
    autoAdvance: true,
  },
  // --- Web design scope ---
  { id: "web_scope", kind: "question", label: "The site", title: "Roughly how big is the site?", questions: [{ id: "web_scope", display: "chips" }], autoAdvance: true },
  { id: "web_existing", kind: "question", label: "The site", title: "Do you have a website now?", questions: [{ id: "web_existing", display: "chips" }], autoAdvance: true },
  { id: "web_domain", kind: "question", label: "The site", title: "Do you already own a domain?", lead: "Your own address, like yourname.com.", questions: [{ id: "web_domain", display: "chips" }], autoAdvance: true },
  { id: "web_content", kind: "question", label: "The site", title: "Are your words, photos, and video ready?", questions: [{ id: "web_content", display: "chips" }], autoAdvance: true },
  { id: "web_updates", kind: "question", label: "The site", title: "Once it's live, who makes changes?", questions: [{ id: "web_updates", display: "chips" }], autoAdvance: true },
  { id: "web_features", kind: "question", label: "The site", title: "Anything beyond pages?", lead: "Choose any that apply, or skip.", questions: [{ id: "web_features", display: "chips" }], skippable: true },
  // --- Post-production scope ---
  { id: "post_type", kind: "question", label: "The edit", title: "What kind of edit?", lead: "Choose as many as fit.", questions: [{ id: "post_type", display: "chips" }] },
  { id: "post_runtime", kind: "question", label: "The edit", title: "About how long should it run?", questions: [{ id: "post_runtime", display: "chips" }], autoAdvance: true },
  { id: "post_footage_ready", kind: "question", label: "The edit", title: "Is the footage already shot?", questions: [{ id: "post_footage_ready", display: "chips" }], autoAdvance: true },
  // --- The story ---
  { id: "goal", kind: "question", label: "The story", title: "What's the goal?", lead: "In a line. Where should this work take you?", questions: [{ id: "goal", display: "text" }] },
  { id: "description", kind: "question", label: "The story", title: "Tell me about the project.", lead: "What it is, who it's for, and anything you already know you want.", questions: [{ id: "description", display: "textarea" }] },
  { id: "links", kind: "question", label: "The story", title: "Anything I should look at?", lead: "Your current site, a reel, the film. Add a note so I know what each one is.", questions: [{ id: "links", display: "links" }], skippable: true },
  // --- Practicalities ---
  {
    id: "timing",
    kind: "question",
    label: "Timing",
    title: "Is there a date you're working toward?",
    questions: [{ id: "deadline", display: "date" }, { id: "deadline_fixed", display: "chips" }],
    skippable: true,
  },
  { id: "budget", kind: "question", label: "Budget", title: "Roughly what budget do you have in mind?", lead: "A range is plenty. Unsure is a fine answer.", questions: [{ id: "budget", display: "chips" }], autoAdvance: true },
  {
    id: "details",
    kind: "question",
    label: "Last thing",
    title: "How do I reach you?",
    questions: [
      { id: "name", display: "text" },
      { id: "email", display: "email" },
      { id: "business_name", display: "text" },
      { id: "notes", display: "textarea" },
    ],
  },
  // --- Optional Web Design deep-dive ---
  {
    id: "brief_gate",
    kind: "question",
    label: "Design brief",
    title: "Want to go deeper?",
    lead: "About five minutes, and every screen can be skipped. It helps me design what you're picturing.",
    questions: [{ id: "brief_gate", display: "chips" }],
    autoAdvance: true,
  },
];

const REVIEW: Step = { id: "review", kind: "review", label: "Review", title: "Here's what you told me.", lead: "Check it over, then send.", questions: [] };

/** The design brief screens, shared by /start (after the opt-in) and /start/design. */
export const BRIEF_STEPS: Step[] = [
  { id: "brief_look", kind: "question", label: "Design brief", title: "Which feels closest?", lead: "Pick the mood, then light or dark.", questions: [{ id: "brief_mood", display: "moodCards" }, { id: "brief_tone", display: "chips" }], skippable: true },
  { id: "brief_words", kind: "question", label: "Design brief", title: "In your words.", questions: [{ id: "brief_words", display: "text" }, { id: "brief_avoid", display: "text" }], skippable: true },
  { id: "brief_color", kind: "question", label: "Design brief", title: "Colours.", lead: "Pick a palette. If you already have brand colours, add them too.", questions: [{ id: "brief_palette", display: "paletteCards" }, { id: "brief_hex", display: "colors" }], skippable: true },
  { id: "brief_type", kind: "question", label: "Design brief", title: "Type & logo.", lead: "Up to two type styles.", questions: [{ id: "brief_type", display: "typeCards" }, { id: "brief_fonts", display: "text" }, { id: "brief_logo", display: "chips" }, { id: "brief_brand_link", display: "url" }], skippable: true },
  { id: "brief_pages", kind: "question", label: "Design brief", title: "Which pages do you need?", lead: "Choose any that apply.", questions: [{ id: "brief_pages", display: "chips" }], skippable: true },
  { id: "brief_order", kind: "question", label: "Design brief", title: "What goes on the homepage?", lead: "Tap the sections you want, then put them in order.", questions: [{ id: "brief_sections", display: "order" }], skippable: true },
  { id: "brief_features", kind: "question", label: "Design brief", title: "Anything the site should do?", questions: [{ id: "brief_features", display: "chips" }, { id: "brief_self_edit", display: "chips" }], skippable: true },
  { id: "brief_languages", kind: "question", label: "Design brief", title: "Which languages?", questions: [{ id: "brief_languages", display: "text" }, { id: "brief_translation", display: "chips" }], skippable: true },
  { id: "brief_refs", kind: "question", label: "Design brief", title: "Sites you love.", lead: "And any you'd steer away from. A note on each helps.", questions: [{ id: "brief_love", display: "links" }, { id: "brief_dislike", display: "links" }], skippable: true },
  { id: "brief_content", kind: "question", label: "Design brief", title: "Words, photos, and video.", questions: [{ id: "brief_bio", display: "chips" }, { id: "brief_photos", display: "chips" }, { id: "brief_video", display: "chips" }, { id: "brief_press", display: "textarea" }], skippable: true },
  { id: "brief_tech", kind: "question", label: "Design brief", title: "Domain & accounts.", questions: [{ id: "brief_domain_name", display: "text" }, { id: "brief_registrar", display: "text" }, { id: "brief_email", display: "chips" }, { id: "brief_current_platform", display: "text" }, { id: "brief_accounts", display: "chips" }], skippable: true },
  { id: "brief_launch", kind: "question", label: "Design brief", title: "Sign-off & timing.", questions: [{ id: "brief_approver", display: "text" }, { id: "brief_launch_notes", display: "textarea" }], skippable: true },
];

export const STEPS_WITH_BRIEF: Step[] = [...STEPS, ...BRIEF_STEPS, REVIEW];

/** /start/design: a short welcome, contact details, the brief, then review. */
export const DESIGN_STEPS: Step[] = [
  {
    id: "welcome",
    kind: "welcome",
    title: "Tell me more.",
    subtitle: "The look, the feel, the pages. Everything you're picturing.",
    lead: "About five minutes · skip anything · it goes straight to Merivelle",
    questions: [],
  },
  { id: "you", kind: "question", label: "About you", title: "Who's this from?", lead: "So I can match it to your inquiry.", questions: [{ id: "name", display: "text" }, { id: "email", display: "email" }] },
  ...BRIEF_STEPS,
  { ...REVIEW, lead: "Check it over, then send it along." },
];

/**
 * Illustrations in /public/assets/onboarding (web versions made by `npm run optimize:art`
 * from the originals in design/onboarding). Options without an entry show
 * as text-only cards, so the flow works before any artwork arrives.
 * Keys are `${questionId}:${optionValue}`. See docs/ONBOARDING_ILLUSTRATIONS.md.
 */
export const ILLUSTRATIONS: Record<string, string> = {
  "services:web-design": "/assets/onboarding/service-web.webp",
  "services:post-production": "/assets/onboarding/service-post.webp",
  "services:not-sure": "/assets/onboarding/service-unsure.webp",
  "client_type:actor": "/assets/onboarding/who-actor.webp",
  "client_type:director": "/assets/onboarding/who-director.webp",
  "client_type:filmmaker": "/assets/onboarding/who-filmmaker.webp",
  "client_type:production_company": "/assets/onboarding/who-company.webp",
  "client_type:creative_business": "/assets/onboarding/who-business.webp",
  "client_type:other": "/assets/onboarding/who-other.webp",
};

/** Artwork for the dark welcome screen. */
export const WELCOME_ILLUSTRATION: string | null = "/assets/onboarding/welcome-projector.webp";

export const STORAGE_KEY = "meraki:start:v1";
export const DESIGN_STORAGE_KEY = "meraki:design:v1";
/** Written when /start is sent: lets the thank-you page offer the brief, and prefills it. */
export const LAST_INQUIRY_KEY = "meraki:start:last";
