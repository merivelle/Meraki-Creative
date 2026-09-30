/**
 * The public inquiry: only the preliminary questions needed to assess and quote a
 * project. Detailed discovery happens later in the client portal questionnaires.
 */
import type { FormDefinition, Option } from "@/lib/forms/types";
import type { PackageItem } from "@/lib/content/types";

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
 * name (the original contact.html contract, e.g. "Demo Reel Refresh") or its slug.
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
          { id: "links", type: "url_list", label: "Existing website, reel, or relevant links", help: "One per line. Optional.", maxItems: 10 },
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
    ],
  };
}
