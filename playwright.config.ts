import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests against a production build (`next start`). Uses the installed Google
 * Chrome, so no browser download is needed. Portal/admin tests need the dev Supabase
 * project in .env.local plus `npm run seed:content` and `npm run seed:dev -- --force`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome", headless: true },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
