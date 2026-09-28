# Start a Project: engraving illustrations

The onboarding cards ("What are we making together?" and "And you are…") can each carry a
small antique-engraving illustration, in the spirit of Victor Work's cards. Until an image
exists, a card shows as text only, so you can add them one at a time.

## How to generate (ChatGPT)

1. Paste the **style block** first, then one **subject** line. Generate one image per chat
   message so the style stays consistent. If one drifts (colour, grey shading, a frame, text),
   ask ChatGPT to redo it "in exactly the same engraving style as before".
2. Download as **PNG**. Transparent background is best; a pure white background also works,
   because the site blends white away.
3. Save it with the file name shown, and send it to me (or drop it in
   `public/assets/onboarding/`). I'll switch it on in `src/lib/inquiry/steps.ts`.

### Style block (use for every image)

> Antique 19th-century steel-engraving illustration, fine cross-hatching and stipple shading,
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

**Web design options** (try a few, keep the one you like, save it as `service-web.png`):

- **A. The frame.** Subject: an ornate, empty gilt picture frame, slightly angled, with nothing inside it. *The site frames the work.*
- **B. The window.** Subject: an antique arched window with its wooden shutters open and fine engraved rays of light falling through it. *A way in to the work.*
- **C. The cinema.** Subject: the façade of a small 1920s cinema with a marquee of bulb lights and a blank sign with no letters on it. *The place the work is shown.*
- **D. The townhouse.** Subject: a cutaway of a narrow Victorian townhouse with the front wall removed, showing furnished rooms on each of its four floors. *One home, many rooms (pages).*
- **E. The door.** Subject: an old wooden door standing slightly ajar, an ornate iron key in the lock. *An invitation in.*
- **F. The stereoscope.** Subject: a Victorian stereoscope viewer with a photograph card slotted into it. *Seeing the work in depth.*
- **G. The stage.** Subject: a small Victorian theatre proscenium, heavy velvet curtains drawn open on an empty stage, seen straight on.

My suggestion: **A** reads most clearly at card size; **D** is the most distinctive.

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

## Notes

- Keep them as a set: same line weight, similar object size, and lots of empty space around
  each object. Cards show them at about 160–220px wide.
- Selected cards turn ink-black and the artwork inverts to cream automatically, so one export
  per image is enough.
- You rejected AI photography for the site before. These are deliberately graphic,
  period-style line drawings rather than photos, but judge them against that feeling before
  they go live.
