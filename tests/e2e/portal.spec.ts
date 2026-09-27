import { expect, test } from "@playwright/test";

/**
 * Needs the dev database: `npm run seed:content && npm run seed:dev -- --force`.
 * Uses the labelled [DEV] fixture accounts created by scripts/seed-dev.ts.
 */
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const PASSWORD = process.env.DEV_CLIENT_PASSWORD ?? "DevOnly-Passw0rd!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/portal/);
}

test.describe("client portal", () => {
  test.skip(!configured, "Supabase not configured");

  test("a client sees only their own project and can't open the admin area", async ({ page }) => {
    await login(page, "dev-client-a@example.test");
    await expect(page.getByRole("link", { name: /\[DEV\] Project A/ })).toBeVisible();
    await expect(page.getByText("[DEV] Project B")).toHaveCount(0);
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
  });

  test("another client's project URL is a 404", async ({ page, request }) => {
    await login(page, "dev-client-b@example.test");
    const href = await page.getByRole("link", { name: /\[DEV\] Project B/ }).getAttribute("href");
    await page.goto("/auth/signout", { waitUntil: "commit" }).catch(() => {});
    await page.context().clearCookies();
    await login(page, "dev-client-a@example.test");
    const res = await page.goto(href!);
    expect(res?.status()).toBe(404);
    void request;
  });
});
