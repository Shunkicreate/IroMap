import { defineConfig, devices } from "@playwright/test";

const hasExternalBaseUrl = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const isCI = Boolean(process.env.CI);
const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "3100";
const localBaseUrl = `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? localBaseUrl,
    trace: "on-first-retry",
  },
  webServer: hasExternalBaseUrl
    ? undefined
    : {
        command: `pnpm exec next dev --hostname 127.0.0.1 --port ${playwrightPort}`,
        url: localBaseUrl,
        timeout: 120_000,
        reuseExistingServer: !isCI,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
