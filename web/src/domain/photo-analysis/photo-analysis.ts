import {
  labToChroma,
  rgbToHsl,
  rgbToHueAndSaturation,
  rgbToLab,
} from "@/domain/color/color-conversion";
import { colorChannelMax } from "@/domain/color/color-constants";
import {
  toRgbColor,
  type HslColor,
  type LabColor,
  type RgbColor,
} from "@/domain/color/color-types";

export type PhotoSample = {
  sampleId: number;
  x: number;
  y: number;
  color: RgbColor;
  hsl: HslColor;
  lab: LabColor;
  chroma: number;
};

export type HistogramBin = {
  start: number;
  end: number;
  count: number;
};

export type WorkbenchHistogramMetric = "luminance" | "hue" | "saturation" | "chroma";

export type WorkbenchHistogramBin = {
  metric: WorkbenchHistogramMetric;
  binIndex: number;
  start: number;
  end: number;
  count: number;
  ratio: number;
};

export type ColorArea = {
  label: string;
  ratio: number;
  rgb: RgbColor;
};

export type RgbCubePoint = {
  color: RgbColor;
  count: number;
  ratio: number;
};

export type SelectionScope = "full-image" | "selected-region";
export type ExportFormat = "markdown" | "csv" | "tsv";

export type PhotoSelection = {
  selectionId: string;
  targetId: string;
  source: "image-rect" | "image-point" | "color-space-pick" | "slice-pick";
  sampleIds: number[];
  sampleCount: number;
  coverageRatio: number;
  bounds?: { x: number; y: number; width: number; height: number };
};

export type TargetSelectionState = {
  activeSelection: PhotoSelection | null;
};

export type WorkbenchMetricKey =
  | "l_mean"
  | "l_stddev"
  | "l_p95"
  | "a_mean"
  | "b_mean"
  | "c_mean"
  | "c_p95"
  | "neutral_distance_mean"
  | "highlight_b_mean"
  | "highlight_neutral_distance_mean"
  | "selection_coverage_ratio";

export type WorkbenchMetricRow = {
  group: string;
  key: WorkbenchMetricKey;
  label: string;
  value: number | null;
  unit: string;
  precision: number;
  description: string;
  delta: number | null;
};

export type PhotoAnalysisResult = {
  hueHistogram: HistogramBin[];
  saturationHistogram: HistogramBin[];
  colorAreas: ColorArea[];
  cubePoints: RgbCubePoint[];
  samples: PhotoSample[];
  width: number;
  height: number;
  elapsedMs: number;
  sampledPixels: number;
};

export type PhotoAnalysisSummary = {
  avgBrightness: number;
  avgSaturation: number;
  brightnessSpread: number;
  temperatureBias: "warm" | "cool" | "neutral";
  shadowColorBias: "warm" | "cool" | "neutral";
  highlightColorBias: "warm" | "cool" | "neutral";
};

type MetricSummary = {
  lMean: number | null;
  lStddev: number | null;
  lP95: number | null;
  aMean: number | null;
  bMean: number | null;
  cMean: number | null;
  cP95: number | null;
  highlightBMean: number | null;
  highlightNeutralDistanceMean: number | null;
  meanLab: LabColor | null;
};

const hueBinCount = 36;
const hueMax = 360;
const saturationBinCount = 20;
const topAreaCount = 5;
const quantizeBucketSize = 16;
const performanceSamplingThreshold = 100_000;
const maxSampleCount = 200_000;
const maxCubePointCount = 3500;
const rgbaStride = 4;
const alphaChannelOffset = 3;
const noAlpha = 0;
const ratioPercent = 100;
const ratioTolerance = 99.9;
const othersColorValue = 96;
const hueBucketDegrees = 10;
const minimumUnit = 1;
const luminanceBinCount = 20;
const luminanceMax = 100;
const chromaBinCount = 20;
const chromaMax = 150;
const highlightThreshold = 80;

