import { rgbToHueAndSaturation, rgbToLab } from "@/domain/color/color-conversion";
import { colorChannelMax } from "@/domain/color/color-constants";
import type { LabColor, RgbColor } from "@/domain/color/color-types";

type PixelSample = {
  x: number;
  y: number;
  color: RgbColor;
};

export type ScatterPoint = {
  x: number;
  y: number;
  color: RgbColor;
};

export type HistogramBin = {
  start: number;
  end: number;
  count: number;
};

export type ColorArea = {
  label: string;
  ratio: number;
  rgb: RgbColor;
};

export type PhotoAnalysisResult = {
  scatter: ScatterPoint[];
  hueHistogram: HistogramBin[];
  saturationHistogram: HistogramBin[];
  colorAreas: ColorArea[];
  elapsedMs: number;
  sampledPixels: number;
};

const hueBinCount = 36;
const hueMax = 360;
const saturationBinCount = 20;
const topAreaCount = 5;
const quantizeBucketSize = 16;
const performanceSamplingThreshold = 100_000;
const maxSampleCount = 200_000;
const maxScatterPoints = 3000;
const rgbaStride = 4;
const alphaChannelOffset = 3;
const noAlpha = 0;
const ratioPercent = 100;
const ratioTolerance = 99.9;
const othersColorValue = 96;
const hueBucketDegrees = 10;
const minimumUnit = 1;

const createBins = (binCount: number, maxValue: number): HistogramBin[] => {
  const binSize = maxValue / binCount;
  return Array.from({ length: binCount }, (_, index) => {
    return {
      start: index * binSize,
      end: (index + 1) * binSize,
      count: 0,
    };
  });
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

const samplePixels = (imageData: ImageData, step: number, maxSamples: number): PixelSample[] => {
  const { data, width, height } = imageData;
  const sampled: PixelSample[] = [];

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

      sampled.push({
        x,
        y,
        color: {
          r: data[offset],
          g: data[offset + 1],
          b: data[offset + 2],
        },
      });
    }
  }

  return sampled;
};

const buildScatter = (samples: PixelSample[], maxPoints: number): ScatterPoint[] => {
  const step = Math.max(minimumUnit, Math.ceil(samples.length / maxPoints));
  const points: ScatterPoint[] = [];

  for (let index = 0; index < samples.length; index += step) {
    const sample = samples[index];
    const lab: LabColor = rgbToLab(sample.color);
    points.push({
      x: lab.a,
      y: lab.b,
      color: sample.color,
    });
  }

  return points;
};

const fillHistograms = (
  samples: PixelSample[]
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

const calculateColorAreas = (samples: PixelSample[]): ColorArea[] => {
  const bucketCounts = new Map<string, number>();

  for (const sample of samples) {
    const bucketColor = {
      r: quantizeComponent(sample.color.r),
      g: quantizeComponent(sample.color.g),
      b: quantizeComponent(sample.color.b),
    };
    const key = `${bucketColor.r}-${bucketColor.g}-${bucketColor.b}`;
    const count = bucketCounts.get(key) ?? 0;
    bucketCounts.set(key, count + 1);
  }

  const sorted = [...bucketCounts.entries()].sort((left, right) => right[1] - left[1]);
  const total = samples.length || minimumUnit;

  const top = sorted.slice(0, topAreaCount).map(([key, count]) => {
    const [rText, gText, bText] = key.split("-");
    const rgb = {
      r: Number(rText),
      g: Number(gText),
      b: Number(bText),
    };

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
      rgb: { r: othersColorValue, g: othersColorValue, b: othersColorValue },
    });
  }

  return top;
};

export const analyzePhoto = (imageData: ImageData): PhotoAnalysisResult => {
  const startAt = performance.now();
  const step = pickSamplingStep(imageData.width * imageData.height);
  const samples = samplePixels(imageData, step, maxSampleCount);
  const scatter = buildScatter(samples, maxScatterPoints);
  const { hue, saturation } = fillHistograms(samples);
  const colorAreas = calculateColorAreas(samples);

  return {
    scatter,
    hueHistogram: hue,
    saturationHistogram: saturation,
    colorAreas,
    elapsedMs: performance.now() - startAt,
    sampledPixels: samples.length,
  };
};
