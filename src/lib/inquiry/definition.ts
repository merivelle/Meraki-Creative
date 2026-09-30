/**
 * The public inquiry: the questions needed to assess and quote a project, plus an optional
 * Web Design deep-dive ("design brief") for web clients who want to go further.
 */
import type { Condition, FormDefinition, Option, Section } from "@/lib/forms/types";
import type { PackageItem } from "@/lib/content/types";
import { STYLES } from "@/content/design/styles";
import { PAIRINGS, pairingLabel } from "@/content/design/typography";
import { PALETTES } from "@/content/design/palettes";
import { LAYOUT_OPTIONS, MOTION_OPTIONS, TONE_OPTIONS, TREATMENT_OPTIONS } from "@/content/design/options";

export const SERVICE_OPTIONS: Option[] = [
  { value: "web-design", label: "Web design" },
  { value: "post-production", label: "Post-production and editing" },
  { value: "not-sure", label: "Not sure yet, help me decide" },
];

export const CLIENT_TYPE_OPTIONS: Option[] = [
  { value: "actor", label: "Actor" },
  { value: "director", label: "Director" },
  { value: "filmmaker", label: "Filmmaker / producer" },
  { value: "production_company", label: "Production company" },
  { value: "creative_business", label: "Other creative business" },
  { value: "other", label: "Something else" },
];

export const BUDGET_OPTIONS: Option[] = [
  { value: "under-500", label: "Under $500" },
  { value: "500-1000", label: "$500 to $1,000" },
  { value: "1000-2500", label: "$1,000 to $2,500" },
  { value: "2500-5000", label: "$2,500 to $5,000" },
  { value: "5000-plus", label: "$5,000 or more" },
  { value: "unsure", label: "Unsure" },
];

type Pkg = Pick<PackageItem, "slug" | "name" | "categoryId">;

/**
 * Resolve ?service= / ?package= into initial answers. ?package= accepts the package
 * name (the original contact.html contract, e.g. "Demo Reel Edit") or its slug.
 */
export function preselect(packages: Pkg[], params: { service?: string; package?: string; interest?: string }) {
  const answers: Record<string, string | string[]> = {};
  const wanted = (params.package ?? params.interest ?? "").trim().toLowerCase();
  const pkg = wanted ? packages.find((p) => p.slug === wanted || p.name.toLowerCase() === wanted) : undefined;
  const services = new Set<string>();
  if (pkg) {
    answers.package = pkg.slug;
    // Only services the form offers (deck/lookbook packages keep the package, no service).
    if (SERVICE_OPTIONS.some((o) => o.value === pkg.categoryId)) services.add(pkg.categoryId);
  }
  if (params.service && SERVICE_OPTIONS.some((o) => o.value === params.service)) services.add(params.service);
  if (services.size) answers.services = [...services];
  return answers;
}

