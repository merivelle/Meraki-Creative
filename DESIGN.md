# Design

> Visual system of record. Direction = **"Marquee Minimal"** (revised after client feedback on
> the Call Sheet version: she rejected the Bodoni serif, the goldenrod, and the AI photos).
> The homepage (`index.html`) is the built flagship; pages 2–6 await rollout to this system.

## Theme

Bold Swiss-grotesk editorial, type-led and image-light — close to the original inspo (Studio
Rippl, Frama). Clean cool off-white, near-black ink, a restrained oxblood accent, one dark
contrast band. No serif display, no yellow, no AI photos (clean frames for the client's real
work instead).

## Color

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F3F2EE` | page base — clean cool off-white (off the warm AI-cream) |
| `--paper-2` | `#E9E7E0` | recessed panels / frames |
| `--ink` | `#17150F` | near-black, primary text |
| `--ink-2` | `#34302A` | secondary text (AA on paper) |
| `--ink-soft` | `#54504A` | tertiary (≥4.5:1 on paper) |
| `--accent` | `#7B2D26` | oxblood — links, labels, small fills on LIGHT |
| `--accent-deep` | `#5E221E` | hover/pressed |
| `--accent-soft` | `#C9897F` | lighter oxblood tint — accent on DARK surfaces |
| `--night` | `#15130E` | one dark contrast band + footer |

Strategy: **Restrained** — ink + paper carry it; oxblood is a quiet <5% accent (brand dot, nav
underline, label rules, links). Swappable to forest/slate by changing `--accent*`.

## Typography

- **Display + body:** **Archivo** — one clean grotesk family in weight contrast
  (800/900 display, 400/500 body). A single strong family per the client's inspo (Studio Rippl).
  (She explicitly preferred Archivo over Schibsted Grotesk.)
- **Meta labels:** **JetBrains Mono** (the small uppercase strip / tags / role labels).

(The `single-font` detector flag is intentional: a single grotesk in weight contrast + a mono
for labels is the requested look and is endorsed by impeccable's typography guidance.)

## Motif

Light-touch: a slim top **production strip** (mono), small **`.slate-tag`** labels (oxblood
underline, not a filled chip), and mono meta on the hero. No per-section eyebrows. Numbers only
where content is a real sequence (the `Call 01–04` schedule).

## Components

`.strip` top meta line · type-led `.hero` (no image) · `.statement` · `.split` / `.split.reverse`
index + `.frame` (clean bordered placeholder for client's real work) · `.pkg-feature` 3-up with
one inverted featured · `.band-night` dark "Why" 2×2 · `.schedule` process · `.cta-band` ink
ground · dark footer.

## Imagery

**Type-led, image-light.** No stock or AI photos. Two `.frame` placeholders on the homepage
(For Actors / For Filmmakers, 3:4) where Merivelle drops her own real screenshots/stills before
launch. See `assets/README.txt`. (The earlier AI cinematic photos were removed at her request.)

## Motion

CSS only, visible-by-default, reduced-motion safe: hero headline + meta rise on load, section
reveals, staggered list entrances, `.index-row` hover nudge via `translateX` (not layout props).
Reveal safety: `main.js` force-reveals on hidden tab / headless (transitions don't run there).

## Hero motion graphic — "cut → site → outcome" (Build A, on-site)

In the homepage hero, a decorative motion **stage** (`.stage[data-motion]`) loops three acts via
a **GSAP** timeline (`main.js`): (1) THE CUT — editing timeline, playhead sweep, clip + waveform
build; (2) THE SITE — a browser window assembling (`name.com`, nav, embedded reel, rows); (3) THE
OUTCOME — two "real product examples" cards (reel + website) + "Real work. Ready for the room."
Transforms/opacity only; pauses on hidden tab. **Static / no-JS / reduced-motion shows the OUTCOME
act** (the meaningful frame) via CSS default (`.act{opacity:0}.act-out{opacity:1}`). GSAP loads from
CDN on `index.html` only. Swap points: the reel card + website card take real exports later.

**Build B — produced video (done):** a HyperFrames composition in `motion/` (single-composition
`motion/index.html`, brand fonts in `motion/assets/fonts/`) renders the same 18s storyboard to
**`motion/renders/meraki-cut-to-launch-16x9.mp4`** (1920×1080, ~1.5MB) + `poster-16x9.png`.
Rebuild/iterate: `cd motion && npm run check && npm run render` (needs FFmpeg, now installed).
The `motion/` folder is the video PROJECT — keep it OUT of the deployed static site. A 9:16
social cut is an optional follow-up (needs a vertical-reflow composition).

## Portfolio — real work (Part 7)

`portfolio.html` shows real work from the project's `Work Examples/` folder, exported web-optimized
to `assets/work/`: **before/after color-grade sliders** (`.ba[data-ba]`, drag + reduced-motion-safe
intro wipe), **reel preview cards** (`.reel[data-reel]`, hover/tap muted-loop play, poster + Vimeo
link), and **website captures** (`.site-frame`, Meraki + merivelle.net). Additive components only;
`main.js` drives the slider + hover-play. Homepage pillar frames also use real stills.

## Polish pass (impeccable)

Global `:focus-visible` rings on all links (accent / accent-soft on dark), `.btn:active`,
AA-contrast `::placeholder`, `:user-invalid` form feedback, keyboard **skip-link** + `#main`
target on every page, contact `autocomplete` + required-fields note. Hero `.display-xl` capped at
**6rem** per impeccable's heading ceiling. Detector: only intentional `single-font` (+ homepage's
justified `Call 01–04`). Zero horizontal overflow; AA contrast throughout.

## Audit status (homepage)

- Bodoni serif → bold grotesk; goldenrod → oxblood; AI photos → removed. All per client feedback.
- Body em-dashes: 0 (only the SEO `<title>` keeps a conventional brand–tagline dash).
- Detector residuals (both intentional): `single-font` (single grotesk by design) and
  `numbered-section-markers` (the justified `Call 01–04` schedule sequence).
- Contrast AA, zero horizontal overflow 360→1440px.
