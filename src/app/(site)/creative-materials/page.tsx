import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { ServicePage, type ServicePageConfig } from "@/components/site/ServicePage";

// NEW page: copy drawn from the original services.html#materials section and packages.
const cfg: ServicePageConfig = {
  category: "creative-materials",
  path: "/creative-materials",
  title: "Pitch Deck & Lookbook Design in Los Angeles | Meraki Creative",
  description:
    "Pitch deck and lookbook design for films in development, from a Los Angeles studio that also edits and builds for storytellers.",
  crumb: "Creative Materials",
  schema: { name: "Pitch Deck and Lookbook Design", serviceType: "Pitch deck design" },
  hero: {
    meta: ["Creative Materials", "Pitch Decks · Lookbooks"],
    title: <>We design what<br />speaks for it.</>,
    lede: "Pitch deck and lookbook design for films in development. The documents that carry your project: designed with the same eye as the film, so the vision reads on the page the way it does on screen.",
  },
  services: {
    slate: "Creative Materials",
    heading: "What we design.",
    lede: "Decks and lookbooks built from your script, your references, and what you want the reader to feel first.",
  },
  work: { slate: "Selected Work", heading: "On the page.", grid: "work-grid-2", onlyFeatured: false },
  pricingLede: <>Every package bends to fit the work. Full pricing sits on the <Link href="/packages" className="txt-link">packages page</Link>.</>,
  cta: {
    heading: "Start with the story.",
    lede: "Tell us about the project and who will read it first. You'll get a clear plan, a timeline, and a quote.",
  },
};

export const metadata = pageMetadata({ path: cfg.path, title: cfg.title, description: cfg.description });

export default function CreativeMaterialsPage() {
  return <ServicePage cfg={cfg} />;
}
