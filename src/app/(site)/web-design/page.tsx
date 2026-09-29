import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { ServicePage, type ServicePageConfig } from "@/components/site/ServicePage";

const cfg: ServicePageConfig = {
  category: "web-design",
  path: "/web-design",
  title: "Website Design for Actors & Filmmakers | Los Angeles",
  description:
    "Website design for actors, directors, and production companies in Los Angeles. Clean, fast sites built around your work, not around a template.",
  crumb: "Web Design",
  schema: { name: "Website Design for Actors and Filmmakers", serviceType: "Website design" },
  hero: {
    meta: ["Web Design", "Los Angeles · Actors · Directors · Companies"],
    title: <>Website design<br />for storytellers.</>,
    lede: "Websites for actors, directors, filmmakers, production companies, and other creative businesses, designed and built out of Los Angeles. Fast, mobile-ready, and shaped around the work rather than around a template.",
  },
  services: {
    slate: "Digital Presence",
    heading: "What we build.",
    lede: "Clean, cinematic websites that read as seriously as the work you put into them. Built to send to reps, casting, financiers, and festivals, and fast enough that nobody waits to see your reel.",
  },
  work: {
    slate: "Recent Sites",
    heading: "Built and live.",
    grid: "work-grid-3",
    onlyFeatured: false,
  },
  pricingLede: <>Websites are quoted per project, because a one-page actor site and a company slate are not the same build. Full pricing sits on the <Link href="/packages" className="txt-link">packages page</Link>.</>,
  cta: {
    heading: "Let's build your home.",
    lede: "Tell us who the site is for and what it has to carry. You'll get a clear plan, a timeline, and a quote.",
  },
};

export const metadata = pageMetadata({ path: cfg.path, title: cfg.title, description: cfg.description });

export default function WebDesignPage() {
  return <ServicePage cfg={cfg} />;
}
