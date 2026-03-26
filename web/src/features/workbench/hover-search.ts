"use client";

import { colorChannelMax } from "@/domain/color/color-constants";
import { type ColorSpace3d, type RgbColor, type SliceAxis } from "@/domain/color/color-types";
import { type PhotoSample, type RgbCubePoint } from "@/domain/photo-analysis/photo-analysis";
import {
  projectColor,
  type ProjectedPoint,
  type Rotation,
} from "@/features/rgb-cube/rgb-cube-projection";
import {
  findNearestSampleByCoordinate,
  type WorkbenchTarget,
} from "@/features/workbench/workbench-shared";

export type ProjectedMappedSample = {
  point: { x: number; y: number };
  sample: PhotoSample;
};

const getHueDistance = (left: number, right: number): number => {
  const distance = Math.abs(left - right);
  return Math.min(distance, 360 - distance);
};

const getSliceTolerance = (axis: SliceAxis): number => {
  if (axis === "h") {
    return 6;
  }
  if (axis === "s" || axis === "l" || axis === "lab-l") {
    return 2;
  }
  if (axis === "lab-a" || axis === "lab-b") {
    return 4;
  }
  return 4;
};

export const findNearestProjectedHoverColor = (
  points: ProjectedPoint[],
  x: number,
  y: number,
  maxDistanceSquared: number
): RgbColor | null => {
  let nearestColor: RgbColor | null = null;
  let nearestDistanceSquared = maxDistanceSquared;

  for (const point of points) {
    const dx = point.x - x;
    const dy = point.y - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestColor = point.color;
    }
  }

  return nearestColor;
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

export const projectSampleToSlice = (
  sample: PhotoSample,
  axis: SliceAxis,
  value: number
): { x: number; y: number } | null => {
  const tolerance = getSliceTolerance(axis);

  if (axis === "r") {
    if (Math.abs(sample.color.r - value) > tolerance) {
      return null;
    }
    return { x: sample.color.g, y: colorChannelMax - sample.color.b };
  }
  if (axis === "g") {
    if (Math.abs(sample.color.g - value) > tolerance) {
      return null;
    }
    return { x: sample.color.r, y: colorChannelMax - sample.color.b };
  }
  if (axis === "b") {
    if (Math.abs(sample.color.b - value) > tolerance) {
      return null;
    }
    return { x: sample.color.r, y: colorChannelMax - sample.color.g };
  }
  if (axis === "h") {
    if (getHueDistance(sample.hsl.h, value) > tolerance) {
      return null;
    }
    return {
      x: Math.round((sample.hsl.s / 100) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.l / 100) * colorChannelMax),
    };
  }
  if (axis === "s") {
    if (Math.abs(sample.hsl.s - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round((sample.hsl.h / 360) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.l / 100) * colorChannelMax),
    };
  }
  if (axis === "l") {
    if (Math.abs(sample.hsl.l - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round((sample.hsl.h / 360) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.s / 100) * colorChannelMax),
    };
  }
  if (axis === "lab-l") {
    if (Math.abs(sample.lab.l - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round(((sample.lab.a + 128) / 255) * colorChannelMax),
      y: colorChannelMax - Math.round(((sample.lab.b + 128) / 255) * colorChannelMax),
    };
  }
  if (axis === "lab-a") {
    if (Math.abs(sample.lab.a - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round(((sample.lab.b + 128) / 255) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.lab.l / 100) * colorChannelMax),
    };
  }
  if (Math.abs(sample.lab.b - value) > tolerance) {
    return null;
  }
  return {
    x: Math.round(((sample.lab.a + 128) / 255) * colorChannelMax),
    y: colorChannelMax - Math.round((sample.lab.l / 100) * colorChannelMax),
  };
};

export const findNearestSliceHoverColor = (
  samples: PhotoSample[],
  axis: SliceAxis,
  value: number,
  x: number,
  y: number,
  maxDistanceSquared: number
): RgbColor | null => {
  let nearestColor: RgbColor | null = null;
  let nearestDistanceSquared = maxDistanceSquared;

  for (const sample of samples) {
    const point = projectSampleToSlice(sample, axis, value);
    if (!point) {
      continue;
    }
    const dx = point.x - x;
    const dy = point.y - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestColor = sample.color;
    }
  }

  return nearestColor;
};

export const findNearestCubeHoverColor = ({
  cubePoints,
  space,
  rotation,
  width,
  height,
  objectScale,
  x,
  y,
  maxDistanceSquared,
}: {
  cubePoints: RgbCubePoint[];
  space: ColorSpace3d;
  rotation: Rotation;
  width: number;
  height: number;
  objectScale: number;
  x: number;
  y: number;
  maxDistanceSquared: number;
}): RgbColor | null => {
  let nearestColor: RgbColor | null = null;
  let nearestDistanceSquared = maxDistanceSquared;

  for (const point of cubePoints) {
    const projected = projectColor(point.color, space, rotation, width, height, objectScale);
    const dx = projected.x - x;
    const dy = projected.y - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestColor = point.color;
    }
  }

  return nearestColor;
};
