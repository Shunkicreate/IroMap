import { rgbToHsl, rgbToLab } from "@/domain/color/color-conversion";
import {
  colorChannelLevels,
  colorChannelMax,
  colorChannelMidpoint,
} from "@/domain/color/color-constants";
import { type ColorSpace3d, type RgbColor } from "@/domain/color/color-types";

export type Rotation = {
  x: number;
  y: number;
};

export type SpacePoint = {
  x: number;
  y: number;
  z: number;
};

export type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  color: RgbColor;
};

const colorSampleSteps = 16;
const colorSampleStepSize = colorChannelMax / (colorSampleSteps - 1);
const perspectiveOffset = 3;
const scaleRatio = 0.43;
export const labAxisRange = 128;
export const markerRadius = 2;
export const fullCircleRadians = Math.PI * 2;
export const rgbCubeColorCount = colorChannelLevels;

const toSpace = (value: number): number => {
  return value / colorChannelMidpoint - 1;
};

export const clampUnit = (value: number): number => {
  return Math.max(-1, Math.min(1, value));
};

export const rgbaFromGray = (gray: number, alpha: number): string => {
  return `rgba(${gray}, ${gray}, ${gray}, ${alpha})`;
};

const rotatePoint = (point: SpacePoint, rotation: Rotation): SpacePoint => {
  const cy = Math.cos(rotation.y);
  const sy = Math.sin(rotation.y);
  const cx = Math.cos(rotation.x);
  const sx = Math.sin(rotation.x);

  const x1 = point.x * cy + point.z * sy;
  const z1 = -point.x * sy + point.z * cy;
  const y2 = point.y * cx - z1 * sx;
  const z2 = point.y * sx + z1 * cx;

  return { x: x1, y: y2, z: z2 };
};

export const projectSpacePoint = (
  point: SpacePoint,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): { x: number; y: number; depth: number } => {
  const rotated = rotatePoint(point, rotation);
  const perspective = 1 / (rotated.z + perspectiveOffset);
  const scale = Math.min(width, height) * scaleRatio * objectScale;

  return {
    x: width / 2 + rotated.x * scale * perspective,
    y: height / 2 - rotated.y * scale * perspective,
    depth: rotated.z,
  };
};

export const toSpacePoint = (color: RgbColor, space: ColorSpace3d): SpacePoint => {
  if (space === "rgb") {
    return {
      x: toSpace(color.r),
      y: toSpace(color.g),
      z: toSpace(color.b),
    };
  }

  if (space === "hsl") {
    const hsl = rgbToHsl(color);
    const radian = (hsl.h / 180) * Math.PI;
    const radius = hsl.s / 100;
    return {
      x: radius * Math.cos(radian),
      y: hsl.l / 50 - 1,
      z: radius * Math.sin(radian),
    };
  }

  const lab = rgbToLab(color);
  return {
    x: clampUnit(lab.a / labAxisRange),
    y: clampUnit(lab.l / 50 - 1),
    z: clampUnit(lab.b / labAxisRange),
  };
};

export const projectColor = (
  color: RgbColor,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): ProjectedPoint => {
  const point = toSpacePoint(color, space);
  const projected = projectSpacePoint(point, rotation, width, height, objectScale);

  return {
    x: projected.x,
    y: projected.y,
    depth: projected.depth,
    color,
  };
};

export const sampledLevels = Array.from({ length: colorSampleSteps }, (_, index) =>
  Math.round(index * colorSampleStepSize)
);

export const getNearestProjectedColor = (
  points: ProjectedPoint[],
  offsetX: number,
  offsetY: number,
  maxDistanceSquared: number
): RgbColor | null => {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestColor: RgbColor | null = null;

  for (const point of points) {
    const dx = point.x - offsetX;
    const dy = point.y - offsetY;
    const squaredDistance = dx * dx + dy * dy;
    if (squaredDistance < bestDistance) {
      bestDistance = squaredDistance;
      bestColor = point.color;
    }
  }

  if (bestDistance > maxDistanceSquared) {
    return null;
  }

  return bestColor;
};
