// Compatibility entrypoint. Add new photo-analysis logic under base/derived/selection/shared/export.

export type {
  ColorArea,
  DerivedAnalysisTimings,
  DerivedPhotoAnalysis,
  ExportFormat,
  HistogramBin,
  PhotoAnalysisHandle,
  PhotoAnalysisResult,
  PhotoAnalysisSummary,
  PhotoAnalysisTimings,
  PhotoSample,
  PhotoSelection,
  RgbCubePoint,
  TargetSelectionState,
  WorkbenchHistogramBin,
  WorkbenchHistogramMetric,
  WorkbenchMetricKey,
  WorkbenchMetricRow,
} from "@/domain/photo-analysis/shared/photo-analysis-types";

export {
  analyzePhoto,
  buildCubePointsFromSamples,
  buildCubePointsFromStore,
  buildHistogramBinsFromStore,
  buildMetricSummary,
  buildMetricSummaryFromStore,
  calculateColorAreasFromStore,
  createPhotoAnalysisHandle,
} from "@/domain/photo-analysis/base/photo-analysis-base";

export {
  buildDerivedPhotoAnalysis,
  buildDerivedPhotoAnalysisFromHandle,
  buildHistogramBins,
  buildMetricRows,
} from "@/domain/photo-analysis/derived/photo-analysis-derived";

export {
  buildPointSelection,
  buildRectangleSelection,
  getSelectedIndexes,
  getSelectedSamples,
  getSelectionIds,
} from "@/domain/photo-analysis/selection/photo-analysis-selection";

export {
  serializeHistogramBins,
  serializeMetricRows,
} from "@/domain/photo-analysis/export/photo-analysis-export";
