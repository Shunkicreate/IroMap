import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const appUrl = process.env.IROMAP_APP_URL ?? "http://127.0.0.1:3000/";
const outputDir = join(tmpdir(), "iromap-workbench-perf-images");
const iterations = Number.parseInt(process.env.IROMAP_PERF_ITERATIONS ?? "100", 10);
const reloadEvery = Number.parseInt(process.env.IROMAP_PERF_RELOAD_EVERY ?? "10", 10);
const allSizes = [
  { name: "512x512", width: 512, height: 512 },
  { name: "1024x1024", width: 1024, height: 1024 },
  { name: "2048x1536", width: 2048, height: 1536 },
  { name: "3840x2160", width: 3840, height: 2160 },
];
const selectedSizeNames = (process.env.IROMAP_PERF_SIZES ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const sizes =
  selectedSizeNames.length > 0
    ? allSizes.filter((size) => selectedSizeNames.includes(size.name))
    : allSizes;

const createGradientPng = async (width, height) => {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      data[offset] = (x * 13 + y * 7) % 256;
      data[offset + 1] = (x * 5 + y * 11) % 256;
      data[offset + 2] = (x * 17 + y * 3) % 256;
    }
  }

  return sharp(data, {
    raw: {
      width,
      height,
      channels: 3,
    },
  })
    .png()
    .toBuffer();
};

const saveFixture = async ({ name, width, height }) => {
  const buffer = await createGradientPng(width, height);
  const filePath = join(outputDir, `${name}.png`);
  await writeFile(filePath, buffer);
  return { buffer, filePath };
};

const readPerfEntries = async (page) => {
  return page.evaluate(() => window.__IROMAP_PERF__?.entries ?? []);
};

const summarize = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const total = values.reduce((sum, value) => sum + value, 0);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : (sorted[middle] ?? Number.NaN);

  return {
    avg: total / values.length,
    min: sorted[0] ?? Number.NaN,
    median,
    max: sorted.at(-1) ?? Number.NaN,
  };
};

const printTable = (rows) => {
  console.table(
    rows.map((row) => ({
      size: row.size,
      iterations: row.iterations,
      pixels: row.pixels.toLocaleString("en-US"),
      photoAvgMs: row.photoTotalMs.avg.toFixed(1),
      photoMedianMs: row.photoTotalMs.median.toFixed(1),
      decodeAvgMs: row.decodeMs.avg.toFixed(1),
      analyzeAvgMs: row.analyzeMs.avg.toFixed(1),
      sampledPixels: row.sampledPixels.toLocaleString("en-US"),
      derivedAvgMs: row.derivedTotalMs.avg.toFixed(1),
      derivedMedianMs: row.derivedTotalMs.median.toFixed(1),
      metricsAvgMs: row.metricsMs.avg.toFixed(1),
      filePath: row.filePath,
    }))
  );
};

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const results = [];
  for (const size of sizes) {
    const { buffer, filePath } = await saveFixture(size);
    const samples = {
      photoTotalMs: [],
      decodeMs: [],
      analyzeMs: [],
      sampledPixels: [],
      derivedTotalMs: [],
      derivedWorkerMs: [],
      metricsMs: [],
    };

    for (let index = 0; index < iterations; index += 1) {
      if (index === 0 || index % reloadEvery === 0) {
        await page.goto(appUrl);
      }

      await page.evaluate(() => {
        window.__IROMAP_PERF__ = { entries: [] };
      });

      await page.getByLabel("画像をアップロード").setInputFiles({
        name: `${size.name}.png`,
        mimeType: "image/png",
        buffer,
      });

      await page.waitForFunction(
        () =>
          (window.__IROMAP_PERF__?.entries ?? []).some(
            (entry) => entry.name === "workbench.photo-analysis.total"
          ),
        { timeout: 30000 }
      );
      await page.waitForFunction(
        () =>
          (window.__IROMAP_PERF__?.entries ?? []).some(
            (entry) => entry.name === "workbench.derived-analysis.total"
          ),
        { timeout: 30000 }
      );

      const entries = await readPerfEntries(page);
      const photo = entries.find((entry) => entry.name === "workbench.photo-analysis.total");
      const derived = entries.find((entry) => entry.name === "workbench.derived-analysis.total");

      if (!photo || !derived) {
        throw new Error(`Missing perf entries for ${size.name} at iteration ${index + 1}`);
      }

      samples.photoTotalMs.push(photo.durationMs);
      samples.decodeMs.push(Number(photo.detail?.decodeMs ?? Number.NaN));
      samples.analyzeMs.push(Number(photo.detail?.analyzeMs ?? Number.NaN));
      samples.sampledPixels.push(Number(photo.detail?.sampledPixels ?? Number.NaN));
      samples.derivedTotalMs.push(derived.durationMs);
      samples.derivedWorkerMs.push(Number(derived.detail?.totalMs ?? Number.NaN));
      samples.metricsMs.push(Number(derived.detail?.metricsMs ?? Number.NaN));
    }

    results.push({
      size: size.name,
      iterations,
      pixels: size.width * size.height,
      photoTotalMs: summarize(samples.photoTotalMs),
      decodeMs: summarize(samples.decodeMs),
      analyzeMs: summarize(samples.analyzeMs),
      sampledPixels: Math.round(
        samples.sampledPixels.reduce((sum, value) => sum + value, 0) / samples.sampledPixels.length
      ),
      derivedTotalMs: summarize(samples.derivedTotalMs),
      derivedWorkerMs: summarize(samples.derivedWorkerMs),
      metricsMs: summarize(samples.metricsMs),
      filePath,
    });

    console.log(
      `[perf] completed ${size.name} (${iterations} runs) avg photo=${results.at(-1).photoTotalMs.avg.toFixed(1)}ms avg derived=${results.at(-1).derivedTotalMs.avg.toFixed(1)}ms`
    );
  }

  printTable(results);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
