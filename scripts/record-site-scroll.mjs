/**
 * Records a smooth top-to-bottom scroll of a live site as a WebM, for the homepage
 * Featured Work hover previews. Drives the installed Google Chrome through Playwright.
 *
 *   node scripts/record-site-scroll.mjs <url> <name> [scrollSeconds] [introSeconds]
 *   → public/assets/work/scroll-<name>.webm, and prints the second scrolling starts
 *     (use it as the tile's `start` in FEATURED_PREVIEW, src/app/(site)/page.tsx).
 */
import { chromium } from "playwright";
import { rename, rm, mkdir } from "node:fs/promises";
import path from "node:path";

const [url, name, secondsArg, introArg] = process.argv.slice(2);
if (!url || !name) {
  console.error("Usage: node scripts/record-site-scroll.mjs <url> <name> [scrollSeconds] [introSeconds]");
  process.exit(1);
}
const SCROLL_MS = Number(secondsArg ?? 9) * 1000;
const INTRO_MS = Number(introArg ?? 3) * 1000; // longer for sites with a loader
const tmpDir = path.resolve(".record-tmp");
const out = path.resolve(`public/assets/work/scroll-${name}.webm`);

await mkdir(tmpDir, { recursive: true });
// Software WebGL so canvas/WebGL type (e.g. a hero name) renders headless.
// Uses the installed Google Chrome, so no Playwright browser download is needed.
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
  recordVideo: { dir: tmpDir, size: { width: 800, height: 600 } },
});
const page = await context.newPage();
const t0 = Date.now();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(INTRO_MS); // let the intro / loader play out
const start = (Date.now() - t0) / 1000;

// Scroll with real mouse-wheel steps, not scrollTo: smooth-scroll libraries (Lenis etc.)
// listen for the wheel and would fight a direct scrollTo. Even steps across the whole page
// let the site's own scroll animations run.
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.mouse.move(600, 450);
// Paced by the wall clock (each wheel call has its own overhead), eased in and out.
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const s0 = Date.now();
let sent = 0;
for (;;) {
  const t = Math.min(1, (Date.now() - s0) / SCROLL_MS);
  const target = max * ease(t);
  if (target > sent) { await page.mouse.wheel(0, target - sent); sent = target; }
  if (t >= 1) break;
  await page.waitForTimeout(30);
}
await page.waitForTimeout(1500);

const video = page.video();
await context.close();
await browser.close();
await rename(await video.path(), out);
await rm(tmpDir, { recursive: true, force: true });
console.log(JSON.stringify({ out: path.relative(process.cwd(), out), start: Math.round(start * 10) / 10 }));
