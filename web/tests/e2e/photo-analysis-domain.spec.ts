import { expect, test } from "@playwright/test";
import {
  analyzePhoto,
  buildDerivedPhotoAnalysis,
  buildHistogramBins,
  buildMetricRows,
  buildPointSelection,
  createPhotoAnalysisHandle,
  getSelectedSamples,
  normalizeSelectionToRoi,
  refineSelectionRegionFromHandle,
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

test("T-101(photo-analysis): 単色画像で主要ヒストグラムを生成できる", async () => {
  const imageData = createImageDataLike(8, 8, () => ({ r: 255, g: 0, b: 0 }));
  const result = analyzePhoto(imageData);

  expect(result.hueHistogram.length).toBeGreaterThan(0);
  expect(result.saturationHistogram.length).toBeGreaterThan(0);
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
  expect(second.cubePoints).toEqual(first.cubePoints);
});

test("T-203(photo-analysis): 単一 selection の coverage を指標表へ反映できる", async () => {
  const imageData = createImageDataLike(4, 4, (x) => {
    if (x < 2) {
      return { r: 255, g: 0, b: 0 };
    }
    return { r: 0, g: 0, b: 255 };
  });
  const result = analyzePhoto(imageData);
  const firstSample = result.samples[0];
  expect(firstSample).toBeDefined();

  const selection = buildPointSelection({
    result,
    targetId: "baseline",
    sampleId: firstSample!.sampleId,
    source: "image-point",
  });
  const selectionState: TargetSelectionState = {
    activeSelection: selection,
  };

  const scopedSamples = getSelectedSamples(result, selectionState);
  expect(scopedSamples).toHaveLength(1);

  const metricRows = buildMetricRows({
    result,
    selectionState,
  });
  const coverage = metricRows.find((row) => row.key === "selection_coverage_ratio");
  expect(coverage?.value).toBeCloseTo((1 / result.samples.length) * 100, 4);
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
  });
  const histogram = buildHistogramBins(result.samples, "luminance");

  const metricMarkdown = serializeMetricRows(metricRows, "markdown");
  const histogramMarkdown = serializeHistogramBins(histogram, "markdown");

  expect(metricMarkdown).toContain("| group | key | label | value | unit | description |");
  expect(metricMarkdown).toContain("l_mean");
  expect(histogramMarkdown).toContain("| metric | binIndex | start | end | count | ratio |");
  expect(histogramMarkdown).toContain("luminance");
});

test("T-206(photo-analysis): derived analysis が同期計算と同じ内容を返す", async () => {
  const imageData = createImageDataLike(8, 8, (x, y) => ({
    r: (x * 31) % 256,
    g: (y * 29) % 256,
    b: ((x + y) * 17) % 256,
  }));
  const result = analyzePhoto(imageData);
  const selection = buildPointSelection({
    result,
    targetId: "baseline",
    sampleId: result.samples[0]!.sampleId,
    source: "image-point",
  });
  const selectionState: TargetSelectionState = {
    activeSelection: selection,
  };

  const derived = buildDerivedPhotoAnalysis({
    result,
    selectionState,
  });

  expect(derived.metricRows).toEqual(
    buildMetricRows({
      result,
      selectionState,
    })
  );
  expect(derived.luminanceHistogram).toEqual(buildHistogramBins(result.samples, "luminance"));
  expect(derived.hueHistogram).toEqual(buildHistogramBins(result.samples, "hue"));
  expect(derived.saturationHistogram).toEqual(buildHistogramBins(result.samples, "saturation"));
  expect(derived.selectedSamples).toEqual(getSelectedSamples(result, selectionState));
  expect(derived.timings.totalMs).toBeGreaterThanOrEqual(0);
});

test("T-207(photo-analysis): point selection を ROI に正規化して詳細サンプルを再計算できる", async () => {
  const imageData = createImageDataLike(256, 256, (x, y) => ({
    r: x % 256,
    g: y % 256,
    b: ((x * 3 + y * 5) / 2) % 256,
  }));
  const handle = createPhotoAnalysisHandle({
    imageData,
    samplingPolicy: "fast",
  });
  const selection = buildPointSelection({
    result: handle.result,
    targetId: "roi",
    sampleId: handle.result.samples[0]!.sampleId,
    source: "image-point",
  });
  const selectionState: TargetSelectionState = {
    activeSelection: selection,
  };

  const roiBounds = normalizeSelectionToRoi({
    width: handle.result.width,
    height: handle.result.height,
    selectionState,
  });

  expect(roiBounds).not.toBeNull();

  const refinement = refineSelectionRegionFromHandle({
    handle,
    roiBounds: roiBounds!,
    samplingPolicy: "detail",
  });

  expect(refinement.roiBounds.width).toBeGreaterThan(1);
  expect(refinement.roiBounds.height).toBeGreaterThan(1);
  expect(refinement.selectedSamples.length).toBeGreaterThan(0);
  expect(refinement.selectedSamples.length).toBeLessThanOrEqual(
    refinement.roiBounds.width * refinement.roiBounds.height
  );
  expect(refinement.selectionCubePoints.length).toBeGreaterThan(0);
});

test("T-208(photo-analysis): sampling policy に応じて sampledPixels が増える", async () => {
  const imageData = createImageDataLike(1024, 1024, (x, y) => ({
    r: (x * 7) % 256,
    g: (y * 11) % 256,
    b: ((x + y) * 13) % 256,
  }));

  const fast = analyzePhoto(imageData, { samplingPolicy: "fast" });
  const balanced = analyzePhoto(imageData, { samplingPolicy: "balanced" });
  const detail = analyzePhoto(imageData, { samplingPolicy: "detail" });

  expect(fast.sampledPixels).toBeLessThanOrEqual(balanced.sampledPixels);
  expect(balanced.sampledPixels).toBeLessThanOrEqual(detail.sampledPixels);
});
