/** Shapes of published public content (the `data` column of published_content). */

export type CategoryId = "web-design" | "post-production" | "creative-materials" | "bundles";

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  "web-design": "Web Design",
  "post-production": "Post-Production",
  "creative-materials": "Creative Materials",
  bundles: "Bundles",
};

export type ServiceItem = {
  id: string;
  categoryId: CategoryId;
  roleLabel: string;
  title: string;
  description: string;
  /** Short line used on the homepage pillars. Null = not listed on the homepage. */
  summary: string | null;
  sort: number;
};

export type PackageItem = {
  id: string;
  slug: string; // original anchor id on packages.html
  categoryId: CategoryId;
  groupTitle: string; // e.g. "Demo Reels"
  label: string; // e.g. "Post / Most booked"
  name: string;
  priceDisplay: string; // verbatim — never computed
  included: string[];
  tagline: string;
  featured: boolean;
  sort: number;
};

export type PortfolioLayout = "site" | "reel" | "film" | "scene" | "trailer" | "grade";

export type PortfolioItem = {
  id: string;
  slug: string;
  title: string;
  clientName: string | null;
  categories: CategoryId[];
  layout: PortfolioLayout;
  typeLabel: string | null;
  description: string | null;
  contribution: string | null;
  images: { src: string; alt: string; role?: "cover" | "before" | "after" | "poster"; width?: number; height?: number }[];
  video: { kind: "file" | "youtube" | "vimeo"; src: string; poster?: string; title?: string } | null;
  videoLinks: { label: string; url: string }[];
  liveUrl: string | null;
  /** Text shown in the fake browser bar on website cards. */
  urlLabel?: string | null;
  featured: boolean;
  sort: number;
};

export type Testimonial = { id: string; quote: string; roleLabel: string; name: string; sort: number };

export type FaqScope = "web-design" | "post-production" | "creative-materials" | "general" | "process";
export type Faq = { id: string; scope: FaqScope; question: string; answer: string; sort: number };

export type ProcessStep = { tag: string; title: string; body: string };

export type ContentBlocks = {
  "home.process": { heading: string; steps: ProcessStep[] };
  "services.process": { heading: string; intro: string; steps: ProcessStep[] };
  "site.status": { text: string };
};

export type PublicContent = {
  services: ServiceItem[];
  packages: PackageItem[];
  portfolio: PortfolioItem[];
  testimonials: Testimonial[];
  faqs: Faq[];
  blocks: Partial<ContentBlocks>;
};
