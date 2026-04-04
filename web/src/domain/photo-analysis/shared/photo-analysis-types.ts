import type { HslColor, LabColor, RgbColor } from "@/domain/color/color-types";

// Shared types used by both base analysis and derived analysis.

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

export type MetricRowHeaderLabels = {
  group: string;
  key: string;
  label: string;
  value: string;
  unit: string;
  description: string;
};

export type HistogramBinHeaderLabels = {
  metric: string;
  binIndex: string;
  start: string;
  end: string;
  count: string;
  ratio: string;
};

export type SerializeMetricRowsOptions = {
  headerLabels?: MetricRowHeaderLabels;
};

export type SerializeHistogramBinsOptions = {
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

export type DerivedBaseCache = {
  metricRows: WorkbenchMetricRow[];
  luminanceHistogram: WorkbenchHistogramBin[];
  hueHistogram: WorkbenchHistogramBin[];
  saturationHistogram: WorkbenchHistogramBin[];
};

export type PhotoAnalysisSummary = {
  avgBrightness: number;
  avgSaturation: number;
  brightnessSpread: number;
  temperatureBias: "warm" | "cool" | "neutral";
  shadowColorBias: "warm" | "cool" | "neutral";
  highlightColorBias: "warm" | "cool" | "neutral";
};

export type MetricSummary = {
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

export type PhotoSampleBufferStore = {
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
  derivedBaseCache: DerivedBaseCache | null;
};
