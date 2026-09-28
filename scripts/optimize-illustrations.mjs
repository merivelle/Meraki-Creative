/**
 * Turns the full-size engraving PNGs in design/onboarding/ into light web images in
 * public/assets/onboarding/. Each image is trimmed of empty space and fitted, centred,
 * into the same square, so objects sit at a consistent size on the cards.
 *
 *   npm run optimize:art
 *
 * Re-run after adding or replacing any image. The originals are never served.
 */
import { readdirSync, mkdirSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "design/onboarding";
const OUT = "public/assets/onboarding";
const SIZE = 640; // 2x the largest display size on the cards
const PAD = 0.06; // breathing room inside the square

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC).filter((f) => f.endsWith(".png"))) {
  const name = file.replace(/\.png$/, "");
  const inner = Math.round(SIZE * (1 - PAD * 2));
  const trimmed = await sharp(`${SRC}/${file}`).ensureAlpha().trim({ threshold: 5 }).toBuffer();
  const fitted = await sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const pad = Math.round((SIZE - inner) / 2);
  await sharp(fitted)
    .extend({ top: pad, bottom: SIZE - inner - pad, left: pad, right: SIZE - inner - pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(`${OUT}/${name}.webp`);
  const kb = (n) => Math.round(n / 1024);
  console.log(`${name}.webp  ${kb(statSync(`${SRC}/${file}`).size)} KB → ${kb(statSync(`${OUT}/${name}.webp`).size)} KB`);
}