const metricDefinitions: Array<{
  group: string;
  key: WorkbenchMetricKey;
  label: string;
  unit: string;
  precision: number;
  description: string;
}> = [
  {
    group: "明度",
    key: "l_mean",
    label: "L* mean",
    unit: "",
    precision: 2,
    description: "全体の明るさ",
  },
  {
    group: "明度",
    key: "l_stddev",
    label: "L* stddev",
    unit: "",
    precision: 2,
    description: "明暗差の大きさ",
  },
  {
    group: "明度",
    key: "l_p95",
    label: "L* p95",
    unit: "",
    precision: 2,
    description: "ハイライトの強さ",
  },
  {
    group: "色被り",
    key: "a_mean",
    label: "a* mean",
    unit: "",
    precision: 2,
    description: "緑↔赤方向の偏り",
  },
  {
    group: "色被り",
    key: "b_mean",
    label: "b* mean",
    unit: "",
    precision: 2,
    description: "青↔黄方向の偏り",
  },
  {
    group: "彩度",
    key: "c_mean",
    label: "C* mean",
    unit: "",
    precision: 2,
    description: "全体の色づき",
  },
  {
    group: "彩度",
    key: "c_p95",
    label: "C* p95",
    unit: "",
    precision: 2,
    description: "一部の強い色",
  },
  {
    group: "中立",
    key: "neutral_distance_mean",
    label: "Neutral Distance mean",
    unit: "",
    precision: 2,
    description: "中立からの離れ",
  },
  {
    group: "白",
    key: "highlight_b_mean",
    label: "Highlight b* mean",
    unit: "",
    precision: 2,
    description: "白の黄ばみ / 青み",
  },
  {
    group: "白",
    key: "highlight_neutral_distance_mean",
    label: "Highlight Neutral Distance mean",
    unit: "",
    precision: 2,
    description: "白の清潔感",
  },
  {
    group: "補助情報",
    key: "selection_coverage_ratio",
    label: "Selection coverage ratio",
    unit: "%",
    precision: 2,
    description: "選択領域の占有率",
  },
];

const createBins = (binCount: number, maxValue: number): HistogramBin[] => {
  const binSize = maxValue / binCount;
  return Array.from({ length: binCount }, (_, index) => ({
    start: index * binSize,
    end: (index + 1) * binSize,
    count: 0,
  }));
};

const quantizeComponent = (value: number): number => {
  return Math.floor(value / quantizeBucketSize) * quantizeBucketSize;
};

const buildAreaLabel = (color: RgbColor): string => {
  return `R${color.r}-G${color.g}-B${color.b}`;
};

const pickSamplingStep = (pixelCount: number): number => {
  if (pixelCount <= performanceSamplingThreshold) {
    return minimumUnit;
  }
  return Math.ceil(Math.sqrt(pixelCount / performanceSamplingThreshold));
};

const samplePixels = (imageData: ImageData, step: number, maxSamples: number): PhotoSample[] => {
  const { data, width, height } = imageData;
  const sampled: PhotoSample[] = [];
  let sampleId = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (sampled.length >= maxSamples) {
        return sampled;
      }

      const offset = (y * width + x) * rgbaStride;
      const alpha = data[offset + alphaChannelOffset] / colorChannelMax;
      if (alpha === noAlpha) {
        continue;
      }

      const color = toRgbColor(data[offset], data[offset + 1], data[offset + 2]);
      const hsl = rgbToHsl(color);
      const lab = rgbToLab(color);

      sampled.push({
        sampleId,
        x,
        y,
        color,
        hsl,
        lab,
        chroma: labToChroma(lab),
      });
      sampleId += 1;
    }
  }

  return sampled;
};

const fillHistograms = (
  samples: PhotoSample[]
): {
  hue: HistogramBin[];
  saturation: HistogramBin[];
} => {
  const hueBins = createBins(hueBinCount, hueMax);
  const saturationBins = createBins(saturationBinCount, minimumUnit);

  for (const sample of samples) {
    const { hue, saturation } = rgbToHueAndSaturation(sample.color);
    const hueIndex = Math.min(hueBinCount - 1, Math.floor(hue / hueBucketDegrees));
    const saturationIndex = Math.min(
      saturationBinCount - 1,
      Math.floor(saturation * saturationBinCount)
    );

    hueBins[hueIndex].count += minimumUnit;
    saturationBins[saturationIndex].count += minimumUnit;
  }

  return {
    hue: hueBins,
    saturation: saturationBins,
  };
};

