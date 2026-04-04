import type { WorkbenchMetricKey } from "@/domain/photo-analysis/shared/photo-analysis-types";

// Shared constants used by both base analysis and derived analysis.

export const hueBinCount = 36;
export const hueMax = 360;
export const saturationBinCount = 20;
export const topAreaCount = 5;
export const quantizeBucketSize = 16;
export const performanceSamplingThreshold = 100_000;
export const rgbaStride = 4;
export const alphaChannelOffset = 3;
export const noAlpha = 0;
export const ratioPercent = 100;
export const ratioTolerance = 99.9;
export const othersColorValue = 96;
export const minimumUnit = 1;
export const maximumSamplingDensityPercent = 100;
export const minimumSamplingDensityPercent = 1;
export const legacySamplingDensityPercent = 0;
export const minimumTargetSampleCount = 1_200;
export const maximumTargetSampleCountBeforeFull = 100_000;
export const luminanceBinCount = 20;
export const luminanceMax = 100;
export const chromaBinCount = 20;
export const chromaMax = 150;
export const highlightThreshold = 80;

export const metricDefinitions: Array<{
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
