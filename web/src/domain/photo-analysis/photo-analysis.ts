import { labToChroma, rgbToHsl, rgbToLab } from "@/domain/color/color-conversion";
import { colorChannelMax } from "@/domain/color/color-constants";
import {
  toHueDegree,
  toPercentage,
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
  | "highlight_a_mean"
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
  tooltip?: string;
};

type MetricRowHeaderLabels = {
  group: string;
  key: string;
  label: string;
  value: string;
  unit: string;
  description: string;
};

type HistogramBinHeaderLabels = {
  metric: string;
  binIndex: string;
  start: string;
  end: string;
  count: string;
  ratio: string;
};

type SerializeMetricRowsOptions = {
  headerLabels?: MetricRowHeaderLabels;
};

type SerializeHistogramBinsOptions = {
  headerLabels?: HistogramBinHeaderLabels;
  metricLabels?: Partial<Record<WorkbenchHistogramMetric, string>>;
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
  timings: PhotoAnalysisTimings;
};

export type PhotoAnalysisTimings = {
  totalMs: number;
  samplingMs: number;
  histogramMs: number;
  colorAreasMs: number;
  cubePointsMs: number;
};

export type DerivedAnalysisTimings = {
  totalMs: number;
  selectionMs: number;
  metricsMs: number;
  luminanceHistogramMs: number;
  hueHistogramMs: number;
  saturationHistogramMs: number;
  cubePointsMs: number;
};

export type DerivedPhotoAnalysis = {
  selectedSamples: PhotoSample[];
  metricRows: WorkbenchMetricRow[];
  luminanceHistogram: WorkbenchHistogramBin[];
  hueHistogram: WorkbenchHistogramBin[];
  saturationHistogram: WorkbenchHistogramBin[];
  selectionCubePoints: RgbCubePoint[];
  timings: DerivedAnalysisTimings;
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
  highlightAMean: number | null;
  highlightBMean: number | null;
  highlightNeutralDistanceMean: number | null;
  meanLab: LabColor | null;
};

type PhotoSampleBufferStore = {
  count: number;
  x: Uint16Array | Uint32Array;
  y: Uint16Array | Uint32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  labL: Uint16Array;
  labA: Int16Array;
  labB: Int16Array;
  hue: Uint16Array;
  saturation: Uint16Array;
  lightness: Uint16Array;
};

