import {
  chromaBinCount,
  hueBinCount,
  hueMax,
  legacySamplingDensityPercent,
  luminanceBinCount,
  luminanceMax,
  maximumSamplingDensityPercent,
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

export const samplingDensityPercentToStep = (samplingDensityPercent: number): number => {
  const normalizedDensity = Math.min(
    maximumSamplingDensityPercent,
    Math.max(minimumSamplingDensityPercent, samplingDensityPercent)
  );
  return Math.max(
    minimumUnit,
    Math.ceil(Math.sqrt(maximumSamplingDensityPercent / normalizedDensity))
  );
};

export const samplingStepToDensityPercent = (samplingStep: number): number =>
  Math.min(
    maximumSamplingDensityPercent,
    Math.max(
      minimumSamplingDensityPercent,
      Math.round(maximumSamplingDensityPercent / (samplingStep * samplingStep))
    )
  );

export const resolveSamplingDensityPercent = (
  requestedSamplingDensityPercent: number,
  pixelCount: number
): number =>
  requestedSamplingDensityPercent === legacySamplingDensityPercent
    ? samplingStepToDensityPercent(pickLegacySamplingStep(pixelCount))
    : Math.min(
        maximumSamplingDensityPercent,
        Math.max(minimumSamplingDensityPercent, requestedSamplingDensityPercent)
      );

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
    step: samplingDensityPercentToStep(samplingDensityPercent),
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
