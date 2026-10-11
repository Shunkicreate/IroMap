import { defineConfig } from "@playwright/test";

const perfPort = process.env.IROMAP_PERF_PORT ?? "3101";

export default defineConfig({
  testDir: "./tests/performance",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 600_000,
  reporter: "list",
  outputDir: "performance-results/playwright",
  webServer: {
    command: `pnpm exec next start --hostname 127.0.0.1 --port ${perfPort}`,
    url: `http://127.0.0.1:${perfPort}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