export type PhotoAnalysisHandle = {
  result: PhotoAnalysisResult;
  store: PhotoSampleBufferStore;
  fullSummary: MetricSummary | null;
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
    key: "highlight_a_mean",
    label: "Highlight a* mean (L* > 80)",
    unit: "",
    precision: 2,
    description: "白の緑み / 赤み",
  },
  {
    group: "白",
    key: "highlight_b_mean",
    label: "Highlight b* mean (L* > 80)",
    unit: "",
    precision: 2,
    description: "白の黄ばみ / 青み",
  },
  {
    group: "白",
    key: "highlight_neutral_distance_mean",
    label: "Highlight Neutral Distance mean (L* > 80)",
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

const quantizeComponent = (value: number): number =>
  Math.floor(value / quantizeBucketSize) * quantizeBucketSize;
const buildAreaLabel = (color: RgbColor): string => `R${color.r}-G${color.g}-B${color.b}`;
const pickSamplingStep = (pixelCount: number): number =>
  pixelCount <= performanceSamplingThreshold
    ? minimumUnit
    : Math.ceil(Math.sqrt(pixelCount / performanceSamplingThreshold));
const scaleLabComponent = (value: number): number => Math.round(value * 100);
const unscaleLabComponent = (value: number): number => value / 100;
const scaleHue = (value: number): number => Math.round(value * 10);
const unscaleHue = (value: number): number => value / 10;
const scaleSaturation = (value: number): number => Math.round(value * 100);
const unscaleSaturation = (value: number): number => value / 100;
const scaleLightness = (value: number): number => Math.round(value * 100);
const unscaleLightness = (value: number): number => value / 100;
const shouldUseWideCoordinates = (width: number, height: number): boolean =>
  width > 65_535 || height > 65_535;

const samplePixelsToStore = (
  imageData: ImageData,
  step: number,
  maxSamples: number
): PhotoSampleBufferStore => {
  const { data, width, height } = imageData;
  const capacity = Math.min(maxSamples, Math.ceil(width / step) * Math.ceil(height / step));
  const x = shouldUseWideCoordinates(width, height)
    ? new Uint32Array(capacity)
    : new Uint16Array(capacity);
  const y = shouldUseWideCoordinates(width, height)
    ? new Uint32Array(capacity)
    : new Uint16Array(capacity);
  const r = new Uint8Array(capacity);
  const g = new Uint8Array(capacity);
  const b = new Uint8Array(capacity);
  const labL = new Uint16Array(capacity);
  const labA = new Int16Array(capacity);
  const labB = new Int16Array(capacity);
  const hue = new Uint16Array(capacity);
  const saturation = new Uint16Array(capacity);
  const lightness = new Uint16Array(capacity);
  let count = 0;

  for (let row = 0; row < height; row += step) {
    for (let column = 0; column < width; column += step) {
      if (count >= maxSamples) {
        break;
      }
      const offset = (row * width + column) * rgbaStride;
      const alpha = data[offset + alphaChannelOffset] / colorChannelMax;
      if (alpha === noAlpha) {
        continue;
      }

      const color = toRgbColor(data[offset], data[offset + 1], data[offset + 2]);
      const hsl = rgbToHsl(color);
      const lab = rgbToLab(color);
      x[count] = column;
      y[count] = row;
      r[count] = color.r;
      g[count] = color.g;
      b[count] = color.b;
      labL[count] = scaleLabComponent(lab.l);
      labA[count] = scaleLabComponent(lab.a);
      labB[count] = scaleLabComponent(lab.b);
      hue[count] = scaleHue(hsl.h);
      saturation[count] = scaleSaturation(hsl.s);
      lightness[count] = scaleLightness(hsl.l);
      count += 1;
    }
    if (count >= maxSamples) {
      break;
    }
  }

  return {
    count,
    x: x.subarray(0, count),
    y: y.subarray(0, count),
    r: r.subarray(0, count),
    g: g.subarray(0, count),
    b: b.subarray(0, count),
    labL: labL.subarray(0, count),
    labA: labA.subarray(0, count),
    labB: labB.subarray(0, count),
    hue: hue.subarray(0, count),
    saturation: saturation.subarray(0, count),
    lightness: lightness.subarray(0, count),
  };
};

const materializeSample = (store: PhotoSampleBufferStore, index: number): PhotoSample => {
  const color = toRgbColor(store.r[index] ?? 0, store.g[index] ?? 0, store.b[index] ?? 0);
  const lab = {
    l: unscaleLabComponent(store.labL[index] ?? 0),
    a: unscaleLabComponent(store.labA[index] ?? 0),
    b: unscaleLabComponent(store.labB[index] ?? 0),
  };
  return {
    sampleId: index,
    x: Number(store.x[index] ?? 0),
    y: Number(store.y[index] ?? 0),
    color,
    hsl: {
      h: toHueDegree(unscaleHue(store.hue[index] ?? 0)),
      s: toPercentage(unscaleSaturation(store.saturation[index] ?? 0)),
      l: toPercentage(unscaleLightness(store.lightness[index] ?? 0)),
    },
    lab,
    chroma: labToChroma(lab),
  };
};

const materializeSamples = (
  store: PhotoSampleBufferStore,
  indexes?: readonly number[]
): PhotoSample[] => {
  const targetIndexes = indexes ?? Array.from({ length: store.count }, (_, index) => index);
  return targetIndexes.map((index) => materializeSample(store, index));
};

const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

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
    highlightAMean: mean(highlightSamples.map((sample) => sample.lab.a)),
    highlightBMean: mean(highlightSamples.map((sample) => sample.lab.b)),
    highlightNeutralDistanceMean: mean(highlightSamples.map((sample) => sample.chroma)),
    meanLab:
      lMean == null || aMean == null || bMean == null ? null : { l: lMean, a: aMean, b: bMean },
  };
};

