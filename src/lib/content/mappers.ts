/** Map between CMS table rows (snake_case) and published content shapes (camelCase). */
import type { Faq, PackageItem, PortfolioItem, ServiceItem, Testimonial } from "./types";

type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const n = (v: unknown) => (typeof v === "number" ? v : 0);

export const toService = (r: Row): ServiceItem => ({
  id: s(r.id), categoryId: s(r.category_id) as ServiceItem["categoryId"], roleLabel: s(r.role_label),
  title: s(r.title), description: s(r.description), summary: (r.summary as string) ?? null, sort: n(r.sort),
});

export const toPackage = (r: Row): PackageItem => ({
  id: s(r.id), slug: s(r.slug), categoryId: s(r.category_id) as PackageItem["categoryId"],
  groupTitle: s(r.group_title), label: s(r.label), name: s(r.name), priceDisplay: s(r.price_display),
  included: (r.included as string[]) ?? [], tagline: s(r.tagline), featured: Boolean(r.featured), sort: n(r.sort),
});

export const toPortfolio = (r: Row): PortfolioItem => ({
  id: s(r.id), slug: s(r.slug), title: s(r.title), clientName: (r.client_name as string) ?? null,
  categories: (r.categories as PortfolioItem["categories"]) ?? [], layout: s(r.layout) as PortfolioItem["layout"],
  typeLabel: (r.type_label as string) ?? null, description: (r.description as string) ?? null,
  contribution: (r.contribution as string) ?? null, images: (r.images as PortfolioItem["images"]) ?? [],
  video: (r.video as PortfolioItem["video"]) ?? null, videoLinks: (r.video_links as PortfolioItem["videoLinks"]) ?? [],
  liveUrl: (r.live_url as string) ?? null, urlLabel: (r.url_label as string) ?? null,
  featured: Boolean(r.featured), sort: n(r.sort),
});

export const toTestimonial = (r: Row): Testimonial => ({
  id: s(r.id), quote: s(r.quote), roleLabel: s(r.role_label), name: s(r.name), sort: n(r.sort),
});

export const toFaq = (r: Row): Faq => ({
  id: s(r.id), scope: s(r.scope) as Faq["scope"], question: s(r.question), answer: s(r.answer), sort: n(r.sort),
});

// Reverse direction, used by the seed script and admin editors.
export const fromService = (x: ServiceItem) => ({
  id: x.id, category_id: x.categoryId, role_label: x.roleLabel, title: x.title, description: x.description, summary: x.summary, sort: x.sort,
});
export const fromPackage = (x: PackageItem) => ({
  id: x.id, slug: x.slug, category_id: x.categoryId, group_title: x.groupTitle, label: x.label, name: x.name,
  price_display: x.priceDisplay, included: x.included, tagline: x.tagline, featured: x.featured, sort: x.sort,
});
export const fromPortfolio = (x: PortfolioItem) => ({
  id: x.id, slug: x.slug, title: x.title, client_name: x.clientName, categories: x.categories, layout: x.layout,
  type_label: x.typeLabel, description: x.description, contribution: x.contribution, images: x.images,
  video: x.video, video_links: x.videoLinks, live_url: x.liveUrl, url_label: x.urlLabel ?? null,
  featured: x.featured, sort: x.sort,
});
export const fromTestimonial = (x: Testimonial) => ({ id: x.id, quote: x.quote, role_label: x.roleLabel, name: x.name, sort: x.sort });
export const fromFaq = (x: Faq) => ({ id: x.id, scope: x.scope, question: x.question, answer: x.answer, sort: x.sort });
