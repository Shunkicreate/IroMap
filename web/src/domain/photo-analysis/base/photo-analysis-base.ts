import { toRgbColor } from "@/domain/color/color-types";
import {
  materializeSamples,
  samplePixelsToStore,
} from "@/domain/photo-analysis/base/photo-analysis-base-store";
import {
  buildAreaLabel,
  createBins,
  getHistogramDefinition,
  pickSamplingStep,
  quantizeComponent,
  unscaleHue,
  unscaleLabComponent,
  unscaleSaturation,
} from "@/domain/photo-analysis/shared/photo-analysis-color";
import {
  highlightThreshold,
  maxCubePointCount,
  minimumUnit,
  othersColorValue,
  ratioPercent,
  ratioTolerance,
  topAreaCount,
} from "@/domain/photo-analysis/shared/photo-analysis-constants";
import {
  mean,
  percentile,
  standardDeviation,
} from "@/domain/photo-analysis/shared/photo-analysis-math";
import type {
  ColorArea,
  HistogramBin,
  MetricSummary,
  PhotoAnalysisHandle,
  PhotoAnalysisResult,
  PhotoAnalysisTimings,
  PhotoSample,
  PhotoSampleBufferStore,
  RgbCubePoint,
  WorkbenchHistogramBin,
  WorkbenchHistogramMetric,
} from "@/domain/photo-analysis/shared/photo-analysis-types";

// Base analysis layer: builds full-image analysis results and worker handles.

export const buildMetricSummary = (samples: PhotoSample[]): MetricSummary => {
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

export const buildMetricSummaryFromStore = (
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

export const calculateColorAreasFromStore = (store: PhotoSampleBufferStore): ColorArea[] => {
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

export const buildCubePointsFromStore = (
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

export const buildHistogramBinsFromStore = (
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
  samplingStep,
  samplingDensityPercent,
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
  samplingStep: number;
  samplingDensityPercent: number;
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
  samplingStep,
  samplingDensityPercent,
  timings,
});

const now = (): number => performance.now();

export const createPhotoAnalysisHandle = ({
  imageData,
  samplingDensityPercent: requestedSamplingDensityPercent = 100,
}: {
  imageData: ImageData;
  samplingDensityPercent?: number;
}): PhotoAnalysisHandle => {
  const startAt = now();
  const { step, samplingDensityPercent } = pickSamplingStep(
    imageData.width * imageData.height,
    requestedSamplingDensityPercent
  );
  const samplingStartAt = now();
  const store = samplePixelsToStore(imageData, step);
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
      samplingStep: step,
      samplingDensityPercent,
    }),
    store,
    fullSummary: null,
    derivedBaseCache: null,
  };
};

export const analyzePhoto = (
  imageData: ImageData,
  samplingDensityPercent?: number
): PhotoAnalysisResult => createPhotoAnalysisHandle({ imageData, samplingDensityPercent }).result;

export const buildCubePointsFromSamples = (samples: PhotoSample[]): RgbCubePoint[] =>
  buildRgbCubePointsCore(samples, maxCubePointCount);
