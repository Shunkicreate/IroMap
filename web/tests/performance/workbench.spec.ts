import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { test } from "@playwright/test";

const runFile = promisify(execFile);

test("workbench stays within the performance budgets", async () => {
  try {
    const { stdout, stderr } = await runFile(
      process.execPath,
      [resolve("scripts/workbench-perf-benchmark.mjs")],
      {
        timeout: 540_000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          IROMAP_APP_URL: `http://127.0.0.1:${process.env.IROMAP_PERF_PORT ?? "3101"}/`,
          IROMAP_PERF_ITERATIONS: "10",
          IROMAP_PERF_WARMUP: "2",
          IROMAP_PERF_RELOAD_EVERY: "1",
          IROMAP_PERF_SIZES: "512x512,3840x2160",
          IROMAP_PERF_BUDGETS: resolve("scripts/workbench-perf-budgets.json"),
          IROMAP_PERF_REPORT: resolve("performance-results/results.json"),
        },
      }
    );
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    const output = error as Error & { stdout?: string; stderr?: string };
    console.error(output.stdout, output.stderr);
    throw error;
  }
});