export function inquiryDefinition(packages: Pkg[]): FormDefinition {
  const packageOptions: Option[] = [
    ...packages.map((p) => ({ value: p.slug, label: p.name })),
    { value: "single-service", label: "A single service" },
  ];
  return {
    key: "inquiry",
    version: 1,
    title: "Start a project",
    sections: [
      {
        id: "you",
        title: "About you",
        questions: [
          { id: "name", type: "text", label: "Name", required: true, maxLength: 200 },
          { id: "email", type: "email", label: "Email", required: true, maxLength: 320 },
          { id: "business_name", type: "text", label: "Business or professional name", help: "If you work under a company or professional name.", maxLength: 200 },
          { id: "client_type", type: "select", label: "I am a…", required: true, options: CLIENT_TYPE_OPTIONS },
        ],
      },
      {
        id: "project",
        title: "The project",
        questions: [
          { id: "services", type: "multiselect", label: "What do you need?", required: true, options: SERVICE_OPTIONS, help: "Choose any that apply." },
          { id: "package", type: "select", label: "Package of interest", options: packageOptions, help: "Optional. It's fine to leave this blank." },
          { id: "goal", type: "text", label: "What's the goal?", required: true, maxLength: 300, placeholder: "e.g. a reel to send to reps, a site for festival season" },
          { id: "description", type: "textarea", label: "Tell me about the project", required: true, maxLength: 4000 },
          { id: "links", type: "reference_list", label: "Links to look at", noteLabel: "What is it, or what do you like about it?", maxItems: 10 },
        ],
      },
      {
        id: "scope_web",
        title: "Website scope",
        showIf: { key: "services", op: "includes", value: "web-design" },
        questions: [
          {
            id: "web_scope", type: "radio", label: "Roughly how big is the site?", required: true, allowUnknown: true,
            options: [
              { value: "single", label: "A single page" },
              { value: "small", label: "A few pages (2 to 5)" },
              { value: "larger", label: "A larger site (6 or more pages)" },
            ],
          },
          { id: "web_existing", type: "yes_no_unsure", label: "Do you have a website now?" },
          { id: "web_domain", type: "yes_no_unsure", label: "Do you already own a domain?", required: true },
          {
            id: "web_content", type: "radio", label: "Are your words, photos, and video ready?", required: true,
            options: [
              { value: "ready", label: "Ready" },
              { value: "some", label: "Some of it" },
              { value: "not-yet", label: "Not yet" },
            ],
          },
          {
            id: "web_updates", type: "radio", label: "Once it's live, who makes changes?", required: true,
            options: [
              { value: "self", label: "I'd like to make small edits myself" },
              { value: "studio", label: "The studio makes updates for me" },
              { value: "unsure", label: "Not sure yet" },
            ],
          },
          {
            id: "web_features", type: "multiselect", label: "Anything beyond pages?",
            options: [
              { value: "gallery", label: "Photo or video galleries" },
              { value: "blog", label: "News or blog" },
              { value: "shop", label: "Shop or print sales" },
              { value: "booking", label: "Booking or scheduling" },
              { value: "languages", label: "More than one language" },
            ],
          },
        ],
      },
      {
        id: "scope_post",
        title: "Editing scope",
        showIf: { key: "services", op: "includes", value: "post-production" },
        questions: [
          {
            id: "post_type", type: "multiselect", label: "What kind of edit?", required: true,
            options: [
              { value: "demo-reel", label: "Demo reel" },
              { value: "scene", label: "Scene edit" },
              { value: "trailer", label: "Trailer" },
              { value: "teaser", label: "Teaser" },
              { value: "short-film", label: "Short film" },
              { value: "social", label: "Social edits" },
              { value: "other", label: "Something else" },
            ],
          },
          {
            id: "post_runtime", type: "radio", label: "Rough final length", allowUnknown: true,
            options: [
              { value: "under-1", label: "Under a minute" },
              { value: "1-3", label: "1 to 3 minutes" },
              { value: "3-15", label: "3 to 15 minutes" },
              { value: "15-plus", label: "Longer than 15 minutes" },
            ],
          },
          { id: "post_footage_ready", type: "yes_no_unsure", label: "Is the footage already shot?" },
        ],
      },
      {
        id: "timing",
        title: "Timing and budget",
        questions: [
          { id: "deadline", type: "date", label: "Is there a date you're working toward?", help: "Optional." },
          {
            id: "deadline_fixed", type: "radio", label: "Is that date fixed?",
            showIf: { key: "deadline", op: "answered" },
            options: [
              { value: "fixed", label: "Fixed (a submission or release date)" },
              { value: "flexible", label: "Flexible" },
              { value: "unsure", label: "Not sure" },
            ],
          },
          { id: "budget", type: "select", label: "Budget range", required: true, options: BUDGET_OPTIONS },
          { id: "notes", type: "textarea", label: "Anything else I should know?", maxLength: 2000 },
        ],
      },
      {
        id: "brief_start",
        title: "Design brief",
        showIf: { key: "services", op: "includes", value: "web-design" },
        questions: [
          {
            id: "brief_gate", type: "radio", label: "Want to go deeper?", required: true,
            options: [
              { value: "yes", label: "Yes, let's go" },
              { value: "no", label: "Skip for now" },
            ],
          },
        ],
      },
      ...briefSections("inline"),
    ],
  };
}

/* ------------------------------------------------------------------------------------------
 * The optional Web Design deep-dive ("design brief"). Every question in it is optional.
 * "inline":     inside /start, only for web clients who opt in; a few questions follow
 *               earlier answers (domain, current site, who updates it).
 * "standalone": /start/design, offered on the thank-you page to anyone who skipped it.
 * ---------------------------------------------------------------------------------------- */

export const HELP = "help";
export const STYLE_OPTIONS: Option[] = STYLES.map((s) => ({ value: s.id, label: s.name }));
export const PAIRING_OPTIONS: Option[] = PAIRINGS.map((p) => ({ value: p.id, label: pairingLabel(p) }));
export const PALETTE_OPTIONS: Option[] = PALETTES.map((p) => ({ value: p.id, label: p.name }));

