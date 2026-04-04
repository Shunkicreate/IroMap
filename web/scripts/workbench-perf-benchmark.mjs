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
const debugPerf = process.env.IROMAP_PERF_DEBUG === "1";

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

const clearPerfEntries = async (page) => {
  await page.evaluate(() => {
    window.__IROMAP_PERF__ = { entries: [] };
  });
};

const waitForPerfEntry = async (page, name, selectionSource) => {
  await page.waitForFunction(
    ({ targetName, targetSelectionSource }) =>
      (window.__IROMAP_PERF__?.entries ?? []).some(
        (entry) =>
          entry.name === targetName &&
          (targetSelectionSource == null ||
            (entry.detail?.selectionSource ?? "none") === targetSelectionSource)
      ),
    { targetName: name, targetSelectionSource: selectionSource },
    { timeout: 30000 }
  );
};

const waitForPerfEntryCount = async (page, name, count = 1) => {
  await page.waitForFunction(
    ({ targetName, targetCount }) =>
      (window.__IROMAP_PERF__?.entries ?? []).filter((entry) => entry.name === targetName).length >=
      targetCount,
    { targetName: name, targetCount: count },
    { timeout: 30000 }
  );
};

const findPerfEntry = (entries, name, selectionSource) => {
  return entries.find(
    (entry) =>
      entry.name === name &&
      (selectionSource == null || (entry.detail?.selectionSource ?? "none") === selectionSource)
  );
};

const debugEntries = (label, entries) => {
  if (!debugPerf) {
    return;
  }
  console.log(
    `[perf:debug] ${label}`,
    JSON.stringify(
      entries.map((entry) => ({
        name: entry.name,
        selectionSource: entry.detail?.selectionSource ?? "none",
        detail: entry.detail,
      })),
      null,
      2
    )
  );
};

const getPreviewImage = (page) => {
  const previewPanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "選択画像" }),
  });
  return previewPanel.locator("img").first();
};

const getPreviewStage = (page) => {
  const previewPanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "選択画像" }),
  });
  return previewPanel.locator('[class*="imageStage"]').first();
};

const runPreviewPointSelection = async (page) => {
  const previewImage = getPreviewImage(page);
  await previewImage.waitFor({ state: "visible" });
  const box = await previewImage.boundingBox();
  if (!box) {
    throw new Error("Missing preview image bounds");
  }
  await previewImage.click({
    position: {
      x: box.width * 0.3,
      y: box.height * 0.3,
    },
  });
};

