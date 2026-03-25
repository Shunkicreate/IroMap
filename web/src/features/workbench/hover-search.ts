import { type RgbColor } from "@/domain/color/color-types";
import {
  findNearestSampleByCoordinate,
  type WorkbenchTarget,
} from "@/features/workbench/workbench-shared";
import {
  getNearestProjectedColor,
  type ProjectedPoint,
} from "@/features/rgb-cube/rgb-cube-projection";
import { type PhotoSample } from "@/domain/photo-analysis/photo-analysis";

type ProjectedMappedSample = {
  point: { x: number; y: number };
  sample: PhotoSample;
};

export const findNearestProjectedHoverColor = (
  points: ProjectedPoint[],
  x: number,
  y: number,
  maxDistanceSquared: number
): RgbColor | null => {
  return getNearestProjectedColor(points, x, y, maxDistanceSquared);
};

export const findNearestMappedHoverColor = (
  projectedMappedSamples: ProjectedMappedSample[],
  x: number,
  y: number,
  maxDistanceSquared: number
): RgbColor | null => {
  let nearestColor: RgbColor | null = null;
  let nearestDistanceSquared = maxDistanceSquared;

  for (const projected of projectedMappedSamples) {
    const dx = projected.point.x - x;
    const dy = projected.point.y - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestColor = projected.sample.color;
    }
  }

  return nearestColor;
};

export const findNearestPreviewHoverSample = (
  target: WorkbenchTarget,
  x: number,
  y: number
): PhotoSample | null => {
  return findNearestSampleByCoordinate(target.result, x, y);
};
