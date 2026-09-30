import "server-only";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { seedContent } from "@/content/seed";
import { toFaq, toPackage, toPortfolio, toService, toTestimonial } from "./mappers";
import type { CategoryId, ContentBlocks, PortfolioItem, PublicContent } from "./types";

export const CONTENT_TAG = "public-content";

// Creative Materials was retired from the public site (Sep 2026). Rows may still be
// published in Supabase (and past projects reference the category), so hide them here.
const RETIRED: CategoryId[] = ["creative-materials", "bundles"];
const offered = (x: { categoryId: CategoryId }) => !RETIRED.includes(x.categoryId);

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

/** Published snapshot, cached until an admin publishes (revalidateTag(CONTENT_TAG)). */
const loadPublished = unstable_cache(
  async (): Promise<PublicContent> => {
    const supabase = createPublicClient();
    if (!supabase) {
      console.warn("[content] Supabase not configured: rendering seed content from src/content/seed.ts");
      return seedContent;
    }
    const { data, error } = await supabase
      .from("published_content")
      .select("entity_type, slug, sort, data")
      .order("sort", { ascending: true });
    if (error) throw new Error(`Could not load published content: ${error.message}`);

    const out: PublicContent = { services: [], packages: [], portfolio: [], testimonials: [], faqs: [], blocks: {} };
    for (const row of data ?? []) {
      const d = row.data as never;
      switch (row.entity_type) {
        case "service": out.services.push(d); break;
        case "package": out.packages.push(d); break;
        case "portfolio_item": out.portfolio.push(d); break;
        case "testimonial": out.testimonials.push(d); break;
        case "faq": out.faqs.push(d); break;
        case "content_block": {
          const b = d as { key: string; data: unknown };
          (out.blocks as Record<string, unknown>)[b.key] = b.data;
          break;
        }
      }
    }
    return out;
  },
  ["published-content"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

/**
 * Draft preview (staff only — enabling draft mode requires a staff session, see
 * /api/preview). Reads working copies, including unpublished drafts, as the staff user.
 */
async function loadDrafts(): Promise<PublicContent> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (isStaff !== true) return loadPublished();
  const live = (q: string) => supabase.from(q).select("*").neq("status", "archived").order("sort");
  const [services, packages, portfolio, testimonials, faqs, blocks] = await Promise.all([
    live("services"), live("packages"), live("portfolio_items"), live("testimonials"), live("faqs"),
    supabase.from("content_blocks").select("key, data").neq("status", "archived"),
  ]);
  return {
    services: (services.data ?? []).map(toService),
    packages: (packages.data ?? []).map(toPackage),
    portfolio: (portfolio.data ?? []).map(toPortfolio),
    testimonials: (testimonials.data ?? []).map(toTestimonial),
    faqs: (faqs.data ?? []).map(toFaq),
    blocks: Object.fromEntries((blocks.data ?? []).map((b) => [b.key, b.data])),
  };
}

export async function getContent(): Promise<PublicContent> {
  let isDraft = false;
  try {
    isDraft = (await draftMode()).isEnabled;
  } catch {
    // Outside a request (e.g. sitemap generation at build) — published only.
  }
  const c = isDraft ? await loadDrafts() : await loadPublished();
  return {
    ...c,
    services: c.services.filter(offered).sort(bySort),
    packages: c.packages.filter(offered).sort(bySort),
    portfolio: c.portfolio
      .map((p) => ({ ...p, categories: p.categories.filter((cat) => !RETIRED.includes(cat)) }))
      .filter((p) => p.categories.length > 0)
      .sort(bySort),
    testimonials: [...c.testimonials].sort(bySort),
    faqs: c.faqs.filter((f) => !RETIRED.includes(f.scope as CategoryId)).sort(bySort),
  };
}

export async function getBlock<K extends keyof ContentBlocks>(key: K): Promise<ContentBlocks[K]> {
  const c = await getContent();
  return (c.blocks[key] as ContentBlocks[K] | undefined) ?? seedContent.blocks[key]!;
}

export function filterPortfolio(items: PortfolioItem[], category?: CategoryId | null) {
  return category ? items.filter((i) => i.categories.includes(category)) : items;
}
