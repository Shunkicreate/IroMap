import {
  chromaBinCount,
  hueBinCount,
  hueMax,
  legacySamplingDensityPercent,
  luminanceBinCount,
  luminanceMax,
  maximumTargetSampleCountBeforeFull,
  maximumSamplingDensityPercent,
  minimumTargetSampleCount,
  minimumSamplingDensityPercent,
  minimumUnit,
  performanceSamplingThreshold,
  quantizeBucketSize,
  saturationBinCount,
  chromaMax,
  ratioPercent,
} from "@/domain/photo-analysis/shared/photo-analysis-constants";
import type { RgbColor } from "@/domain/color/color-types";
import type {
  HistogramBin,
  PhotoSample,
  WorkbenchHistogramMetric,
} from "@/domain/photo-analysis/shared/photo-analysis-types";

// Shared color-space helpers used by both base analysis and derived analysis.

export const createBins = (binCount: number, maxValue: number): HistogramBin[] => {
  const binSize = maxValue / binCount;
  return Array.from({ length: binCount }, (_, index) => ({
    start: index * binSize,
    end: (index + 1) * binSize,
    count: 0,
  }));
};

export const quantizeComponent = (value: number): number =>
  Math.floor(value / quantizeBucketSize) * quantizeBucketSize;

export const buildAreaLabel = (color: RgbColor): string => `R${color.r}-G${color.g}-B${color.b}`;

export const pickLegacySamplingStep = (pixelCount: number): number =>
  pixelCount <= performanceSamplingThreshold
    ? minimumUnit
    : Math.ceil(Math.sqrt(pixelCount / performanceSamplingThreshold));

const clampSamplingDensityPercent = (samplingDensityPercent: number): number =>
  Math.min(
    maximumSamplingDensityPercent,
    Math.max(minimumSamplingDensityPercent, samplingDensityPercent)
  );

const interpolateTargetSampleCount = (samplingDensityPercent: number): number => {
  if (samplingDensityPercent >= maximumSamplingDensityPercent) {
    return maximumTargetSampleCountBeforeFull;
  }
  const normalizedProgress =
    (samplingDensityPercent - minimumSamplingDensityPercent) /
    (maximumSamplingDensityPercent - minimumSamplingDensityPercent - minimumUnit);
  return Math.round(
    minimumTargetSampleCount +
      (maximumTargetSampleCountBeforeFull - minimumTargetSampleCount) *
        normalizedProgress *
        normalizedProgress
  );
};

export const samplingDensityPercentToStep = (
  samplingDensityPercent: number,
  pixelCount: number
): number => {
  const normalizedDensity = Math.min(
    maximumSamplingDensityPercent,
    Math.max(minimumSamplingDensityPercent, samplingDensityPercent)
  );
  if (normalizedDensity === maximumSamplingDensityPercent) {
    return minimumUnit;
  }
  const targetSampleCount = Math.min(pixelCount, interpolateTargetSampleCount(normalizedDensity));
  return Math.max(
    minimumUnit,
    Math.ceil(Math.sqrt(pixelCount / Math.max(minimumUnit, targetSampleCount)))
  );
};

export const samplingStepToDensityPercent = (samplingStep: number, pixelCount: number): number => {
  if (samplingStep <= minimumUnit) {
    return maximumSamplingDensityPercent;
  }
  let bestPercent = minimumSamplingDensityPercent;
  let smallestStepDifference = Number.POSITIVE_INFINITY;
  for (
    let percent = minimumSamplingDensityPercent;
    percent < maximumSamplingDensityPercent;
    percent += minimumUnit
  ) {
    const candidateStep = samplingDensityPercentToStep(percent, pixelCount);
    const stepDifference = Math.abs(candidateStep - samplingStep);
    if (stepDifference < smallestStepDifference) {
      smallestStepDifference = stepDifference;
      bestPercent = percent;
    }
  }
  return bestPercent;
};

export const resolveSamplingDensityPercent = (
  requestedSamplingDensityPercent: number,
  pixelCount: number
): number =>
  requestedSamplingDensityPercent === legacySamplingDensityPercent
    ? samplingStepToDensityPercent(pickLegacySamplingStep(pixelCount), pixelCount)
    : clampSamplingDensityPercent(requestedSamplingDensityPercent);

export const pickSamplingStep = (
  pixelCount: number,
  requestedSamplingDensityPercent: number
): { samplingDensityPercent: number; step: number } => {
  const samplingDensityPercent = resolveSamplingDensityPercent(
    requestedSamplingDensityPercent,
    pixelCount
  );
  return {
    samplingDensityPercent,
    step: samplingDensityPercentToStep(samplingDensityPercent, pixelCount),
  };
};

export const scaleLabComponent = (value: number): number => Math.round(value * 100);
export const unscaleLabComponent = (value: number): number => value / 100;
export const scaleHue = (value: number): number => Math.round(value * 10);
export const unscaleHue = (value: number): number => value / 10;
export const scaleSaturation = (value: number): number => Math.round(value * 100);
export const unscaleSaturation = (value: number): number => value / 100;
export const scaleLightness = (value: number): number => Math.round(value * 100);
export const unscaleLightness = (value: number): number => value / 100;

export const shouldUseWideCoordinates = (width: number, height: number): boolean =>
  width > 65_535 || height > 65_535;

export const getHistogramDefinition = (
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

export const selectMetricValue = (
  sample: PhotoSample,
  metric: WorkbenchHistogramMetric
): number => {
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
