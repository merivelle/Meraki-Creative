# Meraki Creative — Project Guide

**"A creative studio for storytellers"** — a boutique creative studio by **Merivelle** across
THREE co-equal pillars: **Post-Production** (film/trailer/teaser/reel/scene/social editing),
**Digital Presence** (actor/director/production-company/portfolio/film websites), and
**Creative Materials** (pitch decks, lookbooks). Actors + filmmakers are audiences, not the whole
identity. Core message: **"The story is already there. We're here to help it be seen."**

## Brand positioning (read this before touching copy or design)

- Must feel **cinematic, thoughtful, warm, artistic, understated, and human** — like an **A24
  creative studio / editorial design studio / boutique post-production house**. Write
  filmmaker-to-filmmaker, not agency-to-client.
- Tone: **professional, warm, clear, industry-aware**.
- Position as a **boutique creative studio for storytellers**. Do NOT position as: an actor-only
  business, a reel-editing service, a marketing agency, a social agency, or a website-design company.
- Three pillars are **co-equal** (editing, websites, materials all primary).
- Avoid: corporate, techy, neon, overly feminine, template/stock-photo energy.
- **Signature lines (canon — echo these across the site):** "The story is already there. We're here
  to help it be seen." · "The work matters. So does how it's experienced." · "Start with the story."
  · "Stories we've helped shape." · "We design what speaks for it." Main CTA button stays
  **"Start Your Project"** · Secondary **"View Services"**.
- **Story-first voice (2026 pivot).** The brand reveals what's already there; it does not manufacture
  attention or sell. Write filmmaker-to-filmmaker. BANNED words/phrases: "the room," "the right
  people," "opens doors," "sell / sells it," "packaging," "elevate/elevated," "launch," "scale,"
  "funnels," "conversion," "personal brand," "pick a lane," "impossible to ignore," "get you seen."
  Lead with story, craft, and soul (*meraki*: doing something with soul, creativity, and love). The
  question behind every service: "What is this story trying to say?"
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

**Next.js (App Router, TypeScript) + Supabase + Resend** at the repo root (migrated Sep 2026
from the static HTML site, which is kept for reference in `legacy/`). Three areas: public site,
client portal (`/portal`), studio admin (`/admin`). Read `docs/ARCHITECTURE.md` first.

```
src/app/(site)/     Public pages: /, /web-design, /post-production, /creative-materials,
                    /services, /packages, /work(/[slug]), /about, /start(/thanks)
src/app/portal/     Client portal (invited clients, per-project access)
src/app/admin/      Studio admin (staff only); server actions in admin/_actions/
src/app/(auth)/     /login, /forgot-password, /account/set-password, /invite/[token]
src/components/site Public markup, 1:1 with the old HTML (same class names)
src/components/app  Plain functional portal/admin components (design deferred)
src/lib/            forms engine, auth guards, email outbox, payments, content, files
src/content/        seed.ts (site content transcribed from legacy/), forms/ (questionnaires)
src/styles/         site.css = the original styles.css (verbatim); app.css + forms.css = functional only
supabase/           migrations (schema + RLS), local config, auth email templates
scripts/            seed-content, seed-dev, grant-admin, import-inquiries
public/assets/      images/video/favicons (URLs unchanged: /assets/...)
```

- Old `.html` URLs 308-redirect to the new routes (`src/lib/redirects.ts`). Keep that list.
- Public content (packages, portfolio, services, testimonials, FAQs, page copy) is edited in
  Admin → Website content and must be **published** to appear. Prices are verbatim strings.
- Dev: `npm run dev`; tests: `npm test` (unit), `npm run test:integration` (needs the dev
  Supabase in `.env.local`), `npm run test:e2e`. Never point `.env.local` at production.
- Setup still needing accounts/keys: `docs/SETUP_EXTERNAL.md`. First admin: `docs/ADMIN_SETUP.md`.
- New/changed copy awaiting sign-off: `docs/COPY_FOR_REVIEW.md`.

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

## Before launch — status
1. ~~**Pricing**~~ — done; `packages.html` carries real "From $" prices.
2. ~~**Contact form**~~ — replaced by the branching inquiry at `/start` (saved to Supabase,
   emailed via Resend). Web3Forms is no longer called by the new site.
3. ~~**Socials**~~ — done; real Instagram / IMDb / Vimeo links are in every footer.
   ⚠️ There is **no `hello@merakicreative.com`** — `merakicreative.com` belongs to someone
   else. The site is `merakicreative.co`, and the canonical host is
   **`https://www.merakicreative.co`** (the apex 308-redirects to `www`). Never write the
   `.com` form anywhere.
4. ~~**Favicon**~~ — done; full icon set in `assets/favicon/` plus a web manifest.
5. **Images:** a few `.ph` placeholder blocks remain (see `assets/README.txt`).

## SEO — what is wired up
- `robots.ts`, `sitemap.ts` (static routes + published `/work/[slug]`), `not-found.tsx`, `.vercelignore`.
- Every public page: canonical, Open Graph, Twitter card, `theme-color`, and JSON-LD
  (`ProfessionalService` + `Person` + per-page type + breadcrumbs). OG image lives at
  `assets/social/og-default.jpg` (1200×630).
- Service pages `/post-production` and `/web-design` are now in the primary nav (seven items:
  Home, Web Design, Post-Production, Work, About, Start a Project, Client Login — changed at
  Merivelle's request, Sep 2026). `/creative-materials` and `/services` are footer-linked.
- Positioning for search is **Los Angeles / local**. Keep the city in titles, descriptions,
  and schema. The plain-language service words ("film editing", "post-production",
  "website design") must stay in the copy — they are what people actually search for, and
  the site had none of them before.

## Working conventions
- Public styling stays in `src/styles/site.css` (the original stylesheet); reuse its classes
  (`.pkg-item`, `.index-row`, `.btn`, `.field`, etc.). Portal/admin styling is intentionally
  minimal and functional until visual references are chosen.
- Authorization: every page/action/route calls a guard from `src/lib/auth/guards.ts`; RLS is
  the backstop. Never export an unguarded function from a `"use server"` file.
- Every page needs a unique `<title>` and `<meta name="description">`.
- Run new/edited copy through the `humanize-writing` skill; match the existing voice.
