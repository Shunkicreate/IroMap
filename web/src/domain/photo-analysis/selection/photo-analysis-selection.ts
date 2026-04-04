import type {
  PhotoSelection,
  PhotoAnalysisResult,
  PhotoSample,
  TargetSelectionState,
} from "@/domain/photo-analysis/shared/photo-analysis-types";
import type { RgbColor } from "@/domain/color/color-types";

// Selection layer: builds selections and extracts selected sample identities.

export const getSelectionIds = (
  selection: PhotoSelection | null | undefined
): Set<number> | null => {
  if (!selection || selection.sampleIds.length === 0) {
    return null;
  }
  return new Set(selection.sampleIds);
};

export const getSelectedIndexes = (
  selectionState: TargetSelectionState | null | undefined
): number[] => selectionState?.activeSelection?.sampleIds ?? [];

export const getSelectedSamples = (
  result: PhotoAnalysisResult,
  selectionState: TargetSelectionState | null | undefined
): PhotoSample[] => {
  const ids = getSelectionIds(selectionState?.activeSelection);
  if (!ids) {
    return [];
  }
  return result.samples.filter((sample) => ids.has(sample.sampleId));
};

export const buildRectangleSelection = ({
  result,
  targetId,
  bounds,
}: {
  result: PhotoAnalysisResult;
  targetId: string;
  bounds: { x: number; y: number; width: number; height: number };
}): PhotoSelection => {
  const minX = Math.min(bounds.x, bounds.x + bounds.width);
  const maxX = Math.max(bounds.x, bounds.x + bounds.width);
  const minY = Math.min(bounds.y, bounds.y + bounds.height);
  const maxY = Math.max(bounds.y, bounds.y + bounds.height);
  const sampleIds = result.samples
    .filter(
      (sample) => sample.x >= minX && sample.x <= maxX && sample.y >= minY && sample.y <= maxY
    )
    .map((sample) => sample.sampleId);

  return {
    selectionId: `${targetId}-${minX}-${minY}-${maxX}-${maxY}`,
    targetId,
    source: "image-rect",
    sampleIds,
    sampleCount: sampleIds.length,
    coverageRatio: result.samples.length === 0 ? 0 : sampleIds.length / result.samples.length,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
};

export const buildPointSelection = ({
  result,
  targetId,
  sampleId,
  source,
}: {
  result: PhotoAnalysisResult;
  targetId: string;
  sampleId: number;
  source: PhotoSelection["source"];
}): PhotoSelection => {
  const sample = result.samples.find((item) => item.sampleId === sampleId);
  return {
    selectionId: `${targetId}-${sampleId}`,
    targetId,
    source,
    sampleIds: sample ? [sampleId] : [],
    sampleCount: sample ? 1 : 0,
    coverageRatio: result.samples.length === 0 || !sample ? 0 : 1 / result.samples.length,
    bounds: sample ? { x: sample.x, y: sample.y, width: 1, height: 1 } : undefined,
  };
};

export const buildColorSelection = ({
  result,
  targetId,
  color,
  source,
}: {
  result: PhotoAnalysisResult;
  targetId: string;
  color: RgbColor;
  source: Extract<PhotoSelection["source"], "color-space-pick" | "slice-pick">;
}): PhotoSelection => {
  const sampleIds = result.samples
    .filter(
      (sample) =>
        sample.color.r === color.r && sample.color.g === color.g && sample.color.b === color.b
    )
    .map((sample) => sample.sampleId);
  return {
    selectionId: `${targetId}-${source}-${color.r}-${color.g}-${color.b}`,
    targetId,
    source,
    sampleIds,
    sampleCount: sampleIds.length,
    coverageRatio: result.samples.length === 0 ? 0 : sampleIds.length / result.samples.length,
  };
};
