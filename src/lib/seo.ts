import type { Metadata } from "next";
import { CANONICAL_ORIGIN } from "@/lib/env";
import type { Faq } from "@/lib/content/types";

/** Canonical URLs always point at the production host, whatever host serves the page. */
export const abs = (path: string) => CANONICAL_ORIGIN + (path === "/" ? "/" : path);

export function pageMetadata(opts: {
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const url = abs(opts.path);
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: opts.ogType ?? "article",
      siteName: "Meraki Creative",
      locale: "en_US",
      url,
      title: opts.title,
      description: opts.description,
      images: [{ url: abs("/assets/og-default.jpg"), width: 1200, height: 630, alt: "Meraki Creative — a creative studio for storytellers" }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [abs("/assets/og-default.jpg")],
    },
  };
}

const AREA_SERVED = [
  { "@type": "City", name: "Los Angeles" },
  { "@type": "AdministrativeArea", name: "Greater Los Angeles" },
];

export const studioNode = {
  "@type": "ProfessionalService",
  "@id": abs("/#studio"),
  name: "Meraki Creative",
  alternateName: "Meraki Creative by Merivelle",
  url: abs("/"),
  logo: abs("/assets/favicon/icon-512.png"),
  image: abs("/assets/og-default.jpg"),
  description:
    "A Los Angeles creative studio for storytellers: film, trailer, and demo reel editing, and website design for actors and filmmakers.",
  priceRange: "$$",
  address: { "@type": "PostalAddress", addressLocality: "Los Angeles", addressRegion: "CA", addressCountry: "US" },
  areaServed: [...AREA_SERVED, { "@type": "Country", name: "United States" }],
  sameAs: [
    "https://www.instagram.com/merakicreativeofficial/",
    "https://www.imdb.com/name/nm12797336/",
    "https://vimeo.com/merivelle",
    "https://www.merivelle.net/",
  ],
  founder: { "@id": abs("/#merivelle") },
  knowsAbout: [
    "Film editing", "Post-production", "Demo reel editing", "Trailer editing", "Color grading",
    "Website design for actors", "Website design for filmmakers",
  ],
};

export const personNode = {
  "@type": "Person",
  "@id": abs("/#merivelle"),
  name: "Merivelle",
  jobTitle: "Director, Editor and Founder",
  worksFor: { "@id": abs("/#studio") },
  sameAs: ["https://www.imdb.com/name/nm12797336/", "https://vimeo.com/merivelle", "https://www.merivelle.net/"],
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "School of Visual Arts" },
    { "@type": "CollegeOrUniversity", name: "Loyola Marymount University" },
    { "@type": "EducationalOrganization", name: "Lee Strasberg Theatre & Film Institute" },
  ],
};

export function pageNode(type: string, path: string, name: string, description: string) {
  return {
    "@type": type,
    "@id": abs(path) + "#page",
    url: abs(path),
    name,
    description,
    isPartOf: { "@id": abs("/#studio") },
    about: { "@id": abs("/#studio") },
    inLanguage: "en-US",
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": abs(items[items.length - 1].path) + "#crumbs",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function serviceNode(path: string, name: string, serviceType: string, description: string) {
  return {
    "@type": "Service",
    "@id": abs(path) + "#service",
    name,
    serviceType,
    description,
    provider: { "@id": abs("/#studio") },
    url: abs(path),
    areaServed: AREA_SERVED,
  };
}

export function faqNode(path: string, faqs: Faq[]) {
  return {
    "@type": "FAQPage",
    "@id": abs(path) + "#faq",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
