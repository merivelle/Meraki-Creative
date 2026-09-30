/**
 * Design brief style directions. Each has its own miniature-site preview
 * (src/components/onboarding/design/StylePreview.tsx), keyed by id.
 * `notes` are for the studio: what defines the look when designing it.
 */

export type StyleGroup = "Quiet" | "Editorial" | "Bold" | "Textured" | "Playful" | "Technical";

export type StyleDirection = {
  id: string;
  name: string;
  group: StyleGroup;
  blurb: string;
  tags: [string, string, string];
  featured?: boolean;
  notes: string;
  /** Suggested pairing and palette ids (offered with an Apply button, never applied silently). */
  pairings: string[];
  palettes: string[];
};

export const STYLES: StyleDirection[] = [
  {
    id: "minimal", name: "Minimal", group: "Quiet", featured: true,
    blurb: "Lots of space and quiet hierarchy, so nothing competes with the work.",
    tags: ["Whitespace", "Restraint", "Calm"],
    notes: "Generous margins, one type family, small nav, very few colours, content-led sequence.",
    pairings: ["inter", "satoshi", "instrument"], palettes: ["monochrome", "paper-ink"],
  },
  {
    id: "swiss", name: "Swiss / typographic", group: "Quiet", featured: true,
    blurb: "A disciplined grid and big sans-serif type, precise and confident.",
    tags: ["Grid", "Big type", "Precise"],
    notes: "Strict column grid, asymmetric alignment, oversized grotesk, hairline rules, numbered sections.",
    pairings: ["archivo", "inter", "space-grotesk-inter"], palettes: ["paper-ink", "cobalt-chalk", "monochrome"],
  },
  {
    id: "editorial", name: "Editorial / magazine", group: "Editorial", featured: true,
    blurb: "Reads like a beautifully laid-out magazine feature.",
    tags: ["Headlines", "Columns", "Captions"],
    notes: "Masthead, expressive serif headline, deck, bylines, varied column widths, captions, serif/sans contrast.",
    pairings: ["dm-serif-dm-sans", "instrument", "eb-garamond-work"], palettes: ["paper-ink", "scarlet-bone"],
  },
  {
    id: "luxury", name: "Luxury / fashion", group: "Editorial", featured: true,
    blurb: "Refined type, dramatic imagery, and elegant proportions.",
    tags: ["Refined", "Dramatic", "Elegant"],
    notes: "High-contrast serif, wide letterspaced caps, large imagery, hairline details, minimal nav. No gold gradients.",
    pairings: ["bodoni-inter", "cormorant-source", "instrument"], palettes: ["monochrome", "midnight-silver", "paper-ink"],
  },
  {
    id: "gallery", name: "Gallery / museum", group: "Quiet", featured: true,
    blurb: "The work comes first, hung with quiet labels like an exhibition.",
    tags: ["Artwork-first", "Labels", "Index"],
    notes: "Large work images on generous walls of space, small caption labels, numbered project index.",
    pairings: ["inter", "instrument", "plex"], palettes: ["monochrome", "paper-ink", "navy-mist"],
  },
  {
    id: "cinematic", name: "Cinematic / immersive", group: "Editorial", featured: true,
    blurb: "Atmospheric film imagery and a strong title, framed like a scene.",
    tags: ["Atmosphere", "Title card", "Sequence"],
    notes: "Full-bleed frames, letterboxing, title treatments, deliberate pacing from section to section.",
    pairings: ["barlow", "bodoni-inter", "bebas-source"], palettes: ["midnight-silver", "charcoal-acid"],
  },
  {
    id: "brutalist", name: "Brutalist / raw", group: "Bold", featured: true,
    blurb: "Plain, honest, and severe: the structure is the design.",
    tags: ["Utilitarian", "Exposed", "Direct"],
    notes: "System or mono type, plain underlined links, visible borders, no decorative shadows or rounded cards.",
    pairings: ["plex", "space-mono-grotesk", "inter"], palettes: ["monochrome", "paper-ink"],
  },
  {
    id: "neobrutalist", name: "Neobrutalist / graphic", group: "Bold", featured: true,
    blurb: "Thick outlines, solid shadows, and bold blocks of colour.",
    tags: ["Outlines", "Hard shadows", "Colour blocks"],
    notes: "2–3px black borders, offset solid shadows, flat saturated fills, chunky geometric structure.",
    pairings: ["archivo-black-plex", "space-grotesk-inter", "bricolage-inter"], palettes: ["graphic-primaries", "pink-ink", "lavender-citrus"],
  },
  {
    id: "bauhaus", name: "Modernist / Bauhaus", group: "Bold",
    blurb: "Geometry, primary accents, and strong asymmetric composition.",
    tags: ["Geometry", "Primaries", "Asymmetry"],
    notes: "Circles, squares, and bars as structure; red/yellow/blue accents; asymmetric balance.",
    pairings: ["archivo", "space-grotesk-inter", "syne-work"], palettes: ["graphic-primaries", "paper-ink"],
  },
  {
    id: "organic", name: "Organic / earthy", group: "Textured", featured: true,
    blurb: "Warm surfaces, soft shapes, and natural, tactile detail.",
    tags: ["Warm", "Natural", "Tactile"],
    notes: "Rounded or pebble shapes, earth tones, paper grain, gentle serif or rounded sans.",
    pairings: ["fraunces-dm-sans", "eb-garamond-work", "manrope-source"], palettes: ["terracotta-sand", "forest-parchment"],
  },
  {
    id: "romantic", name: "Romantic / delicate", group: "Editorial", featured: true,
    blurb: "Airy spacing, italic accents, and fine lines.",
    tags: ["Airy", "Italic", "Fine lines"],
    notes: "Light serif with italics, thin rules, lots of air, soft (not only pink) colour.",
    pairings: ["cormorant-source", "instrument", "caveat-dm-sans"], palettes: ["aubergine-lilac", "burgundy-blush", "navy-mist"],
  },
  {
    id: "retro", name: "Retro / 1960s–70s", group: "Playful",
    blurb: "Rounded expressive type, warm colour, and period graphics.",
    tags: ["Warm", "Groovy", "Period"],
    notes: "Chunky rounded display type, warm oranges and browns, stripes and arches.",
    pairings: ["fraunces-dm-sans", "bricolage-inter"], palettes: ["espresso-butter", "apricot-teal", "terracotta-sand"],
  },
  {
    id: "y2k", name: "Y2K / early digital", group: "Playful",
    blurb: "Nostalgic digital: chrome, glossy buttons, and pixel details.",
    tags: ["Chrome", "Pixels", "Glossy"],
    notes: "Metallic or glossy accents, pixel type details, window chrome, bubbly highlights.",
    pairings: ["space-mono-grotesk", "syne-work"], palettes: ["lavender-citrus", "midnight-silver"],
  },
  {
    id: "grunge", name: "Grunge / underground", group: "Textured",
    blurb: "Distressed texture, rough edges, and poster-like type.",
    tags: ["Distressed", "Poster", "Raw"],
    notes: "Photocopy texture, torn edges, condensed poster type, tape and stamps.",
    pairings: ["bebas-source", "barlow", "space-mono-grotesk"], palettes: ["charcoal-acid", "paper-ink"],
  },
  {
    id: "collage", name: "Collage / handmade", group: "Textured",
    blurb: "Cut-out shapes, paper layers, and handwritten notes.",
    tags: ["Cut-outs", "Layers", "Annotated"],
    notes: "Irregular placement, paper scraps, tape, handwritten annotations, but a readable reading order.",
    pairings: ["caveat-dm-sans", "fraunces-dm-sans"], palettes: ["terracotta-sand", "espresso-butter"],
  },
  {
    id: "maximalist", name: "Maximalist / expressive", group: "Bold",
    blurb: "Dense and layered, but deliberately composed.",
    tags: ["Layered", "Pattern", "Colour"],
    notes: "Big type over imagery, pattern and colour fields, many elements aligned to a clear underlying grid.",
    pairings: ["syne-work", "bricolage-inter", "archivo-black-plex"], palettes: ["pink-ink", "apricot-teal", "graphic-primaries"],
  },
  {
    id: "playful", name: "Playful / illustrated", group: "Playful",
    blurb: "Friendly type, characterful illustration, and expressive shapes.",
    tags: ["Friendly", "Illustrated", "Shapes"],
    notes: "Rounded friendly type, drawn characters or doodles, bouncy shapes, soft bright colour.",
    pairings: ["bricolage-inter", "fraunces-dm-sans", "caveat-dm-sans"], palettes: ["apricot-teal", "lavender-citrus", "espresso-butter"],
  },
  {
    id: "technical", name: "Technical / industrial", group: "Technical",
    blurb: "Numbered, labelled, and structured like a spec sheet.",
    tags: ["Numbered", "Monospace", "Diagrams"],
    notes: "Mono labels, coordinates and numbering, thin rules, diagram-like detail, utility first.",
    pairings: ["plex", "space-mono-grotesk", "space-grotesk-inter"], palettes: ["charcoal-acid", "monochrome", "navy-mist"],
  },
  {
    id: "product", name: "Contemporary / product-led", group: "Technical",
    blurb: "Clear modular sections and polished interface detail.",
    tags: ["Modular", "Polished", "Clear"],
    notes: "Card sections, rounded corners, clear CTAs, strong functional hierarchy.",
    pairings: ["inter", "satoshi", "manrope-source"], palettes: ["cobalt-chalk", "navy-mist", "monochrome"],
  },
  {
    id: "experimental", name: "Experimental / art-led", group: "Bold",
    blurb: "Unconventional layout and type, with navigation that still makes sense.",
    tags: ["Unexpected", "Artful", "Bold"],
    notes: "Rotated or overlapping type, unusual grids, but a clear, fixed menu and readable body text.",
    pairings: ["syne-work", "space-mono-grotesk", "bodoni-inter"], palettes: ["charcoal-acid", "lavender-citrus", "cobalt-chalk"],
  },
];

export const styleById = (id: string) => STYLES.find((s) => s.id === id);
