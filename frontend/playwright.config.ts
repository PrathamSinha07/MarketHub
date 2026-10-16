import { defineConfig } from "@playwright/test";

/**
 * Browser QA for MarketHub.
 *
 * Both projects (desktop + mobile) run every file in `tests/`. The app must be
 * running before the suite starts:
 *   1. backend  : http://localhost:8080/api/v1  (Spring Boot on PostgreSQL)
 *   2. frontend : http://localhost:3000         (npm run start)
 *
 * Browsers use the locally installed Edge (`channel: "msedge"`), so no
 * browser download is required.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    channel: "msedge",
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: "mobile",
      use: { viewport: { width: 375, height: 667 } },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
