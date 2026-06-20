# Meraki Creative — Project Guide

**"A creative studio for storytellers"** — a boutique creative studio by **Merivelle** across
THREE co-equal pillars: **Post-Production** (film/trailer/teaser/reel/scene/social editing),
**Digital Presence** (actor/director/production-company/portfolio/film websites), and
**Creative Materials** (pitch decks, lookbooks). Actors + filmmakers are audiences, not the whole
identity. Core message: **"The work is already there. We help present it."**

## Brand positioning (read this before touching copy or design)

- Must feel **elevated, cinematic, personal, and practical** — like an **A24 creative studio /
  editorial design studio / boutique post-production house**.
- Tone: **professional, warm, clear, industry-aware**.
- Position as a **boutique creative studio for storytellers**. Do NOT position as: an actor-only
  business, a reel-editing service, a marketing agency, a social agency, or a website-design company.
- Three pillars are **co-equal** (editing, websites, materials all primary).
- Avoid: corporate, techy, neon, overly feminine, template/stock-photo energy.
- Keep verbatim: **"Your work is ready for the room."** and **"The talent is rarely the problem.
  The packaging is."** Main CTA: **"Start Your Project"** · Secondary CTA: **"View Services"**.
- **DO NOT redesign** — the visual system is locked; repositioning is copy/framing only.

## ⭐ Two folders that define how to work here

### `UI UX Design Innspo/`  ← the UI style Merivelle wants
Seven reference screenshots (Studio Rippl, Frama, AWD agency, The Wild Core, golf studio,
monochrome editorial). **This folder is the source of truth for the visual direction.**
The look they establish, and which this site implements:
- **Cream / off-white background** (`#F4F1EA`) with deep **ink black** type.
- **Oversized editorial grotesk display type** (Archivo here; Helvetica/Neue-Haas feel).
- **Monospace caption labels**, uppercase, often parenthesized: `( 01 )`, `NIKON F3 HP`.
- **Hairline rules** dividing sections; corner-anchored nav; generous whitespace.
- **Large image/video blocks**, multi-column small body text, B&W + warm color photography.
- A **restrained rust/terracotta accent** (`#B4452F`, used sparingly) and an occasional
  **handwritten signature script** (Caveat) as a personal flourish.
- Dark full-bleed sections for cinematic contrast; dark footer.
**Always re-open these images before redesigning anything visual.**

### `.claude/skills/`  ← skills available in this project
Local skills installed for this project. Relevant ones:
- **`impeccable`** — frontend/UI design quality, visual hierarchy, polish. Use for design
  critique/polish passes on the site.
- **`ui-ux-pro-max-skill-main`** — UI/UX patterns and components reference.
- **`humanize-writing`** — strip AI-tells from copy; keep prose natural. Use on all site copy.
- **`emil-design-eng`** — design-engineering reference.
- **`remotion-best-practices copy`** — Remotion (React video) reference, if/when building
  motion or reel-related video tooling.
Consult these (especially `impeccable` + `humanize-writing`) when iterating.

## The site

Static, no build step. Lives in `meraki-creative/`. Host anywhere (Netlify, Vercel,
GitHub Pages) — just upload the folder. Open `index.html` to preview locally.

```
meraki-creative/
  index.html      Home
  services.html   Services (For Actors / For Filmmakers)
  packages.html   5 packages
  portfolio.html  Editorial work grid (placeholders)
  about.html      Merivelle's story
  contact.html    Inquiry form
  styles.css      Single shared stylesheet + design tokens (:root)
  main.js         Mobile nav + scroll reveal (progressive; site works without JS)
  assets/         README.txt with image/video specs; drop real media here
```

### Design direction — "Marquee Minimal" (current)
History: original cream/editorial → audited with `impeccable` (flagged as the saturated
"editorial-typographic AI" lane) → rebuilt as "Call Sheet" (serif + goldenrod + AI photos) →
**client rejected the Bodoni serif, the goldenrod, and the AI photos.** Current direction =
**Marquee Minimal**: bold Swiss grotesk, type-led/image-light, close to her original inspo
(Studio Rippl, Frama). Clean off-white, near-black ink, restrained **oxblood** accent, one dark
band. Full system + audit status in `DESIGN.md` (same folder).

Tokens (in `styles.css :root`): `--paper #F3F2EE` · `--ink #17150F` · `--accent #7B2D26`
(oxblood) / `--accent-soft #C9897F` (on dark) · `--night #15130E`.
Fonts (Google): **Archivo** (display + body, weight contrast) + **JetBrains Mono**
(labels). (Client preferred Archivo over Schibsted Grotesk.) Context files for `impeccable`:
`PRODUCT.md` + `DESIGN.md` (this folder).

> ✅ **Rollout status:** ALL 6 pages are now on the Marquee Minimal (Archivo) system with a
> consistent header strip, nav, footer, and components. No photos: pages use `.frame` / `.ph`
> placeholders for Merivelle's own real work (see `assets/README.txt`). Accent is swappable
> (oxblood → forest/slate) via `--accent*`. Detector residuals across pages are the intentional
> `single-font` (one grotesk by choice) and, on the homepage, the justified `Call 01–04` schedule.

## Before launch — Merivelle's to-do
1. **Pricing:** replace every `from $—` in `packages.html` with real starting prices.
2. **Contact form:** in `contact.html`, swap `YOUR_FORM_ID` for a real
   [Formspree](https://formspree.io) ID (or switch to the mailto fallback — instructions in
   the form's HTML comment).
3. **Email + socials:** replace `hello@merakicreative.com` and the `#` Instagram/IMDb/LinkedIn
   links across all pages and the footer.
4. **Images:** replace placeholder `.ph` blocks with real media (see `assets/README.txt`).
5. Optional: add a favicon; run the `impeccable` skill for a final polish pass.

## Working conventions
- Keep all styling in `styles.css`; reuse existing component classes (`.card`, `.pkg`,
  `.service-row`, `.ph`, `.band-dark`, `.btn`, etc.) rather than adding new patterns.
- Every page needs a unique `<title>` and `<meta name="description">`.
- Run new/edited copy through the `humanize-writing` skill; match the existing voice.
