# Start a Project: engraving illustrations

**Status (Sep 28):** all ten are in and live on the cards and the welcome screen.

The onboarding cards ("What are we making together?" and "And you are…") can each carry a
small antique-engraving illustration, in the spirit of Victor Work's cards. Until an image
exists, a card shows as text only, so you can add them one at a time.

## How to generate (ChatGPT)

1. Paste the **style block** first, then one **subject** line. Generate one image per chat
   message so the style stays consistent. If one drifts (colour, grey shading, a frame, text),
   ask ChatGPT to redo it "in exactly the same engraving style as before".
2. Download as **PNG**. Transparent background is best; a pure white background also works,
   because the site blends white away.
3. Save it with the file name shown in **`design/onboarding/`** (the full-size originals live
   there and are never served), then run `npm run optimize:art`. That trims each image, fits it
   into the same square, and writes a light `.webp` (about 30 to 90 KB) to
   `public/assets/onboarding/`, which is what the site loads.
4. New file names also need a line in `ILLUSTRATIONS` in `src/lib/inquiry/steps.ts`.

### Style block (use for every image)

> Illustration in the style of an antique 19th-century steel engraving, fine cross-hatching and stipple shading,
> black ink only, no colour and no grey fills. A single object, centred, isolated on a fully
> transparent background, with generous empty space around it. No text, no lettering, no frame,
> no border, no ground shadow. Crisp, high-contrast linework like a plate from an old
> encyclopedia. Square, 2048 × 2048 pixels, PNG with transparency.

### Subjects

**What are we making together?** (do these first)

| File | Subject line to add after the style block |
|---|---|
| `service-web.png` | Pick one of the Web design options below. |
| `service-post.png` | Subject: a vintage upright Moviola film-editing machine with two film reels on top, three-quarter view. |
| `service-unsure.png` | Subject: an antique open pocket compass with a hinged lid, three-quarter view. |

**Web design options** (clear and recognisable; keep the one you like, save it as `service-web.png`):

- **A. The laptop.** Subject: an open laptop seen at a three-quarter angle, its screen showing a simple website layout: a large photo block at the top, a headline bar, and three smaller image tiles below. Drawn as a modern object but in the same antique engraving linework.
- **B. The browser window.** Subject: a single web browser window floating flat, with three small round buttons in its top bar, an address bar, and a page inside showing a big photo block and a few lines of text drawn as simple bars. No real letters.
- **C. The monitor.** Subject: a desktop computer monitor on a stand, its screen showing a website with a photo gallery grid.
- **D. The phone and laptop.** Subject: a laptop with a smartphone leaning against it, both screens showing the same simple website layout, so the site clearly works on both.

For all of these, add this line at the end: "Draw the screen content as simple shapes only, with no readable text, logos, or letters."
My suggestion: **A**. It says "website" at a glance and still sits with the other engravings.

**And you are…**

| File | Subject line |
|---|---|
| `who-actor.png` | Subject: an antique theatre limelight spotlight on a tall iron stand. |
| `who-director.png` | Subject: a director's viewfinder lens hanging from a leather neck cord. |
| `who-filmmaker.png` | Subject: a hand-cranked 1920s film camera on a wooden tripod. |
| `who-company.png` | Subject: a neat stack of round metal film canisters, the top one slightly open. |
| `who-business.png` | Subject: a wooden letterpress type drawer filled with metal type. |
| `who-other.png` | Subject: a feather quill resting in a glass inkwell. |

**Welcome screen (optional)**

| File | Subject line |
|---|---|
| `welcome-projector.png` | Subject: a 1920s cinema projector on a stand, a soft beam of light drawn as fine engraved lines. |

The welcome screen is dark, so this one is shown inverted, as cream line art. Generate it as
black ink like the others.

## Post-Production cards (optional, Sep 2026)

The six Post-Production service cards borrow engravings from the set above for now. To give
each its own, generate these with the same style block, save them to `design/onboarding/`,
run `npm run optimize:art`, then point that service's `art` in
`src/content/post-production.ts` at the new `.webp`.

| File | Service | Subject line to add after the style block |
|---|---|---|
| `post-reel.png` | Demo reels | Subject: a coiled strip of 35mm film loosely unspooling from a small reel. |
| `post-scene.png` | Scene edits | Subject: an antique wooden film clapperboard with hinged striped sticks, slightly open. |
| `post-teaser.png` | Teasers | Subject: a small brass handheld film viewer with a film strip threaded through it. |
| `post-trailer.png` | Trailers | Subject: a 1920s cinema projector with two reels, three-quarter view. |
| `post-film.png` | Short films | Subject: a vintage upright Moviola editing machine with two reels on top. |
| `post-social.png` | Social cutdowns | Subject: a pair of antique film-editing splicer scissors resting on a short strip of film. |

## Notes

- Keep them as a set: same line weight, similar object size, and lots of empty space around
  each object. Cards show them at about 160–220px wide.
- Selected cards turn ink-black and the artwork inverts to cream automatically, so one export
  per image is enough.
- You rejected AI photography for the site before. These are deliberately graphic,
  period-style line drawings rather than photos, but judge them against that feeling before
  they go live.
