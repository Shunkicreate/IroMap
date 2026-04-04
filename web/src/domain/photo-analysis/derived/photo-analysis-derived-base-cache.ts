import { buildMetricSummary } from "@/domain/photo-analysis/base/photo-analysis-base";
import {
  createBins,
  getHistogramDefinition,
  selectMetricValue,
} from "@/domain/photo-analysis/shared/photo-analysis-color";
import { minimumUnit } from "@/domain/photo-analysis/shared/photo-analysis-constants";
import {
  metricDefinitions,
  ratioPercent,
} from "@/domain/photo-analysis/shared/photo-analysis-constants";
import type {
  DerivedBaseCache,
  MetricSummary,
  PhotoAnalysisResult,
  PhotoSample,
  WorkbenchHistogramBin,
  WorkbenchHistogramMetric,
  WorkbenchMetricRow,
} from "@/domain/photo-analysis/shared/photo-analysis-types";

// Derived cache layer: builds reusable full-image display data.

export const buildMetricRowsFromSummary = ({
  summary,
  sampleCount,
  selectionCount,
}: {
  summary: MetricSummary;
  sampleCount: number;
  selectionCount: number;
}): WorkbenchMetricRow[] =>
  metricDefinitions.map((definition) => {
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

export const replaceSelectionCoverageMetric = ({
  metricRows,
  sampleCount,
  selectionCount,
}: {
  metricRows: WorkbenchMetricRow[];
  sampleCount: number;
  selectionCount: number;
}): WorkbenchMetricRow[] =>
  metricRows.map((row) =>
    row.key === "selection_coverage_ratio"
      ? {
          ...row,
          value:
            selectionCount > 0 && sampleCount > 0
              ? (selectionCount / sampleCount) * ratioPercent
              : null,
        }
      : row
  );

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

export const buildDerivedBaseCache = ({
  result,
  summary,
}: {
  result: PhotoAnalysisResult;
  summary?: MetricSummary;
}): DerivedBaseCache => {
  const resolvedSummary = summary ?? buildMetricSummary(result.samples);
  return {
    metricRows: buildMetricRowsFromSummary({
      summary: resolvedSummary,
      sampleCount: result.samples.length,
      selectionCount: 0,
    }),
    luminanceHistogram: buildHistogramBins(result.samples, "luminance"),
    hueHistogram: buildHistogramBins(result.samples, "hue"),
    saturationHistogram: buildHistogramBins(result.samples, "saturation"),
  };
};
