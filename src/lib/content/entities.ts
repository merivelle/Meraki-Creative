/** CMS entity registry: table + mapper for each publishable content type. */
import { toFaq, toPackage, toPortfolio, toService, toTestimonial } from "./mappers";

export const ENTITIES = {
  service: { table: "services", map: toService, slugCol: null },
  package: { table: "packages", map: toPackage, slugCol: "slug" },
  portfolio_item: { table: "portfolio_items", map: toPortfolio, slugCol: "slug" },
  testimonial: { table: "testimonials", map: toTestimonial, slugCol: null },
  faq: { table: "faqs", map: toFaq, slugCol: null },
  content_block: { table: "content_blocks", map: (r: Record<string, unknown>) => ({ key: `${r.page}.${r.key}`, data: r.data }), slugCol: null },
} as const;

export type EntityType = keyof typeof ENTITIES;
export const isEntityType = (t: string): t is EntityType => t in ENTITIES;
