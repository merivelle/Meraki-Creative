/**
 * Screen-by-screen layout for the Start a Project onboarding.
 * The questions, options, branching (showIf) and validation all come from
 * `inquiryDefinition()` in ./definition.ts. This file only decides how they're
 * grouped into screens and presented. A step appears when any of its questions
 * is visible for the current answers.
 */

export type Display = "cards" | "chips" | "text" | "textarea" | "email" | "date" | "links";

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
  { id: "web_features", kind: "question", label: "The site", title: "Anything beyond pages?", lead: "Choose any that apply, or skip.", questions: [{ id: "web_features", display: "chips" }], skippable: true },
  // --- Post-production scope ---
  { id: "post_type", kind: "question", label: "The edit", title: "What kind of edit?", lead: "Choose as many as fit.", questions: [{ id: "post_type", display: "chips" }] },
  { id: "post_runtime", kind: "question", label: "The edit", title: "About how long should it run?", questions: [{ id: "post_runtime", display: "chips" }], autoAdvance: true },
  { id: "post_footage_ready", kind: "question", label: "The edit", title: "Is the footage already shot?", questions: [{ id: "post_footage_ready", display: "chips" }], autoAdvance: true },
  // --- Creative materials scope ---
  { id: "materials_type", kind: "question", label: "The materials", title: "A deck, a lookbook, or both?", questions: [{ id: "materials_type", display: "chips" }] },
  { id: "materials_stage", kind: "question", label: "The materials", title: "Where is the project right now?", questions: [{ id: "materials_stage", display: "text" }], skippable: true },
  // --- The story ---
  { id: "goal", kind: "question", label: "The story", title: "What's the goal?", lead: "In a line. Where should this work take you?", questions: [{ id: "goal", display: "text" }] },
  { id: "description", kind: "question", label: "The story", title: "Tell me about the project.", lead: "What it is, who it's for, and anything you already know you want.", questions: [{ id: "description", display: "textarea" }] },
  { id: "links", kind: "question", label: "The story", title: "Anything I should look at?", lead: "Your current site, a reel, the film. One link per line.", questions: [{ id: "links", display: "links" }], skippable: true },
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
  { id: "review", kind: "review", label: "Review", title: "Here's what you told me.", lead: "Check it over, then send.", questions: [] },
];

/**
 * Illustrations that exist in /public/assets/onboarding. Options without an entry show
 * as text-only cards, so the flow works before any artwork arrives.
 * Keys are `${questionId}:${optionValue}`. See docs/ONBOARDING_ILLUSTRATIONS.md.
 */
export const ILLUSTRATIONS: Record<string, string> = {
  // "services:web-design": "/assets/onboarding/service-web.png",
  // "services:post-production": "/assets/onboarding/service-post.png",
  // "services:creative-materials": "/assets/onboarding/service-materials.png",
  // "services:not-sure": "/assets/onboarding/service-unsure.png",
  // "client_type:actor": "/assets/onboarding/who-actor.png",
  // "client_type:director": "/assets/onboarding/who-director.png",
  // "client_type:filmmaker": "/assets/onboarding/who-filmmaker.png",
  // "client_type:photographer": "/assets/onboarding/who-photographer.png",
  // "client_type:production_company": "/assets/onboarding/who-company.png",
  // "client_type:creative_business": "/assets/onboarding/who-business.png",
  // "client_type:other": "/assets/onboarding/who-other.png",
};

/** Optional artwork for the dark welcome screen (shown inverted as cream line art). */
export const WELCOME_ILLUSTRATION: string | null = null; // "/assets/onboarding/welcome-projector.png"

export const STORAGE_KEY = "meraki:start:v1";
