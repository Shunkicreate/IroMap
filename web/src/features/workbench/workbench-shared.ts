import { deltaE76, rgbToLab } from "@/domain/color/color-conversion";
import { type RgbColor, type SliceAxis } from "@/domain/color/color-types";
import type {
  ExportFormat,
  PhotoAnalysisResult,
  PhotoSample,
  TargetSelectionState,
  WorkbenchMetricRow,
} from "@/domain/photo-analysis/photo-analysis";
import { t } from "@/i18n/translate";

export type Rotation = {
  x: number;
  y: number;
};

export type RgbCubeOverlayMode = "grid" | "image" | "both";
export type PreviewSamplingGridColor = "white" | "black";

export type WorkbenchTarget = {
  targetId: string;
  label: string;
  file: File | null;
  analysisId: string | null;
  result: PhotoAnalysisResult | null;
  previewUrl: string;
  statusMessage: string;
  error: string;
  isAnalyzing: boolean;
};

export type HoverState = {
  targetId: string;
  sample: PhotoSample | null;
  source: "preview" | "cube" | "slice";
};

export type SelectionDraft = {
  originXRatio: number;
  originYRatio: number;
  currentXRatio: number;
  currentYRatio: number;
} | null;

export const defaultSliceValue = 128;
export const defaultRotation: Rotation = { x: -0.7, y: 0.6 };
export const defaultCubeSize = 760;
export const clipboardImageFileName = "clipboard-image.png";
export const histogramHeightPercent = 100;
export const histogramMinHeightPercent = 3;
export const fileSummaryPrecision = 1;
export const ratioFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
export const defaultSelectionState: TargetSelectionState = {
  activeSelection: null,
};
export const histogramChartViewboxWidth = 100;
export const histogramChartViewboxHeight = 100;
export const storageKeys = {
  uploadPanel: "iromap.workbench.preview.upload-panel.open",
  previewOptionsPanel: "iromap.workbench.preview.options.open",
  cubeOptionsPanel: "iromap.workbench.cube.options.open",
  sliceOptionsPanel: "iromap.workbench.slice.options.open",
  inspectorPanel: "iromap.workbench.inspector.panel.open",
  cubeSpace: "iromap.workbench.cube.space",
  cubeSliceAxis: "iromap.workbench.cube.slice-axis",
  cubeSliceValue: "iromap.workbench.cube.slice-value",
  cubeAxisGuideVisible: "iromap.workbench.cube.axis-guide.visible",
  cubeSizeSliderVisible: "iromap.workbench.cube.size-slider.visible",
  cubeSize: "iromap.workbench.cube.size",
  cubeRotation: "iromap.workbench.cube.rotation",
  cubeOverlayMode: "iromap.workbench.cube.overlay-mode",
  cubeImageMapping: "iromap.workbench.cube.image-mapping.visible",
  cubeSelectionMapping: "iromap.workbench.cube.selection-mapping.visible",
  sliceImageMapping: "iromap.workbench.slice.image-mapping.visible",
  sliceSelectionMapping: "iromap.workbench.slice.selection-mapping.visible",
  previewSamplingGridVisible: "iromap.workbench.preview.sampling-grid.visible",
  previewSamplingGridColor: "iromap.workbench.preview.sampling-grid.color",
  samplingDensityPercent: "iromap.workbench.preview.sampling-density-percent",
} as const;

export const emptyTarget = (targetId: string, label: string): WorkbenchTarget => ({
  targetId,
  label,
  file: null,
  analysisId: null,
  result: null,
  previewUrl: "",
  statusMessage: "",
  error: "",
  isAnalyzing: false,
});

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const getAxisRange = (axis: SliceAxis): { min: number; max: number } => {
  if (axis === "h") {
    return { min: 0, max: 360 };
  }
  if (axis === "s" || axis === "l" || axis === "lab-l") {
    return { min: 0, max: 100 };
  }
  if (axis === "lab-a" || axis === "lab-b") {
    return { min: -128, max: 127 };
  }
  return { min: 0, max: 255 };
};

export const mapAxisValue = (
  value: number,
  sourceRange: { min: number; max: number },
  targetRange: { min: number; max: number }
): number => {
  const sourceSpan = sourceRange.max - sourceRange.min;
  if (sourceSpan === 0) {
    return targetRange.min;
  }
  const ratio = (value - sourceRange.min) / sourceSpan;
  return Math.round(targetRange.min + (targetRange.max - targetRange.min) * ratio);
};

const createBucketKey = (color: RgbColor): string => {
  return `${Math.floor(color.r / 16)}-${Math.floor(color.g / 16)}-${Math.floor(color.b / 16)}`;
};

export const buildSampleBuckets = (
  result: PhotoAnalysisResult | null
): Map<string, PhotoSample[]> => {
  const buckets = new Map<string, PhotoSample[]>();
  if (!result) {
    return buckets;
  }
  for (const sample of result.samples) {
    const key = createBucketKey(sample.color);
    const current = buckets.get(key);
    if (current) {
      current.push(sample);
    } else {
      buckets.set(key, [sample]);
    }
  }
  return buckets;
};

export const findNearestSampleByColor = (
  result: PhotoAnalysisResult | null,
  buckets: Map<string, PhotoSample[]>,
  color: RgbColor | null
): PhotoSample | null => {
  if (!result || !color) {
    return null;
  }

  const bucket = buckets.get(createBucketKey(color)) ?? result.samples.slice(0, 256);
  if (bucket.length === 0) {
    return null;
  }

  const targetLab = rgbToLab(color);
  let nearest = bucket[0] ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const sample of bucket) {
    const distance = deltaE76(sample.lab, targetLab);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = sample;
    }
  }

  return nearest;
};