const buildMetricSummaryFromStore = (
  store: PhotoSampleBufferStore,
  indexes?: readonly number[]
): MetricSummary => {
  const targetIndexes = indexes ?? Array.from({ length: store.count }, (_, index) => index);
  const lValues: number[] = [];
  const aValues: number[] = [];
  const bValues: number[] = [];
  const cValues: number[] = [];
  const highlightAValues: number[] = [];
  const highlightBValues: number[] = [];
  const highlightChromaValues: number[] = [];

  for (const index of targetIndexes) {
    const l = unscaleLabComponent(store.labL[index] ?? 0);
    const a = unscaleLabComponent(store.labA[index] ?? 0);
    const b = unscaleLabComponent(store.labB[index] ?? 0);
    const chroma = Math.sqrt(a * a + b * b);
    lValues.push(l);
    aValues.push(a);
    bValues.push(b);
    cValues.push(chroma);
    if (l > highlightThreshold) {
      highlightAValues.push(a);
      highlightBValues.push(b);
      highlightChromaValues.push(chroma);
    }
  }

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
    highlightAMean: mean(highlightAValues),
    highlightBMean: mean(highlightBValues),
    highlightNeutralDistanceMean: mean(highlightChromaValues),
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

const buildMetricRowsFromSummary = ({
  summary,
  sampleCount,
  selectionCount,
}: {
  summary: MetricSummary;
  sampleCount: number;
  selectionCount: number;
}): WorkbenchMetricRow[] =>
  metricDefinitions.map((definition) => {
    const value =
      definition.key === "l_mean"
        ? summary.lMean
        : definition.key === "l_stddev"
          ? summary.lStddev
          : definition.key === "l_p95"
            ? summary.lP95
            : definition.key === "a_mean"
              ? summary.aMean
              : definition.key === "b_mean"
                ? summary.bMean
                : definition.key === "c_mean" || definition.key === "neutral_distance_mean"
                  ? summary.cMean
                  : definition.key === "c_p95"
                    ? summary.cP95
                    : definition.key === "highlight_a_mean"
                      ? summary.highlightAMean
                      : definition.key === "highlight_b_mean"
                        ? summary.highlightBMean
                        : definition.key === "highlight_neutral_distance_mean"
                          ? summary.highlightNeutralDistanceMean
                          : selectionCount > 0 && sampleCount > 0
                            ? (selectionCount / sampleCount) * ratioPercent
                            : null;

    return {
      ...definition,
      value,
    };
  });

const calculateColorAreasFromStore = (store: PhotoSampleBufferStore): ColorArea[] => {
  const bucketCounts = new Map<string, number>();
  for (let index = 0; index < store.count; index += 1) {
    const bucketColor = toRgbColor(
      quantizeComponent(store.r[index] ?? 0),
      quantizeComponent(store.g[index] ?? 0),
      quantizeComponent(store.b[index] ?? 0)
    );
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  }

  const sorted = [...bucketCounts.entries()].sort((left, right) => right[1] - left[1]);
  const total = store.count || minimumUnit;
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

const buildCubePointsFromStore = (
  store: PhotoSampleBufferStore,
  indexes?: readonly number[]
): RgbCubePoint[] => {
  const bucketCounts = new Map<string, number>();
  const total = indexes?.length ?? store.count;
  const accumulate = (index: number): void => {
    const bucketColor = toRgbColor(
      quantizeComponent(store.r[index] ?? 0),
      quantizeComponent(store.g[index] ?? 0),
      quantizeComponent(store.b[index] ?? 0)
    );
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  };
  if (indexes) {
    for (const index of indexes) {
      accumulate(index);
    }
  } else {
    for (let index = 0; index < store.count; index += 1) {
      accumulate(index);
    }
  }

  const sorted = [...bucketCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, maxCubePointCount);
  return sorted.map(([key, count]) => {
    const [rText, gText, bText] = key.split("-");
    return {
      color: toRgbColor(Number(rText), Number(gText), Number(bText)),
      count,
      ratio: count / (total || minimumUnit),
    };
  });
};

const buildHistogramBinsFromStore = (
  store: PhotoSampleBufferStore,
  metric: WorkbenchHistogramMetric,
  indexes?: readonly number[]
): WorkbenchHistogramBin[] => {
  const { binCount, max } = getHistogramDefinition(metric);
  const bins = createBins(binCount, max);
  const total = indexes?.length ?? store.count;
  const accumulate = (index: number): void => {
    const value =
      metric === "luminance"
        ? unscaleLabComponent(store.labL[index] ?? 0)
        : metric === "hue"
          ? unscaleHue(store.hue[index] ?? 0)
          : metric === "saturation"
            ? unscaleSaturation(store.saturation[index] ?? 0) / ratioPercent
            : Math.sqrt(
                unscaleLabComponent(store.labA[index] ?? 0) ** 2 +
                  unscaleLabComponent(store.labB[index] ?? 0) ** 2
              );
    const normalizedMax = metric === "saturation" ? minimumUnit : max;
    const rawIndex = Math.floor((Math.min(value, normalizedMax) / normalizedMax) * binCount);
    const binIndex = Math.min(binCount - 1, Math.max(0, rawIndex));
    bins[binIndex].count += 1;
  };
  if (indexes) {
    for (const index of indexes) {
      accumulate(index);
    }
  } else {
    for (let index = 0; index < store.count; index += 1) {
      accumulate(index);
    }
  }
  return bins.map((bin, index) => ({
    metric,
    binIndex: index,
    start: bin.start,
    end: bin.end,
    count: bin.count,
    ratio: bin.count / (total || 1),
  }));
};

const buildPhotoAnalysisResultFromStore = ({
  store,
  width,
  height,
  timings,
  hueHistogram,
  saturationHistogram,
  colorAreas,
  cubePoints,
  samples,
}: {
  store: PhotoSampleBufferStore;
  width: number;
  height: number;
  timings: PhotoAnalysisTimings;
  hueHistogram: HistogramBin[];
  saturationHistogram: HistogramBin[];
  colorAreas: ColorArea[];
  cubePoints: RgbCubePoint[];
  samples: PhotoSample[];
}): PhotoAnalysisResult => ({
  hueHistogram,
  saturationHistogram,
  colorAreas,
  cubePoints,
  samples,
  width,
  height,
  elapsedMs: timings.totalMs,
  sampledPixels: store.count,
  timings,
});

export const getSelectedSamples = (
  result: PhotoAnalysisResult,
  selectionState: TargetSelectionState | null | undefined
): PhotoSample[] => {
  const ids = getSelectionIds(selectionState?.activeSelection);
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
}: {
  result: PhotoAnalysisResult;
  selectionState: TargetSelectionState | null | undefined;
}): WorkbenchMetricRow[] => {
  const summary = buildMetricSummary(result.samples);
  const selectedSamples = getSelectedSamples(result, selectionState);
  return buildMetricRowsFromSummary({
    summary,
    sampleCount: result.samples.length,
    selectionCount: selectedSamples.length,
  });
};

export const buildCubePointsFromSamples = (samples: PhotoSample[]): RgbCubePoint[] =>
  buildRgbCubePointsCore(samples, maxCubePointCount);

const now = (): number => performance.now();

export const createPhotoAnalysisHandle = ({
  imageData,
}: {
  imageData: ImageData;
}): PhotoAnalysisHandle => {
  const startAt = now();
  const step = pickSamplingStep(imageData.width * imageData.height);
  const samplingStartAt = now();
  const store = samplePixelsToStore(imageData, step, maxSampleCount);
  const samplingMs = now() - samplingStartAt;
  const histogramStartAt = now();
  const hueHistogram = buildHistogramBinsFromStore(store, "hue").map((bin) => ({
    start: bin.start,
    end: bin.end,
    count: bin.count,
  }));
  const saturationHistogram = buildHistogramBinsFromStore(store, "saturation").map((bin) => ({
    start: bin.start,
    end: bin.end,
    count: bin.count,
  }));
  const histogramMs = now() - histogramStartAt;
  const colorAreasStartAt = now();
  const colorAreas = calculateColorAreasFromStore(store);
  const colorAreasMs = now() - colorAreasStartAt;
  const cubePointsStartAt = now();
  const cubePoints = buildCubePointsFromStore(store);
  const cubePointsMs = now() - cubePointsStartAt;
  const samples = materializeSamples(store);
  const timings = {
    totalMs: now() - startAt,
    samplingMs,
    histogramMs,
    colorAreasMs,
    cubePointsMs,
  };
  return {
    result: buildPhotoAnalysisResultFromStore({
      store,
      width: imageData.width,
      height: imageData.height,
      timings,
      hueHistogram,
      saturationHistogram,
      colorAreas,
      cubePoints,
      samples,
    }),
    store,
    fullSummary: null,
  };
};

export const buildDerivedPhotoAnalysis = ({
  result,
  selectionState,
}: {
  result: PhotoAnalysisResult;
  selectionState: TargetSelectionState | null | undefined;
}): DerivedPhotoAnalysis => {
  const startAt = now();
  const selectionStartAt = now();
  const selectedSamples = getSelectedSamples(result, selectionState);
  const selectionMs = now() - selectionStartAt;
  const metricsStartAt = now();
  const metricRows = buildMetricRows({ result, selectionState });
  const metricsMs = now() - metricsStartAt;
  const luminanceHistogramStartAt = now();
  const luminanceHistogram = buildHistogramBins(result.samples, "luminance");
  const luminanceHistogramMs = now() - luminanceHistogramStartAt;
  const hueHistogramStartAt = now();
  const hueHistogram = buildHistogramBins(result.samples, "hue");
  const hueHistogramMs = now() - hueHistogramStartAt;
  const saturationHistogramStartAt = now();
  const saturationHistogram = buildHistogramBins(result.samples, "saturation");
  const saturationHistogramMs = now() - saturationHistogramStartAt;
  const cubePointsStartAt = now();
  const selectionCubePoints = buildCubePointsFromSamples(selectedSamples);
  const cubePointsMs = now() - cubePointsStartAt;

  return {
    selectedSamples,
    metricRows,
    luminanceHistogram,
    hueHistogram,
    saturationHistogram,
    selectionCubePoints,
    timings: {
      totalMs: now() - startAt,
      selectionMs,
      metricsMs,
      luminanceHistogramMs,
      hueHistogramMs,
      saturationHistogramMs,
      cubePointsMs,
    },
  };
};

export const buildDerivedPhotoAnalysisFromHandle = ({
  handle,
  selectionState,
}: {
  handle: PhotoAnalysisHandle;
  selectionState: TargetSelectionState | null | undefined;
}): DerivedPhotoAnalysis => {
  const startAt = now();
  if (!handle.fullSummary) {
    handle.fullSummary = buildMetricSummaryFromStore(handle.store);
  }
  const selectionStartAt = now();
  const selectedSamples = getSelectedSamples(handle.result, selectionState);
  const selectionMs = now() - selectionStartAt;
  const selectedIndexes = selectedSamples.map((sample) => sample.sampleId);
  const metricsStartAt = now();
  const metricRows = buildMetricRowsFromSummary({
    summary: handle.fullSummary,
    sampleCount: handle.store.count,
    selectionCount: selectedIndexes.length,
  });
  const metricsMs = now() - metricsStartAt;
  const luminanceHistogramStartAt = now();
  const luminanceHistogram = buildHistogramBinsFromStore(handle.store, "luminance");
  const luminanceHistogramMs = now() - luminanceHistogramStartAt;
  const hueHistogramStartAt = now();
  const hueHistogram = buildHistogramBinsFromStore(handle.store, "hue");
  const hueHistogramMs = now() - hueHistogramStartAt;
  const saturationHistogramStartAt = now();
  const saturationHistogram = buildHistogramBinsFromStore(handle.store, "saturation");
  const saturationHistogramMs = now() - saturationHistogramStartAt;
  const cubePointsStartAt = now();
  const selectionCubePoints = buildCubePointsFromStore(handle.store, selectedIndexes);
  const cubePointsMs = now() - cubePointsStartAt;

  return {
    selectedSamples,
    metricRows,
    luminanceHistogram,
    hueHistogram,
    saturationHistogram,
    selectionCubePoints,
    timings: {
      totalMs: now() - startAt,
      selectionMs,
      metricsMs,
      luminanceHistogramMs,
      hueHistogramMs,
      saturationHistogramMs,
      cubePointsMs,
    },
  };
};

export const serializeMetricRows = (
  rows: WorkbenchMetricRow[],
  format: ExportFormat,
  options?: SerializeMetricRowsOptions
): string => {
  const separator = format === "tsv" ? "\t" : ",";
  const headerLabels: MetricRowHeaderLabels = options?.headerLabels ?? {
    group: "group",
    key: "key",
    label: "label",
    value: "value",
    unit: "unit",
    description: "description",
  };
  const header = [
    headerLabels.group,
    headerLabels.key,
    headerLabels.label,
    headerLabels.value,
    headerLabels.unit,
    headerLabels.description,
  ];
  const formatValue = (value: number | null, precision: number): string => {
    if (value == null) {
      return "N/A";
    }
    return value.toFixed(precision);
  };
  if (format === "markdown") {
    return [
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
            row.description,
          ].join(" | ")} |`
      ),
    ].join("\n");
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
          row.description,
        ].join(separator)
      )
    )
    .join("\n");
};

export const serializeHistogramBins = (
  bins: WorkbenchHistogramBin[],
  format: ExportFormat,
  options?: SerializeHistogramBinsOptions
): string => {
  const separator = format === "tsv" ? "\t" : ",";
  const headerLabels: HistogramBinHeaderLabels = options?.headerLabels ?? {
    metric: "metric",
    binIndex: "binIndex",
    start: "start",
    end: "end",
    count: "count",
    ratio: "ratio",
  };
  const metricLabels = options?.metricLabels ?? {};
  const header = [
    headerLabels.metric,
    headerLabels.binIndex,
    headerLabels.start,
    headerLabels.end,
    headerLabels.count,
    headerLabels.ratio,
  ];
  if (format === "markdown") {
    return [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...bins.map(
        (bin) =>
          `| ${[
            metricLabels[bin.metric] ?? bin.metric,
            bin.binIndex,
            bin.start.toFixed(2),
            bin.end.toFixed(2),
            bin.count,
            bin.ratio.toFixed(4),
          ].join(" | ")} |`
      ),
    ].join("\n");
  }

  return [header.join(separator)]
    .concat(
      bins.map((bin) =>
        [
          metricLabels[bin.metric] ?? bin.metric,
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

export const analyzePhoto = (imageData: ImageData): PhotoAnalysisResult =>
  createPhotoAnalysisHandle({ imageData }).result;
