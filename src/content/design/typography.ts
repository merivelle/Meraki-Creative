/**
 * Design brief type pairings: heading font first, body/UI second. Every face here is loaded
 * for real (Google Fonts through next/font, Satoshi from Fontshare), so the specimens show the
 * actual typefaces. Commercial families are listed separately, by name only.
 */

export type TypeFilter = "refined" | "classic" | "modern" | "bold" | "playful" | "technical";

/** Keys resolved to real loaded fonts in src/components/onboarding/design/fonts.ts. */
export type FontKey =
  | "inter" | "satoshi" | "manrope" | "sourceSans3" | "spaceGrotesk" | "archivo" | "bodoniModa"
  | "dmSerifDisplay" | "dmSans" | "instrumentSerif" | "instrumentSans" | "cormorantGaramond"
  | "ebGaramond" | "workSans" | "libreBaskerville" | "fraunces" | "bricolageGrotesque" | "syne"
  | "archivoBlack" | "ibmPlexSans" | "barlowCondensed" | "barlow" | "bebasNeue" | "ibmPlexMono"
  | "spaceMono" | "caveat";

export const FONT_NAMES: Record<FontKey, string> = {
  inter: "Inter", satoshi: "Satoshi", manrope: "Manrope", sourceSans3: "Source Sans 3", spaceGrotesk: "Space Grotesk",
  archivo: "Archivo", bodoniModa: "Bodoni Moda", dmSerifDisplay: "DM Serif Display", dmSans: "DM Sans",
  instrumentSerif: "Instrument Serif", instrumentSans: "Instrument Sans", cormorantGaramond: "Cormorant Garamond",
  ebGaramond: "EB Garamond", workSans: "Work Sans", libreBaskerville: "Libre Baskerville", fraunces: "Fraunces",
  bricolageGrotesque: "Bricolage Grotesque", syne: "Syne", archivoBlack: "Archivo Black", ibmPlexSans: "IBM Plex Sans",
  barlowCondensed: "Barlow Condensed", barlow: "Barlow", bebasNeue: "Bebas Neue", ibmPlexMono: "IBM Plex Mono",
  spaceMono: "Space Mono", caveat: "Caveat",
};

export type Pairing = {
  id: string;
  heading: FontKey;
  body: FontKey;
  description: string;
  filters: TypeFilter[];
  featured?: boolean;
  /** Heading weight used in the specimen. */
  weight: number;
  /** Caveat: a handwritten accent over a neutral body face. */
  accent?: boolean;
  uppercase?: boolean;
};

export const PAIRINGS: Pairing[] = [
  { id: "inter", heading: "inter", body: "inter", description: "Neutral and highly legible. Lets the work do the talking.", filters: ["modern"], weight: 600 },
  { id: "satoshi", heading: "satoshi", body: "satoshi", description: "A friendly geometric sans with a contemporary edge.", filters: ["modern"], featured: true, weight: 700 },
  { id: "manrope-source", heading: "manrope", body: "sourceSans3", description: "Soft, rounded headings over a clear, bookish body.", filters: ["modern"], weight: 700 },
  { id: "space-grotesk-inter", heading: "spaceGrotesk", body: "inter", description: "Quirky, slightly technical headings with a calm body.", filters: ["modern", "technical"], weight: 600 },
  { id: "archivo", heading: "archivo", body: "archivo", description: "Tight, bold grotesk headlines with plenty of weight contrast.", filters: ["modern", "bold"], featured: true, weight: 800 },
  { id: "bodoni-inter", heading: "bodoniModa", body: "inter", description: "High-contrast fashion serif, set against a crisp modern body.", filters: ["refined"], featured: true, weight: 500 },
  { id: "dm-serif-dm-sans", heading: "dmSerifDisplay", body: "dmSans", description: "Warm editorial serif headlines with a tidy sans.", filters: ["classic", "refined"], weight: 400 },
  { id: "instrument", heading: "instrumentSerif", body: "instrumentSans", description: "Slim, elegant serif headings; a crisp sans for everything else.", filters: ["refined", "modern"], featured: true, weight: 400 },
  { id: "cormorant-source", heading: "cormorantGaramond", body: "sourceSans3", description: "Delicate, romantic serif with a practical body.", filters: ["refined", "classic"], weight: 600 },
  { id: "eb-garamond-work", heading: "ebGaramond", body: "workSans", description: "Bookish and literary; timeless, never stiff.", filters: ["classic"], featured: true, weight: 500 },
  { id: "baskerville-source", heading: "libreBaskerville", body: "sourceSans3", description: "Traditional and trustworthy, like a well-printed programme.", filters: ["classic"], weight: 700 },
  { id: "fraunces-dm-sans", heading: "fraunces", body: "dmSans", description: "A soft, characterful serif with a little wobble.", filters: ["playful", "classic"], weight: 600 },
  { id: "bricolage-inter", heading: "bricolageGrotesque", body: "inter", description: "Expressive, slightly quirky headlines with a steady body.", filters: ["playful", "bold"], weight: 700 },
  { id: "syne-work", heading: "syne", body: "workSans", description: "Wide, artful display type for a gallery feel.", filters: ["bold", "playful"], weight: 700 },
  { id: "archivo-black-plex", heading: "archivoBlack", body: "ibmPlexSans", description: "Heavy, poster-like headlines over a technical body.", filters: ["bold"], featured: true, weight: 400 },
  { id: "barlow", heading: "barlowCondensed", body: "barlow", description: "Tall condensed titles, like a credits card.", filters: ["bold", "technical"], weight: 600, uppercase: true },
  { id: "bebas-source", heading: "bebasNeue", body: "sourceSans3", description: "All-caps poster headlines with a readable body.", filters: ["bold"], weight: 400, uppercase: true },
  { id: "plex", heading: "ibmPlexMono", body: "ibmPlexSans", description: "Monospace headings and labels, precise and technical.", filters: ["technical"], featured: true, weight: 500 },
  { id: "space-mono-grotesk", heading: "spaceMono", body: "spaceGrotesk", description: "Typewriter-style headings with a modern body.", filters: ["technical", "playful"], weight: 700 },
  { id: "caveat-dm-sans", heading: "caveat", body: "dmSans", description: "A handwritten accent for names and notes; the body stays neutral.", filters: ["playful"], weight: 600, accent: true },
];

export const pairingById = (id: string) => PAIRINGS.find((p) => p.id === id);
export const pairingLabel = (p: Pairing) => `${FONT_NAMES[p.heading]} / ${FONT_NAMES[p.body]}`;
export const pairingRoles = (p: Pairing) => `${FONT_NAMES[p.heading]} (headings) / ${FONT_NAMES[p.body]} (body)`;

export const TYPE_FILTERS: { id: TypeFilter | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "refined", label: "Refined" },
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
  { id: "bold", label: "Bold" },
  { id: "playful", label: "Playful" },
  { id: "technical", label: "Technical" },
];

/** Commercial families: named for inspiration only; never loaded or substituted. */
export const LICENSED_PAIRINGS = [
  "PP Editorial New / PP Neue Montreal",
  "PP Neue Montreal / PP Neue Montreal",
  "PP Hatton / PP Neue Montreal",
  "Söhne / Söhne",
];
