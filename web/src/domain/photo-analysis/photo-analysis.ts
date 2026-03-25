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
export type SamplingPolicy = "fast" | "balanced" | "detail";

export type NormalizedRoiBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

export type SelectionRefinementResult = {
  roiBounds: NormalizedRoiBounds;
  selectedSamples: PhotoSample[];
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
  width: number;
  height: number;
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
};

export type PhotoAnalysisHandle = {
  imageData: ImageData;
  result: PhotoAnalysisResult;
  store: PhotoSampleBufferStore;
  fullSummary: MetricSummary;
};

const hueBinCount = 36;
const hueMax = 360;
const saturationBinCount = 20;
const topAreaCount = 5;
const quantizeBucketSize = 16;
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
const pointSelectionRoiSize = 96;
const samplingBudgets: Record<SamplingPolicy, number> = {
  fast: 32_768,
  balanced: 65_536,
  detail: 131_072,
};

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

const quantizeComponent = (value: number): number => {
  return Math.floor(value / quantizeBucketSize) * quantizeBucketSize;
};

const buildAreaLabel = (color: RgbColor): string => {
  return `R${color.r}-G${color.g}-B${color.b}`;
};

const pickSamplingStepForBudget = (
  width: number,
  height: number,
  policy: SamplingPolicy = "balanced"
): number => {
  const budget = samplingBudgets[policy];
  const pixelCount = width * height;
  if (pixelCount <= budget) {
    return minimumUnit;
  }
  return Math.max(minimumUnit, Math.ceil(Math.sqrt(pixelCount / budget)));
};

const scaleLabComponent = (value: number): number => Math.round(value * 100);
const unscaleLabL = (value: number): number => value / 100;
const unscaleLabComponent = (value: number): number => value / 100;
const scaleHue = (value: number): number => Math.round(value * 10);
const unscaleHue = (value: number): number => value / 10;
const scaleSaturation = (value: number): number => Math.round(value * 100);
const unscaleSaturation = (value: number): number => value / 100;
const shouldUseWideCoordinates = (width: number, height: number): boolean =>
  width > 65_535 || height > 65_535;

const samplePixelsToStore = (
  imageData: ImageData,
  step: number,
  maxSamples: number
): PhotoSampleBufferStore => {
  const { data, width, height } = imageData;
  const capacity = Math.min(maxSamples, Math.ceil(width / step) * Math.ceil(height / step));
  const xValues = shouldUseWideCoordinates(width, height)
    ? new Uint32Array(capacity)
    : new Uint16Array(capacity);
  const yValues = shouldUseWideCoordinates(width, height)
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
  let count = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (count >= maxSamples) {
        return {
          count,
          width,
          height,
          x: xValues.slice(0, count),
          y: yValues.slice(0, count),
          r: r.slice(0, count),
          g: g.slice(0, count),
          b: b.slice(0, count),
          labL: labL.slice(0, count),
          labA: labA.slice(0, count),
          labB: labB.slice(0, count),
          hue: hue.slice(0, count),
          saturation: saturation.slice(0, count),
        };
      }

      const offset = (y * width + x) * rgbaStride;
      const alpha = data[offset + alphaChannelOffset] / colorChannelMax;
      if (alpha === noAlpha) {
        continue;
      }

      const color = toRgbColor(data[offset], data[offset + 1], data[offset + 2]);
      const hsl = rgbToHsl(color);
      const lab = rgbToLab(color);
      xValues[count] = x;
      yValues[count] = y;
      r[count] = color.r;
      g[count] = color.g;
      b[count] = color.b;
      labL[count] = scaleLabComponent(lab.l);
      labA[count] = scaleLabComponent(lab.a);
      labB[count] = scaleLabComponent(lab.b);
      hue[count] = scaleHue(hsl.h);
      saturation[count] = scaleSaturation(hsl.s);
      count += 1;
    }
  }

  return {
    count,
    width,
    height,
    x: xValues.slice(0, count),
    y: yValues.slice(0, count),
    r: r.slice(0, count),
    g: g.slice(0, count),
    b: b.slice(0, count),
    labL: labL.slice(0, count),
    labA: labA.slice(0, count),
    labB: labB.slice(0, count),
    hue: hue.slice(0, count),
    saturation: saturation.slice(0, count),
  };
};