export const SECTION_OPTIONS: Option[] = [
  { value: "hero", label: "Showreel or opening image" },
  { value: "about", label: "About / bio" },
  { value: "work", label: "Selected work" },
  { value: "current", label: "Current project" },
  { value: "credits", label: "Credits" },
  { value: "press", label: "Press & awards" },
  { value: "testimonials", label: "Testimonials" },
  { value: "services", label: "Services" },
  { value: "instagram", label: "Instagram" },
  { value: "newsletter", label: "Newsletter signup" },
  { value: "contact", label: "Contact" },
];

const READY: Option[] = [
  { value: "ready", label: "Ready" },
  { value: "some", label: "Some of it" },
  { value: "not-yet", label: "Not yet" },
];

export function briefSections(mode: "inline" | "standalone"): Section[] {
  const opted: Condition | undefined = mode === "inline"
    ? { all: [{ key: "services", op: "includes", value: "web-design" }, { key: "brief_gate", op: "equals", value: "yes" }] }
    : undefined;
  const when = (c: Condition): Condition | undefined => (mode === "inline" ? c : undefined);
  return [
    {
      id: "brief_direction", title: "Direction", showIf: opted,
      questions: [
        {
          id: "brief_styles", type: "multiselect", label: "Design directions you like", maxItems: 2,
          options: [...STYLE_OPTIONS, { value: HELP, label: "Help me decide" }],
        },
        { id: "brief_styles_avoid", type: "multiselect", label: "Directions to avoid", options: STYLE_OPTIONS },
      ],
    },
    {
      id: "brief_brand", title: "Your brand", showIf: opted,
      questions: [
        { id: "brief_words", type: "text", label: "Three words for how it should feel", maxLength: 200, placeholder: "e.g. quiet, warm, cinematic" },
        { id: "brief_avoid", type: "text", label: "Anything it should never feel like?", maxLength: 300 },
        { id: "brief_logo", type: "yes_no_unsure", label: "Do you have a logo?" },
        {
          id: "brief_brand_link", type: "url", label: "Link to your logo or brand guide (Drive, Dropbox…)",
          showIf: { key: "brief_logo", op: "equals", value: "yes" },
        },
      ],
    },
    {
      id: "brief_typography", title: "Typography", showIf: opted,
      questions: [
        {
          id: "brief_type_pair", type: "radio", label: "Preferred type pairing",
          options: [...PAIRING_OPTIONS, { value: HELP, label: "Help me choose" }],
        },
        { id: "brief_type_alt", type: "multiselect", label: "Also worth considering", options: PAIRING_OPTIONS, maxItems: 2 },
        { id: "brief_fonts", type: "text", label: "Font names you love", maxLength: 200 },
      ],
    },
    {
      id: "brief_colour", title: "Colour", showIf: opted,
      questions: [
        {
          id: "brief_palette", type: "radio", label: "Preferred palette",
          options: [...PALETTE_OPTIONS, { value: "brand", label: "Use my existing brand colours" }, { value: "studio", label: "Let Meraki choose" }],
        },
        { id: "brief_palette_alt", type: "radio", label: "An alternative", options: PALETTE_OPTIONS },
        {
          id: "brief_hex", type: "text", label: "Your brand colours", maxLength: 120,
          showIf: { key: "brief_palette", op: "equals", value: "brand" },
        },
        { id: "brief_colors_avoid", type: "text", label: "Colours to avoid", maxLength: 200, placeholder: "e.g. no bright pink" },
      ],
    },
    {
      id: "brief_layout", title: "Layout", showIf: opted,
      questions: [{ id: "brief_layout", type: "multiselect", label: "Layouts you'd like", options: LAYOUT_OPTIONS }],
    },
    {
      id: "brief_finish", title: "Light, motion & texture", showIf: opted,
      questions: [
        { id: "brief_tone", type: "radio", label: "Light or dark?", options: TONE_OPTIONS },
        { id: "brief_motion", type: "radio", label: "How much movement?", options: MOTION_OPTIONS },
        { id: "brief_treatments", type: "multiselect", label: "Surface details", options: TREATMENT_OPTIONS },
      ],
    },
    {
      id: "brief_structure", title: "Pages", showIf: opted,
      questions: [
        {
          id: "brief_pages", type: "multiselect", label: "Which pages do you need?",
          options: [
            { value: "home", label: "Home" },
            { value: "about", label: "About" },
            { value: "work", label: "Work / portfolio" },
            { value: "reel", label: "Reel" },
            { value: "credits", label: "Credits / résumé" },
            { value: "films", label: "Films" },
            { value: "press", label: "Press" },
            { value: "services", label: "Services" },
            { value: "news", label: "News / blog" },
            { value: "shop", label: "Shop" },
            { value: "contact", label: "Contact" },
          ],
        },
      ],
    },
    {
      id: "brief_order", title: "Homepage order", showIf: opted,
      questions: [{ id: "brief_sections", type: "multiselect", label: "Homepage sections, in order", options: SECTION_OPTIONS }],
    },
    {
      id: "brief_features_section", title: "Features", showIf: opted,
      questions: [
        {
          id: "brief_features", type: "multiselect", label: "Anything the site should do?",
          options: [
            { value: "form", label: "Contact form" },
            { value: "booking", label: "Booking" },
            { value: "newsletter", label: "Newsletter signup" },
            { value: "blog", label: "News or blog" },
            { value: "shop", label: "Shop" },
            { value: "private", label: "Private or password area" },
            { value: "instagram", label: "Instagram feed" },
          ],
        },
        {
          id: "brief_self_edit", type: "multiselect", label: "What would you like to update yourself?",
          showIf: when({ key: "web_updates", op: "equals", value: "self" }),
          options: [
            { value: "news", label: "News" },
            { value: "work", label: "Work & media" },
            { value: "bio", label: "Bio" },
            { value: "press", label: "Press" },
          ],
        },
      ],
    },
    {
      id: "brief_language", title: "Languages", showIf: opted,
      questions: [
        { id: "brief_languages", type: "text", label: "Which languages?", maxLength: 200, placeholder: "English only is fine" },
        {
          id: "brief_translation", type: "radio", label: "Who provides the translations?",
          showIf: { key: "brief_languages", op: "answered" },
          options: [
            { value: "client", label: "I'll supply them" },
            { value: "help", label: "I need help" },
            { value: "unsure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      id: "brief_refs", title: "Sites you love", showIf: opted,
      questions: [
        { id: "brief_love", type: "reference_list", label: "Sites you love", noteLabel: "What do you like about it?", maxItems: 6 },
        { id: "brief_dislike", type: "reference_list", label: "Sites to steer away from", noteLabel: "What would you avoid?", maxItems: 4 },
      ],
    },
    {
      id: "brief_content", title: "Content & media", showIf: opted,
      questions: [
        {
          id: "brief_bio", type: "radio", label: "Your bio",
          options: [{ value: "written", label: "Written" }, { value: "edit", label: "Needs editing" }, { value: "write", label: "Needs writing" }],
        },
        { id: "brief_photos", type: "radio", label: "Photos", options: READY },
        { id: "brief_video", type: "radio", label: "Video", options: [...READY, { value: "none", label: "No video" }] },
        { id: "brief_press", type: "textarea", label: "Credits, press, or awards to include", maxLength: 2000 },
      ],
    },
    {
      id: "brief_tech", title: "Tech & ownership", showIf: opted,
      questions: [
        {
          id: "brief_domain_name", type: "text", label: mode === "inline" ? "What's the domain?" : "Your domain, if you have one",
          maxLength: 200, placeholder: "yourname.com", showIf: when({ key: "web_domain", op: "equals", value: "yes" }),
        },
        {
          id: "brief_registrar", type: "text", label: "Where is it registered?", maxLength: 200, placeholder: "e.g. GoDaddy, Squarespace, Namecheap",
          showIf: when({ key: "web_domain", op: "equals", value: "yes" }),
        },
        { id: "brief_email", type: "yes_no_unsure", label: "Want an email address at your domain?" },
        {
          id: "brief_current_platform", type: "text", label: "What's your current site built on?", maxLength: 200, placeholder: "e.g. Wix, Squarespace",
          showIf: when({ key: "web_existing", op: "equals", value: "yes" }),
        },
        {
          id: "brief_accounts", type: "radio", label: "Accounts (domain, hosting)",
          options: [
            { value: "client", label: "In my name" },
            { value: "studio", label: "The studio manages them" },
            { value: "unsure", label: "Not sure" },
          ],
        },
      ],
    },
    {
      id: "brief_launch", title: "Decision & go-live", showIf: opted,
      questions: [
        { id: "brief_approver", type: "text", label: "Who approves the design?", maxLength: 200, placeholder: "e.g. just me, me and my manager" },
        { id: "brief_launch_notes", type: "textarea", label: "Anything the go-live date depends on?", maxLength: 1000 },
      ],
    },
  ];
}

/** The deep-dive on its own (/start/design), for people who skipped it in /start. */
export function briefDefinition(): FormDefinition {
  return {
    key: "design-brief",
    version: 1,
    title: "Design brief",
    sections: [
      {
        id: "you",
        title: "About you",
        questions: [
          { id: "name", type: "text", label: "Name", required: true, maxLength: 200 },
          { id: "email", type: "email", label: "Email", required: true, maxLength: 320 },
        ],
      },
      ...briefSections("standalone"),
    ],
  };
}