const runPreviewRectangleSelection = async (page) => {
  const previewStage = getPreviewStage(page);
  await previewStage.waitFor({ state: "visible" });
  await previewStage.evaluate(async (element) => {
    const bounds = element.getBoundingClientRect();
    const startX = bounds.left + bounds.width * 0.2;
    const startY = bounds.top + bounds.height * 0.2;
    const endX = bounds.left + bounds.width * 0.6;
    const endY = bounds.top + bounds.height * 0.6;
    const init = (clientX, clientY) => ({
      bubbles: true,
      pointerId: 1,
      pointerType: "mouse",
      clientX,
      clientY,
    });

    element.dispatchEvent(new PointerEvent("pointerdown", init(startX, startY)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    element.dispatchEvent(new PointerEvent("pointermove", init(endX, endY)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    element.dispatchEvent(new PointerEvent("pointerup", init(endX, endY)));
  });
};

const summarize = (values) => {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (finiteValues.length === 0) {
    return {
      avg: Number.NaN,
      min: Number.NaN,
      median: Number.NaN,
      max: Number.NaN,
    };
  }
  const sorted = [...finiteValues].sort((left, right) => left - right);
  const total = finiteValues.reduce((sum, value) => sum + value, 0);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : (sorted[middle] ?? Number.NaN);

  return {
    avg: total / finiteValues.length,
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
      pointDerivedAvgMs: row.pointDerivedTotalMs.avg.toFixed(1),
      pointDerivedWorkerAvgMs: row.pointDerivedWorkerMs.avg.toFixed(1),
      pointSelectionRegistrationAvgMs: row.pointSelectionRegistrationMs.avg.toFixed(1),
      pointSelectionProjectionAvgMs: row.pointSelectionProjectionMs.avg.toFixed(1),
      pointSelectedSamplesAvgMs: row.pointSelectedSamplesMs.avg.toFixed(1),
      rectDerivedAvgMs: row.rectDerivedTotalMs.avg.toFixed(1),
      rectDerivedWorkerAvgMs: row.rectDerivedWorkerMs.avg.toFixed(1),
      rectSelectionRegistrationAvgMs: row.rectSelectionRegistrationMs.avg.toFixed(1),
      rectSelectionProjectionAvgMs: row.rectSelectionProjectionMs.avg.toFixed(1),
      rectSelectedSamplesAvgMs: row.rectSelectedSamplesMs.avg.toFixed(1),
      metricsAvgMs: row.metricsMs.avg.toFixed(1),
      pointCubePointsAvgMs: row.pointCubePointsMs.avg.toFixed(1),
      rectCubePointsAvgMs: row.rectCubePointsMs.avg.toFixed(1),
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
      pointDerivedTotalMs: [],
      pointDerivedWorkerMs: [],
      pointSelectionMs: [],
      pointSelectionRegistrationMs: [],
      pointSelectionProjectionMs: [],
      pointSelectedSamplesMs: [],
      pointCubePointsMs: [],
      rectDerivedTotalMs: [],
      rectDerivedWorkerMs: [],
      rectSelectionMs: [],
      rectSelectionRegistrationMs: [],
      rectSelectionProjectionMs: [],
      rectSelectedSamplesMs: [],
      rectCubePointsMs: [],
    };

    for (let index = 0; index < iterations; index += 1) {
      if (index === 0 || index % reloadEvery === 0) {
        await page.goto(appUrl);
      }

      await clearPerfEntries(page);

      await page.getByLabel("画像をアップロード").setInputFiles({
        name: `${size.name}.png`,
        mimeType: "image/png",
        buffer,
      });

      await waitForPerfEntry(page, "workbench.photo-analysis.total");
      await waitForPerfEntry(page, "workbench.derived-analysis.total");

      const entries = await readPerfEntries(page);
      const photo = findPerfEntry(entries, "workbench.photo-analysis.total");
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

      await clearPerfEntries(page);
      await runPreviewPointSelection(page);
      await waitForPerfEntryCount(page, "workbench.derived-analysis.total", 1);
      const pointEntries = await readPerfEntries(page);
      debugEntries(`point:${size.name}:${index + 1}`, pointEntries);
      const pointDerived =
        findPerfEntry(pointEntries, "workbench.derived-analysis.total", "image-point") ??
        pointEntries.filter((entry) => entry.name === "workbench.derived-analysis.total").at(-1);
      if (!pointDerived) {
        throw new Error(
          `Missing point selection perf entry for ${size.name} at iteration ${index + 1}`
        );
      }
      samples.pointDerivedTotalMs.push(pointDerived.durationMs);
      samples.pointDerivedWorkerMs.push(Number(pointDerived.detail?.totalMs ?? Number.NaN));
      samples.pointSelectionMs.push(Number(pointDerived.detail?.selectionMs ?? Number.NaN));
      samples.pointSelectionRegistrationMs.push(
        Number(pointDerived.detail?.selectionRegistrationMs ?? Number.NaN)
      );
      samples.pointSelectionProjectionMs.push(
        Number(pointDerived.detail?.selectionProjectionMs ?? Number.NaN)
      );
      samples.pointSelectedSamplesMs.push(
        Number(pointDerived.detail?.selectedSamplesMs ?? Number.NaN)
      );
      samples.pointCubePointsMs.push(Number(pointDerived.detail?.cubePointsMs ?? Number.NaN));

      await clearPerfEntries(page);
      await runPreviewRectangleSelection(page);
      await waitForPerfEntryCount(page, "workbench.derived-analysis.total", 1);
      const rectEntries = await readPerfEntries(page);
      debugEntries(`rect:${size.name}:${index + 1}`, rectEntries);
      const rectDerived =
        findPerfEntry(rectEntries, "workbench.derived-analysis.total", "image-rect") ??
        rectEntries.filter((entry) => entry.name === "workbench.derived-analysis.total").at(-1);
      if (!rectDerived) {
        throw new Error(
          `Missing rectangle selection perf entry for ${size.name} at iteration ${index + 1}`
        );
      }
      samples.rectDerivedTotalMs.push(rectDerived.durationMs);
      samples.rectDerivedWorkerMs.push(Number(rectDerived.detail?.totalMs ?? Number.NaN));
      samples.rectSelectionMs.push(Number(rectDerived.detail?.selectionMs ?? Number.NaN));
      samples.rectSelectionRegistrationMs.push(
        Number(rectDerived.detail?.selectionRegistrationMs ?? Number.NaN)
      );
      samples.rectSelectionProjectionMs.push(
        Number(rectDerived.detail?.selectionProjectionMs ?? Number.NaN)
      );
      samples.rectSelectedSamplesMs.push(
        Number(rectDerived.detail?.selectedSamplesMs ?? Number.NaN)
      );
      samples.rectCubePointsMs.push(Number(rectDerived.detail?.cubePointsMs ?? Number.NaN));
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
      pointDerivedTotalMs: summarize(samples.pointDerivedTotalMs),
      pointDerivedWorkerMs: summarize(samples.pointDerivedWorkerMs),
      pointSelectionMs: summarize(samples.pointSelectionMs),
      pointSelectionRegistrationMs: summarize(samples.pointSelectionRegistrationMs),
      pointSelectionProjectionMs: summarize(samples.pointSelectionProjectionMs),
      pointSelectedSamplesMs: summarize(samples.pointSelectedSamplesMs),
      pointCubePointsMs: summarize(samples.pointCubePointsMs),
      rectDerivedTotalMs: summarize(samples.rectDerivedTotalMs),
      rectDerivedWorkerMs: summarize(samples.rectDerivedWorkerMs),
      rectSelectionMs: summarize(samples.rectSelectionMs),
      rectSelectionRegistrationMs: summarize(samples.rectSelectionRegistrationMs),
      rectSelectionProjectionMs: summarize(samples.rectSelectionProjectionMs),
      rectSelectedSamplesMs: summarize(samples.rectSelectedSamplesMs),
      rectCubePointsMs: summarize(samples.rectCubePointsMs),
      filePath,
    });

    console.log(
      `[perf] completed ${size.name} (${iterations} runs) avg photo=${results.at(-1).photoTotalMs.avg.toFixed(1)}ms avg derived=${results.at(-1).derivedTotalMs.avg.toFixed(1)}ms avg point=${results.at(-1).pointDerivedTotalMs.avg.toFixed(1)}ms avg rect=${results.at(-1).rectDerivedTotalMs.avg.toFixed(1)}ms`
    );
  }

  printTable(results);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