const materializeSample = (store: PhotoSampleBufferStore, index: number): PhotoSample => {
  const color = toRgbColor(store.r[index] ?? 0, store.g[index] ?? 0, store.b[index] ?? 0);
  const lab = {
    l: unscaleLabL(store.labL[index] ?? 0),
    a: unscaleLabComponent(store.labA[index] ?? 0),
    b: unscaleLabComponent(store.labB[index] ?? 0),
  };
  const hsl = {
    h: toHueDegree(unscaleHue(store.hue[index] ?? 0)),
    s: toPercentage(unscaleSaturation(store.saturation[index] ?? 0)),
    l: rgbToHsl(color).l,
  };

  return {
    sampleId: index,
    x: Number(store.x[index] ?? 0),
    y: Number(store.y[index] ?? 0),
    color,
    hsl,
    lab,
    chroma: labToChroma(lab),
  };
};

const materializeSamples = (
  store: PhotoSampleBufferStore,
  indexes?: readonly number[]
): PhotoSample[] => {
  const nextIndexes = indexes ?? Array.from({ length: store.count }, (_, index) => index);
  return nextIndexes.map((index) => materializeSample(store, index));
};

const buildMetricSummaryFromStore = (
  store: PhotoSampleBufferStore,
  indexes?: readonly number[]
): MetricSummary => {
  const nextIndexes = indexes ?? Array.from({ length: store.count }, (_, index) => index);
  const lValues: number[] = [];
  const aValues: number[] = [];
  const bValues: number[] = [];
  const cValues: number[] = [];
  const highlightAValues: number[] = [];
  const highlightBValues: number[] = [];
  const highlightChromaValues: number[] = [];

  for (const index of nextIndexes) {
    const l = unscaleLabL(store.labL[index] ?? 0);
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

const buildHistogramBinsFromStore = (
  store: PhotoSampleBufferStore,
  metric: WorkbenchHistogramMetric,
  indexes?: readonly number[]
): WorkbenchHistogramBin[] => {
  const { binCount, max } = getHistogramDefinition(metric);
  const bins = createBins(binCount, max);
  const nextIndexes = indexes ?? Array.from({ length: store.count }, (_, index) => index);
  for (const index of nextIndexes) {
    const value =
      metric === "luminance"
        ? unscaleLabL(store.labL[index] ?? 0)
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
  }
  const total = nextIndexes.length || 1;
  return bins.map((bin, index) => ({
    metric,
    binIndex: index,
    start: bin.start,
    end: bin.end,
    count: bin.count,
    ratio: bin.count / total,
  }));
};

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

const buildCubePointsFromStore = (
  store: PhotoSampleBufferStore,
  indexes?: readonly number[]
): RgbCubePoint[] => {
  const bucketCounts = new Map<string, number>();
  const nextIndexes = indexes ?? Array.from({ length: store.count }, (_, index) => index);
  for (const index of nextIndexes) {
    const bucketColor = toRgbColor(
      quantizeComponent(store.r[index] ?? 0),
      quantizeComponent(store.g[index] ?? 0),
      quantizeComponent(store.b[index] ?? 0)
    );
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  }

  const sorted = [...bucketCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, maxCubePointCount);
  const total = nextIndexes.length || minimumUnit;
  return sorted.map(([key, count]) => {
    const [rText, gText, bText] = key.split("-");
    return {
      color: toRgbColor(Number(rText), Number(gText), Number(bText)),
      count,
      ratio: count / total,
    };
  });
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
    highlightAMean: mean(highlightSamples.map((sample) => sample.lab.a)),
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

export const getSelectedSamples = (
  result: PhotoAnalysisResult,
  selectionState: TargetSelectionState | null | undefined
): PhotoSample[] => {
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
}: {
  result: PhotoAnalysisResult;
  selectionState: TargetSelectionState | null | undefined;
}): WorkbenchMetricRow[] => {
  const summary = buildMetricSummary(result.samples);
  const selectedSamples = getSelectedSamples(result, selectionState);

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
      case "highlight_a_mean":
        return sourceSummary.highlightAMean;
      case "highlight_b_mean":
        return sourceSummary.highlightBMean;
      case "highlight_neutral_distance_mean":
        return sourceSummary.highlightNeutralDistanceMean;
      case "selection_coverage_ratio":
        return selectedSamples.length > 0 && result.samples.length > 0
          ? (sampleCount / result.samples.length) * ratioPercent
          : null;
      default:
        return null;
    }
  };

  return metricDefinitions.map((definition) => {
    const sampleCount =
      definition.key === "selection_coverage_ratio"
        ? selectedSamples.length
        : result.samples.length;
    const baseValue = getMetricValue(definition.key, summary, sampleCount);

    return {
      ...definition,
      value: baseValue,
    };
  });
};

