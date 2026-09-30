export const CONTENT_TYPES = {
  portfolio_item: { title: "Portfolio", singular: "work item", titleCol: "title", previewPath: (r: Record<string, string>) => `/work/${r.slug}` },
  package: { title: "Packages", singular: "package", titleCol: "name", previewPath: (r: Record<string, string>) => `/start?package=${r.slug}` },
  service: { title: "Services", singular: "service", titleCol: "title", previewPath: () => "/services" },
  testimonial: { title: "Testimonials", singular: "testimonial", titleCol: "name", previewPath: () => "/" },
  faq: { title: "FAQs", singular: "FAQ", titleCol: "question", previewPath: (r: Record<string, string>) => (r.scope === "general" || r.scope === "process" ? "/services" : `/${r.scope}`) },
  content_block: { title: "Page copy", singular: "block", titleCol: "key", previewPath: () => "/" },
} as const;
export type ContentTypeKey = keyof typeof CONTENT_TYPES;
