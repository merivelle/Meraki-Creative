/** Design brief: layout, motion, and surface-treatment choices (all optional). */
import type { Option } from "@/lib/forms/types";

export const LAYOUT_OPTIONS: Option[] = [
  { value: "hero", label: "Large image or video hero", hint: "The first thing people see is a big image or your reel." },
  { value: "split", label: "Split-screen introduction", hint: "Image on one side, words on the other." },
  { value: "type", label: "Typographic introduction", hint: "A strong line of text leads, images follow." },
  { value: "index", label: "Project index", hint: "A clean list of projects that opens into each one." },
  { value: "grid", label: "Grid gallery", hint: "Even rows of work." },
  { value: "masonry", label: "Masonry gallery", hint: "Images of different sizes, fitted together." },
  { value: "magazine", label: "Magazine-like sections", hint: "Varied sections, like turning pages." },
  { value: "cards", label: "Modular cards", hint: "Clear boxes for each project or service." },
  { value: "help", label: "Help me choose" },
];

export const MOTION_OPTIONS: Option[] = [
  { value: "static", label: "Mostly static", hint: "Things stay still. Calm and fast." },
  { value: "subtle", label: "Subtle transitions", hint: "Gentle fades as you scroll and hover." },
  { value: "expressive", label: "Expressive interactions", hint: "Noticeable movement when you hover, scroll, or click." },
  { value: "immersive", label: "Immersive storytelling", hint: "Scroll-driven scenes that unfold like a sequence." },
  { value: "none", label: "No preference" },
];

export const TREATMENT_OPTIONS: Option[] = [
  { value: "flat", label: "Clean flat surfaces" },
  { value: "grain", label: "Grain or paper texture" },
  { value: "glass", label: "Glass / translucency" },
  { value: "gradient", label: "Soft gradients" },
  { value: "metallic", label: "Metallic or glossy accents" },
  { value: "hand", label: "Hand-drawn details" },
  { value: "none", label: "No preference" },
];

export const TONE_OPTIONS: Option[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "mixed", label: "A mix" },
  { value: "none", label: "No preference" },
];