export const buildCubePointsFromSamples = (samples: PhotoSample[]): RgbCubePoint[] => {
  return buildRgbCubePointsCore(samples, maxCubePointCount);
};

const now = (): number => performance.now();

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

const buildMetricRowsFromSummary = ({
  summary,
  sampleCount,
  selectionCount,
}: {
  summary: MetricSummary;
  sampleCount: number;
  selectionCount: number;
}): WorkbenchMetricRow[] => {
  return metricDefinitions.map((definition) => {
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
};

const buildPhotoAnalysisResultFromStore = ({
  store,
  width,
  height,
  timings,
}: {
  store: PhotoSampleBufferStore;
  width: number;
  height: number;
  timings: PhotoAnalysisTimings;
}): PhotoAnalysisResult => {
  const samples = materializeSamples(store);
  return {
    hueHistogram: buildHistogramBinsFromStore(store, "hue"),
    saturationHistogram: buildHistogramBinsFromStore(store, "saturation"),
    colorAreas: calculateColorAreasFromStore(store),
    cubePoints: buildCubePointsFromStore(store),
    samples,
    width,
    height,
    elapsedMs: timings.totalMs,
    sampledPixels: store.count,
    timings,
  };
};

const normalizeRoiBounds = (
  width: number,
  height: number,
  bounds: NormalizedRoiBounds
): NormalizedRoiBounds => {
  const nextX = Math.max(0, Math.min(width - 1, Math.floor(bounds.x)));
  const nextY = Math.max(0, Math.min(height - 1, Math.floor(bounds.y)));
  const nextWidth = Math.max(1, Math.min(width - nextX, Math.ceil(bounds.width)));
  const nextHeight = Math.max(1, Math.min(height - nextY, Math.ceil(bounds.height)));
  return {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
};

export const normalizeSelectionToRoi = ({
  width,
  height,
  selectionState,
}: {
  width: number;
  height: number;
  selectionState: TargetSelectionState | null | undefined;
}): NormalizedRoiBounds | null => {
  const bounds = selectionState?.activeSelection?.bounds;
  if (!bounds) {
    return null;
  }

  if (bounds.width <= 1 && bounds.height <= 1) {
    return normalizeRoiBounds(width, height, {
      x: bounds.x - pointSelectionRoiSize / 2,
      y: bounds.y - pointSelectionRoiSize / 2,
      width: pointSelectionRoiSize,
      height: pointSelectionRoiSize,
    });
  }

  return normalizeRoiBounds(width, height, bounds);
};

export const createPhotoAnalysisHandle = ({
  imageData,
  samplingPolicy = "balanced",
}: {
  imageData: ImageData;
  samplingPolicy?: SamplingPolicy;
}): PhotoAnalysisHandle => {
  const startAt = now();
  const step = pickSamplingStepForBudget(imageData.width, imageData.height, samplingPolicy);
  const samplingStartAt = now();
  const store = samplePixelsToStore(imageData, step, samplingBudgets[samplingPolicy]);
  const samplingMs = now() - samplingStartAt;
  const histogramStartAt = now();
  buildHistogramBinsFromStore(store, "hue");
  buildHistogramBinsFromStore(store, "saturation");
  const histogramMs = now() - histogramStartAt;
  const colorAreasStartAt = now();
  calculateColorAreasFromStore(store);
  const colorAreasMs = now() - colorAreasStartAt;
  const cubePointsStartAt = now();
  buildCubePointsFromStore(store);
  const cubePointsMs = now() - cubePointsStartAt;
  const timings = {
    totalMs: now() - startAt,
    samplingMs,
    histogramMs,
    colorAreasMs,
    cubePointsMs,
  };
  const result = buildPhotoAnalysisResultFromStore({
    store,
    width: imageData.width,
    height: imageData.height,
    timings,
  });
  return {
    imageData,
    result,
    store,
    fullSummary: buildMetricSummaryFromStore(store),
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

export const refineSelectionRegionFromHandle = ({
  handle,
  roiBounds,
  samplingPolicy = "detail",
}: {
  handle: PhotoAnalysisHandle;
  roiBounds: NormalizedRoiBounds;
  samplingPolicy?: SamplingPolicy;
}): SelectionRefinementResult => {
  const startAt = now();
  const normalizedBounds = normalizeRoiBounds(handle.result.width, handle.result.height, roiBounds);
  const imageData = handle.imageData;
  const regionData = {
    data: new Uint8ClampedArray(normalizedBounds.width * normalizedBounds.height * rgbaStride),
    width: normalizedBounds.width,
    height: normalizedBounds.height,
    colorSpace: imageData.colorSpace,
  } as ImageData;

  for (let row = 0; row < normalizedBounds.height; row += 1) {
    const sourceOffset =
      ((normalizedBounds.y + row) * imageData.width + normalizedBounds.x) * rgbaStride;
    const targetOffset = row * normalizedBounds.width * rgbaStride;
    regionData.data.set(
      imageData.data.subarray(sourceOffset, sourceOffset + normalizedBounds.width * rgbaStride),
      targetOffset
    );
  }

  const step = pickSamplingStepForBudget(regionData.width, regionData.height, samplingPolicy);
  const selectionStartAt = now();
  const regionStore = samplePixelsToStore(regionData, step, samplingBudgets[samplingPolicy]);
  const selectionMs = now() - selectionStartAt;
  for (let index = 0; index < regionStore.count; index += 1) {
    regionStore.x[index] = Number(regionStore.x[index] ?? 0) + normalizedBounds.x;
    regionStore.y[index] = Number(regionStore.y[index] ?? 0) + normalizedBounds.y;
  }

  const metricsStartAt = now();
  buildMetricRowsFromSummary({
    summary: handle.fullSummary,
    sampleCount: handle.store.count,
    selectionCount: regionStore.count,
  });
  const metricsMs = now() - metricsStartAt;
  const cubePointsStartAt = now();
  const selectionCubePoints = buildCubePointsFromStore(regionStore);
  const cubePointsMs = now() - cubePointsStartAt;

  return {
    roiBounds: normalizedBounds,
    selectedSamples: materializeSamples(regionStore),
    selectionCubePoints,
    timings: {
      totalMs: now() - startAt,
      selectionMs,
      metricsMs,
      luminanceHistogramMs: 0,
      hueHistogramMs: 0,
      saturationHistogramMs: 0,
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
    const lines = [
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
    ];
    return lines.join("\n");
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

export const analyzePhoto = (
  imageData: ImageData,
  options?: { samplingPolicy?: SamplingPolicy }
): PhotoAnalysisResult => {
  return createPhotoAnalysisHandle({
    imageData,
    samplingPolicy: options?.samplingPolicy,
  }).result;
};
