/**
 * Fictional sample content for the design previews, adapted to the kind of site the visitor
 * said they need (their "And you are…" answer). All names and titles are invented.
 */

export type Sample = {
  brand: string;
  role: string;
  nav: [string, string, string];
  headline: string;
  short: string; // a two-to-four-word headline for tight layouts
  deck: string;
  body: string;
  cta: string;
  items: [string, string, string];
  itemMeta: [string, string, string];
  section: string;
  year: string;
};

const SAMPLES: Record<string, Sample> = {
  actor: {
    brand: "Ada Moreau", role: "Actor · Los Angeles", nav: ["Reel", "Credits", "Contact"],
    headline: "Stillness, then everything at once.", short: "Ada Moreau", deck: "Screen and stage actor. Represented by Harlow Artists.",
    body: "Recent work spans a festival drama, two limited series, and a season at the Mark Taper Forum.",
    cta: "Watch the reel", items: ["The Quiet Year", "Salt Road", "Night Swim"], itemMeta: ["Lead · Feature", "Guest · Series", "Lead · Short"],
    section: "Selected credits", year: "2026",
  },
  director: {
    brand: "Jonah Vale", role: "Director", nav: ["Films", "About", "Contact"],
    headline: "Small rooms, long silences, big feelings.", short: "Jonah Vale", deck: "Writer-director of intimate dramas.",
    body: "Three shorts, a feature in development, and a practice built on long rehearsals and natural light.",
    cta: "Watch the films", items: ["Low Tide", "The Long Table", "Paper Moons"], itemMeta: ["Short · 14 min", "Short · 11 min", "Feature · In development"],
    section: "Selected films", year: "2026",
  },
  filmmaker: {
    brand: "Low Tide", role: "A film by Mara Quinn", nav: ["Trailer", "Story", "Screenings"],
    headline: "Two sisters. One house. The summer it floods.", short: "Low Tide", deck: "A feature drama. World premiere, autumn 2026.",
    body: "When the storm comes early, Nell and Iris have one weekend to decide what to save.",
    cta: "Watch the trailer", items: ["Official Selection", "Audience Award", "Best Cinematography"], itemMeta: ["Coastline Film Festival", "Harbour Shorts", "Nightfall Fest"],
    section: "Festivals", year: "2026",
  },
  production_company: {
    brand: "Harbour & Pine", role: "Pictures", nav: ["Slate", "Company", "Contact"],
    headline: "Stories made with patience.", short: "Harbour & Pine", deck: "An independent production company in Los Angeles.",
    body: "We develop and produce character-driven features and series, from first draft to final mix.",
    cta: "See the slate", items: ["The Glass Orchard", "North of Nowhere", "Wren"], itemMeta: ["Feature · Post-production", "Series · Development", "Short · Released"],
    section: "Current slate", year: "2026",
  },
  business: {
    brand: "Studio Onda", role: "Creative studio", nav: ["Work", "Services", "Contact"],
    headline: "Design and film for people with something to say.", short: "Studio Onda", deck: "A small studio for brands and artists.",
    body: "Identity, campaigns, and short films, made by a team of four with a lot of care.",
    cta: "Start a project", items: ["Field Notes", "Tidewater", "Open House"], itemMeta: ["Identity", "Campaign film", "Exhibition"],
    section: "Selected work", year: "2026",
  },
};

export function sampleFor(clientType: unknown): Sample {
  switch (clientType) {
    case "actor": return SAMPLES.actor;
    case "director": return SAMPLES.director;
    case "filmmaker": return SAMPLES.filmmaker;
    case "production_company": return SAMPLES.production_company;
    default: return SAMPLES.business;
  }
}
