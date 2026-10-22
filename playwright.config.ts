import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// The web server command prepares a fresh database (tests/e2e/global-setup.ts) before building,
// so the server and the seed never open the same PGlite directory at the same time.
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, isMobile: false },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `npx tsx tests/e2e/global-setup.ts && npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      E2E: "1",
      SITE_URL: `http://localhost:${PORT}`,
      AUTH_SECRET: "e2e-auth-secret-that-is-long-enough-to-be-valid-000000",
      IP_HASH_SECRET: "e2e-ip-hash-secret",
      CRON_SECRET: "e2e-cron-secret",
      MAIL_FROM: "Moonlight Ride <ride@e2e.test>",
    },
  },
});