const calculateColorAreas = (samples: PhotoSample[]): ColorArea[] => {
  const bucketCounts = new Map<string, number>();

  for (const sample of samples) {
    const bucketColor = toRgbColor(
      quantizeComponent(sample.color.r),
      quantizeComponent(sample.color.g),
      quantizeComponent(sample.color.b)
    );
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    const count = bucketCounts.get(key) ?? 0;
    bucketCounts.set(key, count + 1);
  }

  const sorted = [...bucketCounts.entries()].sort((left, right) => right[1] - left[1]);
  const total = samples.length || minimumUnit;

  const top = sorted.slice(0, topAreaCount).map(([key, count]) => {
    const [rText, gText, bText] = key.split("-");
    const rgb = toRgbColor(Number(rText), Number(gText), Number(bText));

    return {
      label: buildAreaLabel(rgb),
      ratio: (count / total) * ratioPercent,
      rgb,
    };
  });

  const summed = top.reduce((current, area) => current + area.ratio, 0);
  if (summed < ratioTolerance && sorted.length > topAreaCount) {
    top.push({
      label: "others",
      ratio: ratioPercent - summed,
      rgb: toRgbColor(othersColorValue, othersColorValue, othersColorValue),
    });
  }

  return top;
};

const buildRgbCubePointsCore = (samples: PhotoSample[], maxPoints: number): RgbCubePoint[] => {
  const bucketCounts = new Map<string, number>();

  for (const sample of samples) {
    const bucketColor = toRgbColor(
      quantizeComponent(sample.color.r),
      quantizeComponent(sample.color.g),
      quantizeComponent(sample.color.b)
    );
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  }

  const sorted = [...bucketCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, maxPoints);
  const total = samples.length || minimumUnit;

  return sorted.map(([key, count]) => {
    const [rText, gText, bText] = key.split("-");
    return {
      color: toRgbColor(Number(rText), Number(gText), Number(bText)),
      count,
      ratio: count / total,
    };
  });
};

const mean = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const standardDeviation = (values: number[]): number | null => {
  const avg = mean(values);
  if (avg == null) {
    return null;
  }
  const variance =
    values.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) / values.length;
  return Math.sqrt(variance);
};

const percentile = (values: number[], ratio: number): number | null => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index] ?? null;
};

const selectMetricValue = (sample: PhotoSample, metric: WorkbenchHistogramMetric): number => {
  if (metric === "luminance") {
    return sample.lab.l;
  }
  if (metric === "hue") {
    return sample.hsl.h;
  }
  if (metric === "saturation") {
    return sample.hsl.s / ratioPercent;
  }
  return sample.chroma;
};

const getHistogramDefinition = (
  metric: WorkbenchHistogramMetric
): { binCount: number; max: number } => {
  if (metric === "luminance") {
    return { binCount: luminanceBinCount, max: luminanceMax };
  }
  if (metric === "hue") {
    return { binCount: hueBinCount, max: hueMax };
  }
  if (metric === "saturation") {
    return { binCount: saturationBinCount, max: minimumUnit };
  }
  return { binCount: chromaBinCount, max: chromaMax };
};

const buildMetricSummary = (samples: PhotoSample[]): MetricSummary => {
  const lValues = samples.map((sample) => sample.lab.l);
  const aValues = samples.map((sample) => sample.lab.a);
  const bValues = samples.map((sample) => sample.lab.b);
  const cValues = samples.map((sample) => sample.chroma);
  const highlightSamples = samples.filter((sample) => sample.lab.l > highlightThreshold);

  const lMean = mean(lValues);
  const aMean = mean(aValues);
  const bMean = mean(bValues);

  return {
    lMean,
    lStddev: standardDeviation(lValues),
    lP95: percentile(lValues, 0.95),
    aMean,
    bMean,
    cMean: mean(cValues),
    cP95: percentile(cValues, 0.95),
    highlightBMean: mean(highlightSamples.map((sample) => sample.lab.b)),
    highlightNeutralDistanceMean: mean(highlightSamples.map((sample) => sample.chroma)),
    meanLab:
      lMean == null || aMean == null || bMean == null ? null : { l: lMean, a: aMean, b: bMean },
  };
};

