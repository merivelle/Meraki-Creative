MERAKI CREATIVE — IMAGE / VIDEO ASSET GUIDE
============================================

The homepage is intentionally TYPE-LED (bold grotesk, minimal). It uses a couple of clean
"frames" where YOU drop in your own real work. There are no stock or AI photos — by design.

The site ships with elegant empty FRAMES (bordered boxes with a [ Your work goes here ] label).
Replace each with a real <img> when you have the asset.

How to fill a frame:
  Find in index.html:
    <div class="frame"><span class="frame-label">[ Your work goes here ] ...</span></div>
  Replace the <span> with an image:
    <div class="frame"><img src="assets/your-photo.jpg" alt="Describe it" /></div>
  (The frame keeps its 3:4 shape and crops with object-fit: cover.)

WHAT TO PUT IN THE HOMEPAGE FRAMES
----------------------------------
- "For Actors" frame  → a real actor-site screenshot, headshot, or reel still (3:4)
- "For Filmmakers" frame → a film still, pitch-deck cover, or director-site screenshot (3:4)

Use your OWN client work or your own materials. Real beats generic every time.

RECOMMENDED SPECS
-----------------
Homepage frames ........ 3:4 portrait, ~1200px wide
Portfolio grid (later) . 16:9 / 4:3 / 3:4 mix, ~1200–1600px wide
Reel / trailer stills .. 16:9, ~1600px wide

OPTIMIZATION
------------
  - Export JPG ~70–80% quality, or WebP for smaller files. Keep each under ~400KB.
  - For any video: compress H.264/H.265 MP4; keep loops under ~5MB.

TONE
----
Warm, filmic, restrained. Black & white or muted color both work. Let one strong image speak;
don't pad with weak ones.

FAVICON (optional)
------------------
  Add favicon.png here and reference in each page <head>:
    <link rel="icon" href="assets/favicon.png" />

NOTE: earlier AI-generated cinematic photos were removed at the client's request. This version
is deliberately type-led with frames for real work.

REAL WORK (assets/work/)  — used on portfolio.html + homepage pillar frames
-----------------------------------------------------------------------------
Generated (web-optimized) from the masters in the project's "Work Examples/" folder. The heavy
4K masters stay in "Work Examples/" and are NOT part of the deployed site.

  grade1/grade2-before/after.jpg ... color-grade before/after pairs (before/after sliders)
  reel-nicky / reel-yonatan / reel-sitdown .mp4 ... silent 720p preview loops (hover to play)
  film-opa.mp4 + film-opa-poster.jpg ... silent 720p Opa loop (portfolio Films section)
  scene-sunflower.mp4 / scene-butterflies.mp4 (+ -poster.jpg) ... silent 720p scene loops
    (portfolio Scenes section) cut from the 4K masters starting at her timecodes
    (Sunflower 53:21 = 53.875s; I Felt Butterflies 1:03:05 = 63.208s, both @24fps).
  showreel.mp4 + showreel-poster.jpg ... director demo reel loop (homepage showreel + portfolio Reel)
  reel-*-poster.jpg ... poster frames for the loops
  site-meraki.jpg / site-merivelle.jpg / site-yonatan.jpg ... real website screenshots (Websites section)
  about-merivelle.jpg ... B&W portrait of Merivelle (about.html .frame, 3:4 cover)

PORTFOLIO section order (portfolio.html): Reel (demo reel) · Films (The Sitdown, Opa) ·
  Scenes (Sunflower in the Field, I Felt Butterflies) · Trailers (two YouTube embeds) ·
  Color grade · Websites. Trailer embeds use youtube-nocookie.com/embed/<id> — swap the IDs
  to change the trailers. (YouTube embeds only play over http(s), not file://.)

TO DO when you have them:
  - In portfolio.html, replace each Watch full `href="#"` with your real Vimeo links.
  - To refresh a preview loop from a different moment, re-run the ffmpeg command in the project
    notes with a different -ss (start) time, scaled to 1280 wide, -an (no audio), crf 26.
  - Add client website screenshots as more launch: copy a `.site-frame` block in the Websites
    section and drop a new screenshot into assets/work/.
