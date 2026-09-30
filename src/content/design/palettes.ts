/**
 * Design brief colour palettes. The four given roles are background / main text / secondary
 * surface / accent; the rest are derived so every pairing actually used meets WCAG AA (4.5:1).
 * tests/unit/misc.test.ts checks the contrast of every palette.
 */
import { contrast, mix, pickReadable, softestReadable } from "@/lib/color/contrast";

export type PaletteFilter = "neutral" | "warm" | "cool" | "earthy" | "vivid" | "dark";

type Base = { id: string; name: string; mood: string; filters: PaletteFilter[]; featured?: boolean; bg: string; text: string; surface: string; accent: string };

export type Palette = Base & {
  /** Hairlines and card edges. */
  border: string;
  /** Secondary text on the background. */
  muted: string;
  /** Text on an accent-filled button. */
  buttonText: string;
  /** The accent when used as text on the background (falls back to the main text if too faint). */
  accentText: string;
};

const BASE: Base[] = [
  { id: "paper-ink", name: "Paper & ink", mood: "Quiet, literary, and classic.", filters: ["neutral", "warm"], featured: true, bg: "#F7F5F0", text: "#171717", surface: "#E8E4DC", accent: "#A33224" },
  { id: "monochrome", name: "Pure monochrome", mood: "Crisp black and white; the work supplies the colour.", filters: ["neutral"], featured: true, bg: "#FFFFFF", text: "#111111", surface: "#EEEEEE", accent: "#444444" },
  { id: "cobalt-chalk", name: "Cobalt & chalk", mood: "Clean and confident, with one electric blue.", filters: ["cool", "vivid"], featured: true, bg: "#F5F4EF", text: "#161616", surface: "#E4E7ED", accent: "#2448D8" },
  { id: "scarlet-bone", name: "Scarlet & bone", mood: "Warm off-white with a bold red signature.", filters: ["warm", "vivid"], bg: "#F6F0E7", text: "#24201D", surface: "#E4D8CA", accent: "#A92B35" },
  { id: "forest-parchment", name: "Forest & parchment", mood: "Grounded, green, and calm.", filters: ["earthy", "cool"], featured: true, bg: "#F2EFE5", text: "#1C3028", surface: "#DCE3D7", accent: "#285844" },
  { id: "aubergine-lilac", name: "Aubergine & lilac", mood: "Soft and moody, with depth.", filters: ["cool"], bg: "#F5F0F7", text: "#35213F", surface: "#E4D9ED", accent: "#71418A" },
  { id: "terracotta-sand", name: "Terracotta & sand", mood: "Sun-warmed and tactile.", filters: ["warm", "earthy"], featured: true, bg: "#F5EDE2", text: "#382A23", surface: "#E7D4BE", accent: "#9B432C" },
  { id: "navy-mist", name: "Navy & mist", mood: "Measured and trustworthy, with a coastal calm.", filters: ["cool"], bg: "#F1F5F8", text: "#172A3A", surface: "#DBE5EC", accent: "#285D7D" },
  { id: "espresso-butter", name: "Espresso & butter", mood: "Warm, friendly, a little retro.", filters: ["warm"], bg: "#FFF4CF", text: "#33251F", surface: "#E8D8B9", accent: "#76513B" },
  { id: "burgundy-blush", name: "Burgundy & blush", mood: "Romantic without being sweet.", filters: ["warm"], bg: "#FCF2F1", text: "#4A202B", surface: "#EEDBDD", accent: "#8C304A" },
  { id: "midnight-silver", name: "Midnight & silver", mood: "Dark, cinematic, and cool.", filters: ["dark", "cool"], featured: true, bg: "#10141B", text: "#F0F3F7", surface: "#202733", accent: "#A9BFD5" },
  { id: "charcoal-acid", name: "Charcoal & acid", mood: "Dark with a jolt of electric lime.", filters: ["dark", "vivid"], bg: "#171917", text: "#F5F7ED", surface: "#2A2E27", accent: "#D4F45B" },
  { id: "graphic-primaries", name: "Graphic primaries", mood: "Bold yellow and blue, straight from the poster.", filters: ["vivid"], featured: true, bg: "#F8F3E8", text: "#171717", surface: "#F2CF43", accent: "#2448C6" },
  { id: "pink-ink", name: "Pink & ink", mood: "Loud pink, deep ink, full of character.", filters: ["vivid", "warm"], bg: "#F6B8D2", text: "#211820", surface: "#F9E6EE", accent: "#792C51" },
  { id: "apricot-teal", name: "Apricot & teal", mood: "Fresh and optimistic.", filters: ["warm", "vivid"], featured: true, bg: "#FFF0E5", text: "#153A3A", surface: "#F5C9AA", accent: "#176565" },
  { id: "lavender-citrus", name: "Lavender & citrus", mood: "Playful pastel with a sharp citrus lift.", filters: ["cool", "vivid"], bg: "#F1EDF9", text: "#302344", surface: "#DED3F0", accent: "#E4ED81" },
];

const derive = (p: Base): Palette => ({
  ...p,
  border: mix(p.text, p.bg, 0.82),
  muted: softestReadable(p.text, p.bg, 4.6),
  buttonText: pickReadable(p.accent, [p.bg, p.text, "#FFFFFF", "#111111"]),
  accentText: contrast(p.accent, p.bg) >= 4.5 ? p.accent : p.text,
});

export const PALETTES: Palette[] = BASE.map(derive);
export const paletteById = (id: string) => PALETTES.find((p) => p.id === id);
export const PALETTE_FILTERS: { id: PaletteFilter | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "neutral", label: "Neutral" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "earthy", label: "Earthy" },
  { id: "vivid", label: "Vivid" },
  { id: "dark", label: "Dark" },
];

/** "Paper & ink — #F7F5F0 / #171717 / #E8E4DC / #A33224" for emails and the review. */
export const paletteSummary = (p: Palette) => `${p.name} — ${p.bg} / ${p.text} / ${p.surface} / ${p.accent}`;
