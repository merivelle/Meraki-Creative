import { expect, test } from "@playwright/test";

const REDIRECTS: [string, string][] = [
  ["/index.html", "/"],
  ["/services.html", "/services"],
  ["/packages.html", "/services"],
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
  const pk = await request.get("/packages", { maxRedirects: 0 });
  expect(pk.status()).toBe(308);
  expect(new URL(pk.headers().location, "http://x").pathname).toBe("/services");
  const q = await request.get("/contact.html?package=Trailer%20Package", { maxRedirects: 0 });
  expect(q.headers().location).toContain("/start?package=Trailer%20Package");
});

test("public pages render their key content", async ({ page }) => {
  const checks: [string, string][] = [
    ["/", "The story is"],
    ["/web-design", "Website design"],
    ["/post-production", "for storytellers."],
    ["/work", "Stories we"],
    ["/about", "Made with meraki."],
    ["/start", "Hi there."],
  ];
  for (const [path, text] of checks) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toContainText(text);
  }
});

test("editing prices live on the post-production service pages", async ({ page }) => {
  await page.goto("/post-production/demo-reel-editing");
  await expect(page.locator(".wsp-price b")).toHaveText("From $150");
  await page.goto("/post-production/trailer-editing");
  await expect(page.locator(".wsp-price b")).toHaveText("From $850");
  await expect(page.locator("a[href='/start?package=trailer']").first()).toBeVisible();
});

test("website prices live on the web design service pages", async ({ page }) => {
  await page.goto("/web-design/actor-websites");
  await expect(page.locator(".wsp-price b")).toHaveText("From $650");
  await expect(page.locator("a[href='/start?package=actor-website']").first()).toBeVisible();
});

test("package links preselect the service and show the package", async ({ page }) => {
  await page.goto("/contact.html?package=Demo%20Reel%20Edit");
  await expect(page).toHaveURL(/\/start\?package=/);
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page.locator('input[name="package"]')).toHaveValue("demo-reel");
  await expect(page.locator(".ob-pkg")).toContainText("Demo Reel Edit");
  await expect(page.locator('input[name="services"][value="post-production"]')).toBeChecked();
});

test("the onboarding branches, keeps answers on Back and Edit, and survives a refresh", async ({ page }) => {
  await page.goto("/start");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Begin" }).click();
  const current = () => page.locator(".ob-step.is-current");

  // Only web design chosen → web questions appear, editing questions don't.
  await page.keyboard.press("a");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(current()).toHaveAttribute("data-step", "client_type");
  await page.keyboard.press("b"); // Director, moves on by itself
  await expect(current()).toHaveAttribute("data-step", "web_scope");
  await expect(page.locator('[data-step="post_type"]')).toBeHidden();

  // Back keeps the answer.
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator('[data-step="client_type"] input[value="director"]')).toBeChecked();

  // A refresh mid-flow restores progress.
  await page.reload();
  await expect(current()).toHaveAttribute("data-step", "client_type");
  await expect(page.locator('[data-step="client_type"] input[value="director"]')).toBeChecked();

  // Required text blocks Continue until answered.
  await page.keyboard.press("b");
  await expect(current()).toHaveAttribute("data-step", "web_scope");
  for (const k of ["b", "a"]) { await page.keyboard.press(k); await page.waitForTimeout(700); }
  await page.getByRole("button", { name: "Skip" }).click(); // extras
  await expect(current()).toHaveAttribute("data-step", "goal");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(current().locator(".field-error")).toBeVisible();
  await page.locator("#ob-goal").fill("A site for festival season");
  await page.keyboard.press("Enter");
  await page.locator("#ob-description").fill("A director site with two shorts and a feature in development.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // links
  await page.getByRole("button", { name: "Skip" }).click(); // timing
  await page.keyboard.press("f"); // budget: unsure
  await page.locator("#ob-name").fill("Test Visitor");
  await page.locator("#ob-email").fill("test@example.test");
  await page.getByRole("button", { name: "Review" }).click();
  await expect(current()).toHaveAttribute("data-step", "review");
  await expect(page.locator(".ob-review")).toContainText("Director");
  // Opening the review must not send anything (no server response on screen).
  await page.waitForTimeout(800);
  await expect(current().locator(".form-error")).toHaveCount(0);

  // Edit from the review returns to the review with the change.
  await page.getByRole("button", { name: "Edit: And you are…" }).click();
  await page.keyboard.press("d"); // Production company
  await expect(current()).toHaveAttribute("data-step", "review");
  await expect(page.locator(".ob-review")).toContainText("Production company");
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
