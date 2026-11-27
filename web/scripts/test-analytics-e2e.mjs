import { spawnSync } from "node:child_process";

// Always build with a synthetic ID; tests block every Google Analytics request.
const env = { ...process.env, NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ANALYTICSTEST" };
for (const args of [
  ["node_modules/next/dist/bin/next", "build"],
  ["node_modules/@playwright/test/cli.js", "test", "--config", "playwright.analytics.config.ts"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
