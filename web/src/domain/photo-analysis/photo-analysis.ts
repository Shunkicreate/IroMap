import { rgbToHueAndSaturation, rgbToLab } from "@/domain/color/color-conversion";
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
const saturationBinCount = 20;
const topAreaCount = 5;

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
  return Math.floor(value / 16) * 16;
};

const buildAreaLabel = (color: RgbColor): string => {
  return `R${color.r}-G${color.g}-B${color.b}`;
};

const pickSamplingStep = (pixelCount: number): number => {
  if (pixelCount <= 100_000) {
    return 1;
  }
  return Math.ceil(Math.sqrt(pixelCount / 100_000));
};

const samplePixels = (imageData: ImageData, step: number, maxSamples: number): PixelSample[] => {
  const { data, width, height } = imageData;
  const sampled: PixelSample[] = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (sampled.length >= maxSamples) {
        return sampled;
      }

      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3] / 255;
      if (alpha === 0) {
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
  const step = Math.max(1, Math.ceil(samples.length / maxPoints));
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
  const hueBins = createBins(hueBinCount, 360);
  const saturationBins = createBins(saturationBinCount, 1);

  for (const sample of samples) {
    const { hue, saturation } = rgbToHueAndSaturation(sample.color);
    const hueIndex = Math.min(hueBinCount - 1, Math.floor(hue / 10));
    const saturationIndex = Math.min(
      saturationBinCount - 1,
      Math.floor(saturation * saturationBinCount)
    );

    hueBins[hueIndex].count += 1;
    saturationBins[saturationIndex].count += 1;
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
  const total = samples.length || 1;

  const top = sorted.slice(0, topAreaCount).map(([key, count]) => {
    const [rText, gText, bText] = key.split("-");
    const rgb = {
      r: Number(rText),
      g: Number(gText),
      b: Number(bText),
    };

    return {
      label: buildAreaLabel(rgb),
      ratio: (count / total) * 100,
      rgb,
    };
  });

  const summed = top.reduce((current, area) => current + area.ratio, 0);
  if (summed < 99.9 && sorted.length > topAreaCount) {
    top.push({
      label: "Others",
      ratio: 100 - summed,
      rgb: { r: 96, g: 96, b: 96 },
    });
  }

  return top;
};

export const analyzePhoto = (imageData: ImageData): PhotoAnalysisResult => {
  const startAt = performance.now();
  const step = pickSamplingStep(imageData.width * imageData.height);
  const samples = samplePixels(imageData, step, 200_000);
  const scatter = buildScatter(samples, 3000);
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
