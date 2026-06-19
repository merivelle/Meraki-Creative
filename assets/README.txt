MERAKI CREATIVE — IMAGE & VIDEO ASSET GUIDE
============================================

The site ships with styled placeholder blocks (grey grid boxes with a
[ ... ] caption describing the intended asset). Replace each placeholder
<div class="ph ...">...</div> with a real <img> or <video> when ready.

Aesthetic to match (from the UI inspo folder):
  - Editorial, cinematic, filmic. Black & white or warm, desaturated color.
  - Lots of negative space. Restraint over flash.
  - Think Studio Rippl / Frama / film-still mood, not stock photography.

How to swap a placeholder for an image:
  Replace:
    <div class="ph ph-16x9"><span class="ph-label">[ ... ]</span></div>
  With:
    <img src="assets/your-image.jpg" alt="Describe the image" />
  (Keep it inside the same <figure>/<section> so layout holds.)

For a looping hero video, use:
    <video src="assets/hero.mp4" autoplay muted loop playsinline
           style="width:100%;display:block;"></video>

RECOMMENDED SPECS
-----------------
Hero film (Home / page heroes) ...... 21:9, 1920px+ wide, muted loop or still
Editorial break stills .............. 21:9 or 16:9, 1600px+ wide
Service / portfolio cards ........... 4:3 or 16:9, ~1200px wide
Vertical social clips / portrait .... 3:4 or 9:16, ~1000px wide
About portrait ...................... 3:4, ~1200px wide
Reel / trailer stills ............... 16:9, 1600px wide

OPTIMIZATION
------------
  - Export JPG at ~70–80% quality, or WebP for smaller files.
  - Keep individual images under ~400KB where possible.
  - Compress video (H.264/H.265 MP4); keep hero loops under ~5MB.

FAVICON (optional)
------------------
  Add a favicon.ico or favicon.png to this folder and reference it in each
  page <head>:  <link rel="icon" href="assets/favicon.png" />
