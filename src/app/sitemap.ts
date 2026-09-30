import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/env";
import { getContent } from "@/lib/content/queries";
import { WEB_SERVICES } from "@/content/web-design";
import { POST_SERVICES } from "@/content/post-production";

const STATIC: { path: string; priority: number }[] = [
  { path: "/", priority: 1.0 },
  { path: "/web-design", priority: 0.9 },
  { path: "/post-production", priority: 0.9 },
  { path: "/services", priority: 0.8 },
  { path: "/work", priority: 0.8 },
  { path: "/about", priority: 0.6 },
  { path: "/start", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { portfolio } = await getContent();
  return [
    ...STATIC.map((s) => ({ url: CANONICAL_ORIGIN + s.path, priority: s.priority })),
    ...WEB_SERVICES.map((s) => ({ url: `${CANONICAL_ORIGIN}/web-design/${s.path}`, priority: 0.8 })),
    ...POST_SERVICES.map((s) => ({ url: `${CANONICAL_ORIGIN}/post-production/${s.path}`, priority: 0.8 })),
    ...portfolio.map((p) => ({ url: `${CANONICAL_ORIGIN}/work/${p.slug}`, priority: 0.5 })),
  ];
}