export const findNearestSampleByCoordinate = (
  result: PhotoAnalysisResult | null,
  x: number,
  y: number
): PhotoSample | null => {
  if (!result) {
    return null;
  }

  let nearest = result.samples[0] ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const sample of result.samples) {
    const dx = sample.x - x;
    const dy = sample.y - y;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = sample;
    }
  }
  return nearest;
};

export const formatMetricValue = (row: WorkbenchMetricRow, value: number | null): string => {
  if (value == null) {
    return "N/A";
  }
  if (row.unit === "%") {
    return `${value.toFixed(row.precision)}%`;
  }
  return value.toFixed(row.precision);
};

const getMetricLabelKey = (key: WorkbenchMetricRow["key"]) => {
  switch (key) {
    case "l_mean":
      return "workbenchMetricLabelLMean";
    case "l_stddev":
      return "workbenchMetricLabelLStddev";
    case "l_p95":
      return "workbenchMetricLabelLP95";
    case "a_mean":
      return "workbenchMetricLabelAMean";
    case "b_mean":
      return "workbenchMetricLabelBMean";
    case "c_mean":
      return "workbenchMetricLabelCMean";
    case "c_p95":
      return "workbenchMetricLabelCP95";
    case "neutral_distance_mean":
      return "workbenchMetricLabelNeutralDistanceMean";
    case "highlight_a_mean":
      return "workbenchMetricLabelHighlightAMean";
    case "highlight_b_mean":
      return "workbenchMetricLabelHighlightBMean";
    case "highlight_neutral_distance_mean":
      return "workbenchMetricLabelHighlightNeutralDistanceMean";
    case "selection_coverage_ratio":
      return "workbenchMetricLabelSelectionCoverageRatio";
  }
};

const getMetricDescriptionKey = (key: WorkbenchMetricRow["key"]) => {
  switch (key) {
    case "l_mean":
      return "workbenchMetricDescriptionLMean";
    case "l_stddev":
      return "workbenchMetricDescriptionLStddev";
    case "l_p95":
      return "workbenchMetricDescriptionLP95";
    case "a_mean":
      return "workbenchMetricDescriptionAMean";
    case "b_mean":
      return "workbenchMetricDescriptionBMean";
    case "c_mean":
      return "workbenchMetricDescriptionCMean";
    case "c_p95":
      return "workbenchMetricDescriptionCP95";
    case "neutral_distance_mean":
      return "workbenchMetricDescriptionNeutralDistanceMean";
    case "highlight_a_mean":
      return "workbenchMetricDescriptionHighlightAMean";
    case "highlight_b_mean":
      return "workbenchMetricDescriptionHighlightBMean";
    case "highlight_neutral_distance_mean":
      return "workbenchMetricDescriptionHighlightNeutralDistanceMean";
    case "selection_coverage_ratio":
      return "workbenchMetricDescriptionSelectionCoverageRatio";
  }
};

const getMetricTooltipKey = (key: WorkbenchMetricRow["key"]) => {
  switch (key) {
    case "l_mean":
      return "workbenchMetricTooltipLMean";
    case "l_stddev":
      return "workbenchMetricTooltipLStddev";
    case "l_p95":
      return "workbenchMetricTooltipLP95";
    case "a_mean":
      return "workbenchMetricTooltipAMean";
    case "b_mean":
      return "workbenchMetricTooltipBMean";
    case "c_mean":
      return "workbenchMetricTooltipCMean";
    case "c_p95":
      return "workbenchMetricTooltipCP95";
    case "neutral_distance_mean":
      return "workbenchMetricTooltipNeutralDistanceMean";
    case "highlight_a_mean":
      return "workbenchMetricTooltipHighlightAMean";
    case "highlight_b_mean":
      return "workbenchMetricTooltipHighlightBMean";
    case "highlight_neutral_distance_mean":
      return "workbenchMetricTooltipHighlightNeutralDistanceMean";
    case "selection_coverage_ratio":
      return "workbenchMetricTooltipSelectionCoverageRatio";
  }
};

export const localizeMetricRows = (rows: WorkbenchMetricRow[]): WorkbenchMetricRow[] =>
  rows.map((row) => ({
    ...row,
    label: t(getMetricLabelKey(row.key)),
    description: t(getMetricDescriptionKey(row.key)),
    tooltip: t(getMetricTooltipKey(row.key)),
  }));

export const isVisibleMetricRow = (row: WorkbenchMetricRow) =>
  row.key !== "selection_coverage_ratio";

const hueDiverseThreshold = 8;
const hueModerateThreshold = 4;
const saturationHighThreshold = 0.55;
const saturationLowThreshold = 0.25;

export const getHueInsightLabel = (result: PhotoAnalysisResult): string => {
  const activeBins = result.hueHistogram.filter((bin) => bin.count > 0).length;
  if (activeBins >= hueDiverseThreshold) {
    return t("photoInsightHueBalanced");
  }
  if (activeBins >= hueModerateThreshold) {
    return t("photoInsightHueModerate");
  }
  return t("photoInsightHueNarrow");
};

export const getSaturationInsightLabel = (result: PhotoAnalysisResult): string => {
  const total = result.saturationHistogram.reduce((sum, bin) => sum + bin.count, 0);
  if (total === 0) {
    return t("photoInsightSatMid");
  }

  const weighted = result.saturationHistogram.reduce((sum, bin) => {
    const mid = (bin.start + bin.end) / 2;
    return sum + mid * bin.count;
  }, 0);

  const mean = weighted / total;
  if (mean >= saturationHighThreshold) {
    return t("photoInsightSatHigh");
  }
  if (mean <= saturationLowThreshold) {
    return t("photoInsightSatLow");
  }
  return t("photoInsightSatMid");
};

export type WorkbenchCopyFormat = ExportFormat;
