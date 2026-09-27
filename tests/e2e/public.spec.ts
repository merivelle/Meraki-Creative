import { expect, test } from "@playwright/test";

const REDIRECTS: [string, string][] = [
  ["/index.html", "/"],
  ["/services.html", "/services"],
  ["/packages.html", "/packages"],
  ["/portfolio.html", "/work"],
  ["/about.html", "/about"],
  ["/contact.html", "/start"],
  ["/thanks.html", "/start/thanks"],
  ["/website-design.html", "/web-design"],
  ["/post-production.html", "/post-production"],
];

test("every old .html URL permanently redirects to its new page", async ({ request }) => {
  for (const [from, to] of REDIRECTS) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(new URL(res.headers().location, "http://x").pathname, from).toBe(to);
  }
  const q = await request.get("/contact.html?package=Trailer%20Package", { maxRedirects: 0 });
  expect(q.headers().location).toContain("/start?package=Trailer%20Package");
});

test("public pages render their key content", async ({ page }) => {
  const checks: [string, string][] = [
    ["/", "The story is"],
    ["/web-design", "Website design"],
    ["/post-production", "Post-production,"],
    ["/creative-materials", "We design what"],
    ["/packages", "Where"],
    ["/work", "Stories we"],
    ["/about", "Made with meraki."],
    ["/start", "about your story."],
  ];
  for (const [path, text] of checks) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toContainText(text);
  }
});

test("prices are shown exactly as before", async ({ page }) => {
  await page.goto("/packages");
  for (const [id, price] of [["reel-refresh", "From $95"], ["scene-edit", "From $100"], ["trailer", "From $850"], ["pitch-deck", "From $750"], ["actor-website", "Quote on request"]]) {
    await expect(page.locator(`#${id} .price`)).toHaveText(price);
  }
});

test("the old package links preselect the service and package", async ({ page }) => {
  await page.goto("/contact.html?package=Demo%20Reel%20Refresh");
  await expect(page).toHaveURL(/\/start\?package=/);
  await expect(page.locator('select[name="package"]')).toHaveValue("reel-refresh");
  await expect(page.locator('input[name="services"][value="post-production"]')).toBeChecked();
  await expect(page.locator("legend", { hasText: "Editing scope" })).toBeVisible();
  await expect(page.locator("legend", { hasText: "Website scope" })).toBeHidden();
});

test("work can be filtered by service and has detail pages", async ({ page }) => {
  await page.goto("/work?service=web-design");
  await expect(page.locator(".site-frame").first()).toBeVisible();
  await expect(page.locator(".ba")).toHaveCount(0);
  await page.goto("/work/opa");
  await expect(page.locator("h1")).toHaveText("Opa");
});

test("private areas require sign-in", async ({ request }) => {
  for (const path of ["/portal", "/admin", "/portal/projects/00000000-0000-4000-8000-000000000000"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect([302, 303, 307], path).toContain(res.status());
    expect(res.headers().location, path).toContain("/login");
  }
  const file = await request.get("/api/files/00000000-0000-4000-8000-000000000000", { maxRedirects: 0 });
  expect(file.status()).toBe(401);
});