const getSelectionIds = (selection: PhotoSelection | null | undefined): Set<number> | null => {
  if (!selection || selection.sampleIds.length === 0) {
    return null;
  }
  return new Set(selection.sampleIds);
};

export const getScopedSamples = (
  result: PhotoAnalysisResult,
  selectionState: TargetSelectionState | null | undefined,
  scope: SelectionScope
): PhotoSample[] => {
  if (scope === "full-image") {
    return result.samples;
  }
  const selection = selectionState?.activeSelection ?? null;
  const ids = getSelectionIds(selection);
  if (!ids) {
    return [];
  }
  return result.samples.filter((sample) => ids.has(sample.sampleId));
};

export const buildRectangleSelection = ({
  result,
  targetId,
  bounds,
}: {
  result: PhotoAnalysisResult;
  targetId: string;
  bounds: { x: number; y: number; width: number; height: number };
}): PhotoSelection => {
  const minX = Math.min(bounds.x, bounds.x + bounds.width);
  const maxX = Math.max(bounds.x, bounds.x + bounds.width);
  const minY = Math.min(bounds.y, bounds.y + bounds.height);
  const maxY = Math.max(bounds.y, bounds.y + bounds.height);
  const sampleIds = result.samples
    .filter(
      (sample) => sample.x >= minX && sample.x <= maxX && sample.y >= minY && sample.y <= maxY
    )
    .map((sample) => sample.sampleId);

  return {
    selectionId: `${targetId}-${minX}-${minY}-${maxX}-${maxY}`,
    targetId,
    source: "image-rect",
    sampleIds,
    sampleCount: sampleIds.length,
    coverageRatio: result.samples.length === 0 ? 0 : sampleIds.length / result.samples.length,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
};

export const buildPointSelection = ({
  result,
  targetId,
  sampleId,
  source,
}: {
  result: PhotoAnalysisResult;
  targetId: string;
  sampleId: number;
  source: PhotoSelection["source"];
}): PhotoSelection => {
  const sample = result.samples.find((item) => item.sampleId === sampleId);
  return {
    selectionId: `${targetId}-${sampleId}`,
    targetId,
    source,
    sampleIds: sample ? [sampleId] : [],
    sampleCount: sample ? 1 : 0,
    coverageRatio: result.samples.length === 0 || !sample ? 0 : 1 / result.samples.length,
    bounds: sample ? { x: sample.x, y: sample.y, width: 1, height: 1 } : undefined,
  };
};

export const buildHistogramBins = (
  samples: PhotoSample[],
  metric: WorkbenchHistogramMetric
): WorkbenchHistogramBin[] => {
  const { binCount, max } = getHistogramDefinition(metric);
  const bins = createBins(binCount, max);
  for (const sample of samples) {
    const value = selectMetricValue(sample, metric);
    const normalizedMax = metric === "saturation" ? minimumUnit : max;
    const rawIndex = Math.floor((Math.min(value, normalizedMax) / normalizedMax) * binCount);
    const index = Math.min(binCount - 1, Math.max(0, rawIndex));
    bins[index].count += 1;
  }
  const total = samples.length || 1;
  return bins.map((bin, index) => ({
    metric,
    binIndex: index,
    start: bin.start,
    end: bin.end,
    count: bin.count,
    ratio: bin.count / total,
  }));
};

export const buildMetricRows = ({
  result,
  selectionState,
  scope,
}: {
  result: PhotoAnalysisResult;
  selectionState: TargetSelectionState | null | undefined;
  scope: SelectionScope;
}): WorkbenchMetricRow[] => {
  const scopedSamples = getScopedSamples(result, selectionState, scope);
  const summary = buildMetricSummary(scopedSamples);

  const getMetricValue = (
    key: WorkbenchMetricKey,
    sourceSummary: MetricSummary,
    sampleCount: number
  ): number | null => {
    switch (key) {
      case "l_mean":
        return sourceSummary.lMean;
      case "l_stddev":
        return sourceSummary.lStddev;
      case "l_p95":
        return sourceSummary.lP95;
      case "a_mean":
        return sourceSummary.aMean;
      case "b_mean":
        return sourceSummary.bMean;
      case "c_mean":
        return sourceSummary.cMean;
      case "c_p95":
        return sourceSummary.cP95;
      case "neutral_distance_mean":
        return sourceSummary.cMean;
      case "highlight_b_mean":
        return sourceSummary.highlightBMean;
      case "highlight_neutral_distance_mean":
        return sourceSummary.highlightNeutralDistanceMean;
      case "selection_coverage_ratio":
        return scope === "selected-region" && result.samples.length > 0
          ? (sampleCount / result.samples.length) * ratioPercent
          : null;
      default:
        return null;
    }
  };

  return metricDefinitions.map((definition) => {
    const baseValue = getMetricValue(definition.key, summary, scopedSamples.length);

    return {
      ...definition,
      value: baseValue,
      delta: null,
    };
  });
};

export const buildCubePointsFromSamples = (samples: PhotoSample[]): RgbCubePoint[] => {
  return buildRgbCubePointsCore(samples, maxCubePointCount);
};

export const serializeMetricRows = (rows: WorkbenchMetricRow[], format: ExportFormat): string => {
  const separator = format === "tsv" ? "\t" : ",";
  const header = ["group", "key", "label", "value", "unit", "delta", "description"];
  const formatValue = (value: number | null, precision: number): string => {
    if (value == null) {
      return "N/A";
    }
    return value.toFixed(precision);
  };
  if (format === "markdown") {
    const lines = [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...rows.map(
        (row) =>
          `| ${[
            row.group,
            row.key,
            row.label,
            formatValue(row.value, row.precision),
            row.unit,
            formatValue(row.delta, row.precision),
            row.description,
          ].join(" | ")} |`
      ),
    ];
    return lines.join("\n");
  }

  return [header.join(separator)]
    .concat(
      rows.map((row) =>
        [
          row.group,
          row.key,
          row.label,
          formatValue(row.value, row.precision),
          row.unit,
          formatValue(row.delta, row.precision),
          row.description,
        ].join(separator)
      )
    )
    .join("\n");
};

export const serializeHistogramBins = (
  bins: WorkbenchHistogramBin[],
  format: ExportFormat
): string => {
  const separator = format === "tsv" ? "\t" : ",";
  const header = ["metric", "binIndex", "start", "end", "count", "ratio"];
  if (format === "markdown") {
    const lines = [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...bins.map(
        (bin) =>
          `| ${[
            bin.metric,
            bin.binIndex,
            bin.start.toFixed(2),
            bin.end.toFixed(2),
            bin.count,
            bin.ratio.toFixed(4),
          ].join(" | ")} |`
      ),
    ];
    return lines.join("\n");
  }
  return [header.join(separator)]
    .concat(
      bins.map((bin) =>
        [
          bin.metric,
          bin.binIndex,
          bin.start.toFixed(2),
          bin.end.toFixed(2),
          bin.count,
          bin.ratio.toFixed(4),
        ].join(separator)
      )
    )
    .join("\n");
};

export const analyzePhoto = (imageData: ImageData): PhotoAnalysisResult => {
  const startAt = performance.now();
  const step = pickSamplingStep(imageData.width * imageData.height);
  const samples = samplePixels(imageData, step, maxSampleCount);
  const { hue, saturation } = fillHistograms(samples);
  const colorAreas = calculateColorAreas(samples);
  const cubePoints = buildRgbCubePointsCore(samples, maxCubePointCount);

  return {
    hueHistogram: hue,
    saturationHistogram: saturation,
    colorAreas,
    cubePoints,
    samples,
    width: imageData.width,
    height: imageData.height,
    elapsedMs: performance.now() - startAt,
    sampledPixels: samples.length,
  };
};
