import { expect, test } from "@playwright/test";
import {
  analyzePhoto,
  buildHistogramBins,
  buildMetricRows,
  buildPointSelection,
  getScopedSamples,
  serializeHistogramBins,
  serializeMetricRows,
  type TargetSelectionState,
} from "@/domain/photo-analysis/photo-analysis";

const createImageDataLike = (
  width: number,
  height: number,
  fill: (x: number, y: number) => { r: number; g: number; b: number; a?: number }
): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const color = fill(x, y);
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = color.a ?? 255;
    }
  }
  return { data, width, height, colorSpace: "srgb" } as ImageData;
};

test("T-101(photo-analysis): 単色画像でLab scatter表示を確認", async () => {
  const imageData = createImageDataLike(8, 8, () => ({ r: 255, g: 0, b: 0 }));
  const result = analyzePhoto(imageData);

  expect(result.scatter.length).toBeGreaterThan(0);
});

test("T-102(photo-analysis): 色相が偏った画像でHue histogramを確認", async () => {
  const imageData = createImageDataLike(8, 8, () => ({ r: 255, g: 0, b: 0 }));
  const result = analyzePhoto(imageData);

  const activeHueBins = result.hueHistogram.filter((bin) => bin.count > 0);
  expect(activeHueBins.length).toBe(1);
});

test("T-103(photo-analysis): 低彩度画像でSaturation histogramを確認", async () => {
  const imageData = createImageDataLike(8, 8, () => ({ r: 128, g: 128, b: 128 }));
  const result = analyzePhoto(imageData);

  const firstBinCount = result.saturationHistogram[0]?.count ?? 0;
  expect(firstBinCount).toBeGreaterThan(0);
});

test("T-104(photo-analysis): 主要色比率の合計が100%になることを確認", async () => {
  const imageData = createImageDataLike(8, 8, (x) => {
    if (x < 4) {
      return { r: 255, g: 0, b: 0 };
    }
    return { r: 0, g: 255, b: 0 };
  });
  const result = analyzePhoto(imageData);

  const ratioSum = result.colorAreas.reduce((acc, area) => acc + area.ratio, 0);
  expect(ratioSum).toBeCloseTo(100, 1);
});

test("T-201(photo-analysis): 画像サイズごとの分析処理時間を確認", async () => {
  const imageData = createImageDataLike(256, 256, (x, y) => {
    return { r: (x * 3) % 256, g: (y * 5) % 256, b: ((x + y) * 7) % 256 };
  });
  const result = analyzePhoto(imageData);

  expect(result.sampledPixels).toBeGreaterThan(0);
  expect(result.elapsedMs).toBeLessThan(500);
});

test("T-202(photo-analysis): 同一入力で再分析結果が一致する", async () => {
  const imageData = createImageDataLike(64, 64, (x, y) => {
    return { r: (x * 9) % 256, g: (y * 11) % 256, b: (x * y + 13) % 256 };
  });

  const first = analyzePhoto(imageData);
  const second = analyzePhoto(imageData);

  expect(second.hueHistogram).toEqual(first.hueHistogram);
  expect(second.saturationHistogram).toEqual(first.saturationHistogram);
  expect(second.colorAreas).toEqual(first.colorAreas);
  expect(second.scatter).toEqual(first.scatter);
});

test("T-203(photo-analysis): selected-region scope で選択サンプルだけ再集計できる", async () => {
  const imageData = createImageDataLike(4, 4, (x) => {
    if (x < 2) {
      return { r: 255, g: 0, b: 0 };
    }
    return { r: 0, g: 0, b: 255 };
  });
  const result = analyzePhoto(imageData);
  const firstSample = result.samples[0];
  expect(firstSample).toBeDefined();

  const selectionA = buildPointSelection({
    result,
    targetId: "baseline",
    slot: "A",
    sampleId: firstSample!.sampleId,
    source: "image-point",
  });
  const selectionState: TargetSelectionState = {
    activeSelectionSlot: "A",
    selectionA,
    selectionB: null,
  };

  const scopedSamples = getScopedSamples(result, selectionState, "selected-region");
  expect(scopedSamples).toHaveLength(1);

  const metricRows = buildMetricRows({
    result,
    selectionState,
    scope: "selected-region",
  });
  const coverage = metricRows.find((row) => row.key === "selection_coverage_ratio");
  expect(coverage?.value).toBeCloseTo((1 / result.samples.length) * 100, 4);
});

test("T-204(photo-analysis): selection A/B の平均Lab差から ΔE を算出できる", async () => {
  const imageData = createImageDataLike(2, 1, (x) =>
    x === 0 ? { r: 255, g: 0, b: 0 } : { r: 0, g: 255, b: 0 }
  );
  const result = analyzePhoto(imageData);
  const left = result.samples[0];
  const right = result.samples[1];
  expect(left).toBeDefined();
  expect(right).toBeDefined();

  const selectionState: TargetSelectionState = {
    activeSelectionSlot: "A",
    selectionA: buildPointSelection({
      result,
      targetId: "baseline",
      slot: "A",
      sampleId: left!.sampleId,
      source: "image-point",
    }),
    selectionB: buildPointSelection({
      result,
      targetId: "baseline",
      slot: "B",
      sampleId: right!.sampleId,
      source: "image-point",
    }),
  };

  const metricRows = buildMetricRows({
    result,
    selectionState,
    scope: "full-image",
  });
  const deltaE = metricRows.find((row) => row.key === "selection_a_b_delta_e");
  expect(deltaE?.value).not.toBeNull();
  expect(deltaE?.value).toBeGreaterThan(0);
});

test("T-205(photo-analysis): metric table と histogram を Markdown 形式で export できる", async () => {
  const imageData = createImageDataLike(4, 4, (x, y) => ({
    r: x * 50,
    g: y * 50,
    b: (x + y) * 20,
  }));
  const result = analyzePhoto(imageData);
  const metricRows = buildMetricRows({
    result,
    selectionState: null,
    scope: "full-image",
  });
  const histogram = buildHistogramBins(result.samples, "luminance");

  const metricMarkdown = serializeMetricRows(metricRows, "markdown");
  const histogramMarkdown = serializeHistogramBins(histogram, "markdown");

  expect(metricMarkdown).toContain("| group | key | label | value | unit | delta | description |");
  expect(metricMarkdown).toContain("l_mean");
  expect(histogramMarkdown).toContain("| metric | binIndex | start | end | count | ratio |");
  expect(histogramMarkdown).toContain("luminance");
});
