import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { ServicePage, type ServicePageConfig } from "@/components/site/ServicePage";

const cfg: ServicePageConfig = {
  category: "post-production",
  path: "/post-production",
  title: "Post-Production & Video Editing in Los Angeles | Meraki Creative",
  description:
    "Film, trailer, scene, and demo reel editing in Los Angeles. Color, sound, and pacing handled in one place by a working director and lifelong editor.",
  crumb: "Post-Production",
  schema: { name: "Post-Production and Video Editing", serviceType: "Video editing and post-production" },
  hero: {
    meta: ["Post-Production", "Los Angeles · Film · Trailer · Reel · Color"],
    title: <>Post-production,<br />end to end.</>,
    lede: "Film, trailer, scene, and demo reel editing out of Los Angeles. Color, sound, and pacing handled in one place, by a director who has been cutting since she was eight years old.",
  },
  services: {
    slate: "Post-Production",
    heading: "What we cut.",
    lede: "Editing led by a working director and lifelong editor. Films, trailers, scenes, and reels, with color and sound balanced across the whole piece rather than handed off to three different people.",
  },
  work: {
    slate: "Selected Work",
    heading: "Cuts, in full.",
    grid: "work-grid-2",
    onlyFeatured: true,
    lede: <>More reels, scenes, trailers, and color grades in <Link href="/work?service=post-production" className="txt-link">the work</Link>.</>,
  },
  pricingLede: <>Every package bends to fit the work. Full pricing sits on the <Link href="/packages" className="txt-link">packages page</Link>.</>,
  cta: {
    heading: "Send us the footage.",
    lede: "Tell us what the piece is for and where it needs to go. You'll get a clear plan, a timeline, and a quote.",
  },
};

export const metadata = pageMetadata({ path: cfg.path, title: cfg.title, description: cfg.description });

export default function PostProductionPage() {
  return <ServicePage cfg={cfg} />;
}
