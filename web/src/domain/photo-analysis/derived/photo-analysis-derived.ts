import {
  buildCubePointsFromSamples,
  buildCubePointsFromStore,
  buildHistogramBinsFromStore,
  buildMetricSummary,
  buildMetricSummaryFromStore,
} from "@/domain/photo-analysis/base/photo-analysis-base";
import { materializeSamples } from "@/domain/photo-analysis/base/photo-analysis-base-store";
import {
  buildDerivedSelectionKernelResult,
  disposeCubePointKernelIndexes,
  materializeCubePoints,
  registerCubePointKernelIndexes,
} from "@/domain/photo-analysis/cube-point-kernel/cube-point-kernel";
import {
  maxCubePointCount,
  quantizeBucketSize,
} from "@/domain/photo-analysis/shared/photo-analysis-constants";
import type {
  DerivedPhotoAnalysis,
  PhotoAnalysisHandle,
  PhotoAnalysisResult,
  TargetSelectionState,
  WorkbenchMetricRow,
} from "@/domain/photo-analysis/shared/photo-analysis-types";
import {
  buildDerivedBaseCache,
  buildMetricRowsFromSummary,
  replaceSelectionCoverageMetric,
} from "@/domain/photo-analysis/derived/photo-analysis-derived-base-cache";
import {
  getSelectedIndexes,
  getSelectedSamples,
} from "@/domain/photo-analysis/selection/photo-analysis-selection";

// Derived analysis layer: rebuilds UI-facing selection views without recomputing full-image data.

export { buildHistogramBins } from "@/domain/photo-analysis/derived/photo-analysis-derived-base-cache";

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
  const baseCache = buildDerivedBaseCache({ result });
  const metricRows = replaceSelectionCoverageMetric({
    metricRows: baseCache.metricRows,
    sampleCount: result.samples.length,
    selectionCount: selectedSamples.length,
  });
  const metricsMs = now() - metricsStartAt;

  const cubePointsStartAt = now();
  const selectionCubePoints = buildCubePointsFromSamples(selectedSamples);
  const cubePointsMs = now() - cubePointsStartAt;

  return {
    selectedSamples,
    metricRows,
    luminanceHistogram: baseCache.luminanceHistogram,
    hueHistogram: baseCache.hueHistogram,
    saturationHistogram: baseCache.saturationHistogram,
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
  if (!handle.derivedBaseCache) {
    handle.derivedBaseCache = {
      metricRows: buildMetricRowsFromSummary({
        summary: handle.fullSummary,
        sampleCount: handle.store.count,
        selectionCount: 0,
      }),
      luminanceHistogram: buildHistogramBinsFromStore(handle.store, "luminance"),
      hueHistogram: buildHistogramBinsFromStore(handle.store, "hue"),
      saturationHistogram: buildHistogramBinsFromStore(handle.store, "saturation"),
    };
  }

  const selectionStartAt = now();
  const selectedIndexes = getSelectedIndexes(selectionState);
  const selectedSamples = materializeSamples(handle.store, selectedIndexes);
  const selectionId = selectionState?.activeSelection?.selectionId ?? null;
  if (handle.cubePointKernelSelectionId !== selectionId) {
    disposeCubePointKernelIndexes(handle.cubePointKernelSelectionStoreId);
    handle.cubePointKernelSelectionStoreId = selectionId
      ? (registerCubePointKernelIndexes(selectedIndexes)?.storeId ?? null)
      : null;
    handle.cubePointKernelSelectionId = selectionId;
  }
  const selectionMs = now() - selectionStartAt;

  const metricsStartAt = now();
  const metricRows = replaceSelectionCoverageMetric({
    metricRows: handle.derivedBaseCache.metricRows,
    sampleCount: handle.store.count,
    selectionCount: selectedIndexes.length,
  });
  const metricsMs = now() - metricsStartAt;

  const cubePointsStartAt = now();
  const derivedSelection = buildDerivedSelectionKernelResult({
    registeredStoreId: handle.cubePointKernelStoreId,
    registeredIndexesId: handle.cubePointKernelSelectionStoreId,
    bucketSize: quantizeBucketSize,
    maxPoints: maxCubePointCount,
  });
  const selectionCubePoints = derivedSelection
    ? materializeCubePoints(derivedSelection)
    : buildCubePointsFromStore(handle.store, selectedIndexes, handle.cubePointKernelStoreId);
  const cubePointsMs = now() - cubePointsStartAt;

  return {
    selectedSamples,
    metricRows,
    luminanceHistogram: handle.derivedBaseCache.luminanceHistogram,
    hueHistogram: handle.derivedBaseCache.hueHistogram,
    saturationHistogram: handle.derivedBaseCache.saturationHistogram,
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
