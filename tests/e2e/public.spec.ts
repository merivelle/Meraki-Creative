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
    ["/", "Meraki"],
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
  // size, current site, domain, content ready, who updates it
  for (const k of ["b", "a", "b", "b", "a"]) { await page.keyboard.press(k); await page.waitForTimeout(700); }
  await expect(current()).toHaveAttribute("data-step", "web_features");
  await page.getByRole("button", { name: "Skip" }).click(); // extras
  await expect(current()).toHaveAttribute("data-step", "goal");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(current().locator(".field-error")).toBeVisible();
  await page.locator("#ob-goal").fill("A site for festival season");
  await page.keyboard.press("Enter");
  await page.locator("#ob-description").fill("A director site with two shorts and a feature in development.");
  await page.getByRole("button", { name: "Continue" }).click();
  // Links: a URL with a note, then a second row.
  await page.locator("#ob-links").fill("vimeo.com/example");
  await current().getByPlaceholder("What is it, or what do you like about it?").first().fill("My reel");
  await page.getByRole("button", { name: "+ Add another link" }).click();
  await expect(current().locator(".ob-link-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // timing
  await page.keyboard.press("f"); // budget: unsure
  await page.locator("#ob-name").fill("Test Visitor");
  await page.locator("#ob-email").fill("test@example.test");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(current()).toHaveAttribute("data-step", "brief_gate");
  await page.keyboard.press("b"); // Skip for now → straight to review
  await expect(current()).toHaveAttribute("data-step", "review");
  await expect(page.locator(".ob-review")).toContainText("Director");
  await expect(page.locator(".ob-review")).toContainText("vimeo.com/example — My reel");
  // Opening the review must not send anything (no server response on screen).
  await page.waitForTimeout(800);
  await expect(current().locator(".form-error")).toHaveCount(0);

  // Edit from the review returns to the review with the change.
  await page.getByRole("button", { name: "Edit: And you are…" }).click();
  await page.keyboard.press("d"); // Production company
  await expect(current()).toHaveAttribute("data-step", "review");
  await expect(page.locator(".ob-review")).toContainText("Production company");
});

test("web clients can opt into the design brief and order homepage sections", async ({ page }) => {
  await page.goto("/start?service=web-design");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Begin" }).click();
  const current = () => page.locator(".ob-step.is-current");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.keyboard.press("a"); // actor
  await expect(current()).toHaveAttribute("data-step", "web_scope");
  for (const k of ["b", "c", "a", "a", "c"]) { await page.keyboard.press(k); await page.waitForTimeout(700); }
  await page.getByRole("button", { name: "Skip" }).click(); // extras
  await page.locator("#ob-goal").fill("A site for casting");
  await page.keyboard.press("Enter");
  await page.locator("#ob-description").fill("Headshots, reel, résumé.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // links
  await page.getByRole("button", { name: "Skip" }).click(); // timing
  await page.keyboard.press("f");
  await page.locator("#ob-name").fill("Test Actor");
  await page.locator("#ob-email").fill("actor@example.test");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.keyboard.press("a"); // Yes, let's go
  await expect(current()).toHaveAttribute("data-step", "brief_direction");

  // Directions: two at most; avoiding one un-picks it; preview opens and closes with Escape.
  const style = (id: string) => current().locator(`input[name="brief_styles"][value="${id}"]`);
  await style("editorial").check({ force: true });
  await style("cinematic").check({ force: true });
  await expect(style("swiss")).toBeDisabled();
  await current().locator('input[name="brief_styles_avoid"][value="editorial"]').check();
  await expect(style("editorial")).not.toBeChecked();
  await page.getByRole("button", { name: "Preview Luxury / fashion larger" }).click();
  await expect(page.locator(".ds-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".ds-dialog")).toBeHidden();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip" }).click(); // your brand

  // Typography: the suggestion only applies when asked.
  await expect(current()).toHaveAttribute("data-step", "brief_typography");
  await expect(current().locator('input[name="brief_type_pair"]:checked')).toHaveCount(0);
  await current().locator(".ds-suggest").getByRole("button", { name: "Apply" }).click();
  await expect(current().locator('input[name="brief_type_pair"][value="barlow"]')).toBeChecked();
  await page.getByRole("button", { name: "Continue" }).click();

  // Colour: brand colours reveal the pickers.
  await current().getByText("Use my existing brand colours").click();
  await expect(current().getByRole("button", { name: "+ Add a colour" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Skip" }).click(); // layout, finish, pages
  await expect(current()).toHaveAttribute("data-step", "brief_order");
  await page.getByRole("button", { name: "Selected work", exact: true }).click();
  await page.getByRole("button", { name: "Contact", exact: true }).click();
  await page.getByRole("button", { name: "Move Contact up" }).click();
  await expect(current().locator(".ob-order-label")).toHaveText(["Contact", "Selected work"]);
});

test("the design brief has its own page", async ({ page }) => {
  await page.goto("/start/design");
  await expect(page.locator("h1")).toContainText("Tell me more.");
});

test("work can be filtered by service and has detail pages", async ({ page }) => {
  await page.goto("/work?service=web-design");
  await expect(page.locator(".site-frame").first()).toBeVisible();
  await expect(page.locator(".ba")).toHaveCount(0);
  await page.goto("/work/opa");
  await expect(page.locator("h1")).toHaveText("Opa");
});

test("private areas require sign-in (or don't exist yet, in email-only mode)", async ({ request }) => {
  const emailOnly = !process.env.NEXT_PUBLIC_SUPABASE_URL;
  for (const path of ["/portal", "/admin", "/portal/projects/00000000-0000-4000-8000-000000000000"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    if (emailOnly) {
      expect(res.status(), path).toBe(404);
      continue;
    }
    expect([302, 303, 307], path).toContain(res.status());
    expect(res.headers().location, path).toContain("/login");
  }
  const file = await request.get("/api/files/00000000-0000-4000-8000-000000000000", { maxRedirects: 0 });
  expect(file.status()).toBe(401);
});
