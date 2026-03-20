import { rgbToHsl, rgbToLab } from "@/domain/color/color-conversion";
import {
  colorChannelLevels,
  colorChannelMax,
  colorChannelMidpoint,
  colorChannelMin,
} from "@/domain/color/color-constants";
import {
  isHslSliceAxis,
  isLabSliceAxis,
  isRgbSliceAxis,
  toRgbColor,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";

export type Rotation = {
  x: number;
  y: number;
};

type SpacePoint = {
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
const neutralGray = 220;
const defaultAlpha = 0.5;
const planeFillAlpha = 0.05;
const planeStrokeAlpha = 0.45;
const perspectiveOffset = 3;
const scaleRatio = 0.43;
const hslGuideSegments = 12;
const sliceSurfaceSegments = 24;
const labAxisRange = 128;

export const markerRadius = 2;
export const fullCircleRadians = Math.PI * 2;

const toSpace = (value: number): number => {
  return value / colorChannelMidpoint - 1;
};

const clampUnit = (value: number): number => {
  return Math.max(-1, Math.min(1, value));
};

const rgbaFromGray = (gray: number, alpha: number): string => {
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

const projectSpacePoint = (
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

const toSpacePoint = (color: RgbColor, space: ColorSpace3d): SpacePoint => {
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

const drawLine = (
  context: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number }
): void => {
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
};

const drawGuideRgb = (
  context: CanvasRenderingContext2D,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): void => {
  const corners: SpacePoint[] = [
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: -1, y: 1, z: 1 },
    { x: 1, y: 1, z: 1 },
  ];

  const projected = corners.map((point) =>
    projectSpacePoint(point, rotation, width, height, objectScale)
  );
  const edgePairs = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [4, 5],
    [4, 6],
    [5, 7],
    [6, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  context.lineWidth = 1;
  context.strokeStyle = rgbaFromGray(neutralGray, defaultAlpha);

  for (const [from, to] of edgePairs) {
    drawLine(context, projected[from], projected[to]);
  }
};

const drawGuideHsl = (
  context: CanvasRenderingContext2D,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): void => {
  context.lineWidth = 1;
  context.strokeStyle = rgbaFromGray(neutralGray, defaultAlpha);

  const topRing: { x: number; y: number }[] = [];
  const bottomRing: { x: number; y: number }[] = [];

  for (let index = 0; index <= hslGuideSegments; index += 1) {
    const ratio = index / hslGuideSegments;
    const radian = ratio * fullCircleRadians;
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    const top = projectSpacePoint({ x: cos, y: 1, z: sin }, rotation, width, height, objectScale);
    const bottom = projectSpacePoint(
      { x: cos, y: -1, z: sin },
      rotation,
      width,
      height,
      objectScale
    );
    topRing.push(top);
    bottomRing.push(bottom);

    if (index > 0) {
      drawLine(context, topRing[index - 1], top);
      drawLine(context, bottomRing[index - 1], bottom);
    }
  }

  const axisRadians = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
  for (const radian of axisRadians) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    const top = projectSpacePoint({ x: cos, y: 1, z: sin }, rotation, width, height, objectScale);
    const bottom = projectSpacePoint(
      { x: cos, y: -1, z: sin },
      rotation,
      width,
      height,
      objectScale
    );
    drawLine(context, bottom, top);
  }
};

const drawGuideLab = (
  context: CanvasRenderingContext2D,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): void => {
  drawGuideRgb(context, rotation, width, height, objectScale);
  context.lineWidth = 1;
  context.strokeStyle = rgbaFromGray(neutralGray, 0.35);

  const centerX = projectSpacePoint({ x: 0, y: -1, z: 0 }, rotation, width, height, objectScale);
  const centerY = projectSpacePoint({ x: 0, y: 1, z: 0 }, rotation, width, height, objectScale);
  const centerZ1 = projectSpacePoint({ x: -1, y: 0, z: 0 }, rotation, width, height, objectScale);
  const centerZ2 = projectSpacePoint({ x: 1, y: 0, z: 0 }, rotation, width, height, objectScale);
  const centerX1 = projectSpacePoint({ x: 0, y: 0, z: -1 }, rotation, width, height, objectScale);
  const centerX2 = projectSpacePoint({ x: 0, y: 0, z: 1 }, rotation, width, height, objectScale);

  drawLine(context, centerX, centerY);
  drawLine(context, centerZ1, centerZ2);
  drawLine(context, centerX1, centerX2);
};

const drawProjectedPolygon = (
  context: CanvasRenderingContext2D,
  projected: Array<{ x: number; y: number }>
): void => {
  if (projected.length < 3) {
    return;
  }
  context.beginPath();
  context.moveTo(projected[0].x, projected[0].y);
  for (let index = 1; index < projected.length; index += 1) {
    context.lineTo(projected[index].x, projected[index].y);
  }
  context.closePath();
  context.fillStyle = rgbaFromGray(colorChannelMax, planeFillAlpha);
  context.strokeStyle = rgbaFromGray(colorChannelMax, planeStrokeAlpha);
  context.lineWidth = 1.5;
  context.fill();
  context.stroke();
};

const toHslRadius = (value: number): number => {
  return clampUnit(Math.max(0, Math.min(1, value / 100)));
};

const toHslHeight = (value: number): number => {
  return clampUnit(value / 50 - 1);
};

const toLabHeight = (value: number): number => {
  return clampUnit(value / 50 - 1);
};

const toLabChannel = (value: number): number => {
  return clampUnit(value / labAxisRange);
};

const getRgbPlaneCorners = (axis: SliceAxis, value: number): SpacePoint[] => {
  if (axis === "r") {
    return [
      toSpacePoint(toRgbColor(value, colorChannelMin, colorChannelMin), "rgb"),
      toSpacePoint(toRgbColor(value, colorChannelMax, colorChannelMin), "rgb"),
      toSpacePoint(toRgbColor(value, colorChannelMax, colorChannelMax), "rgb"),
      toSpacePoint(toRgbColor(value, colorChannelMin, colorChannelMax), "rgb"),
    ];
  }
  if (axis === "g") {
    return [
      toSpacePoint(toRgbColor(colorChannelMin, value, colorChannelMin), "rgb"),
      toSpacePoint(toRgbColor(colorChannelMax, value, colorChannelMin), "rgb"),
      toSpacePoint(toRgbColor(colorChannelMax, value, colorChannelMax), "rgb"),
      toSpacePoint(toRgbColor(colorChannelMin, value, colorChannelMax), "rgb"),
    ];
  }
  return [
    toSpacePoint(toRgbColor(colorChannelMin, colorChannelMin, value), "rgb"),
    toSpacePoint(toRgbColor(colorChannelMax, colorChannelMin, value), "rgb"),
    toSpacePoint(toRgbColor(colorChannelMax, colorChannelMax, value), "rgb"),
    toSpacePoint(toRgbColor(colorChannelMin, colorChannelMax, value), "rgb"),
  ];
};

export const drawSlicePlane = (
  context: CanvasRenderingContext2D,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  axis: SliceAxis,
  value: number,
  objectScale = 1
): void => {
  if (space === "rgb" && isRgbSliceAxis(axis)) {
    const planeCorners = getRgbPlaneCorners(axis, value).map((point) =>
      projectSpacePoint(point, rotation, width, height, objectScale)
    );
    drawProjectedPolygon(context, planeCorners);
    return;
  }

  if (space === "hsl" && isHslSliceAxis(axis)) {
    if (axis === "h") {
      const radian = (value / 180) * Math.PI;
      const cos = Math.cos(radian);
      const sin = Math.sin(radian);
      const corners: SpacePoint[] = [
        { x: 0, y: -1, z: 0 },
        { x: cos, y: -1, z: sin },
        { x: cos, y: 1, z: sin },
        { x: 0, y: 1, z: 0 },
      ];
      const projected = corners.map((point) =>
        projectSpacePoint(point, rotation, width, height, objectScale)
      );
      drawProjectedPolygon(context, projected);
      return;
    }

    if (axis === "l") {
      const y = toHslHeight(value);
      const ring: SpacePoint[] = [];
      for (let index = 0; index <= sliceSurfaceSegments; index += 1) {
        const radian = (index / sliceSurfaceSegments) * fullCircleRadians;
        ring.push({ x: Math.cos(radian), y, z: Math.sin(radian) });
      }
      const projected = ring.map((point) =>
        projectSpacePoint(point, rotation, width, height, objectScale)
      );
      drawProjectedPolygon(context, projected);
      return;
    }

    const radius = toHslRadius(value);
    if (radius <= 0) {
      const bottom = projectSpacePoint({ x: 0, y: -1, z: 0 }, rotation, width, height, objectScale);
      const top = projectSpacePoint({ x: 0, y: 1, z: 0 }, rotation, width, height, objectScale);
      context.strokeStyle = rgbaFromGray(colorChannelMax, planeStrokeAlpha);
      context.lineWidth = 1.5;
      drawLine(context, bottom, top);
      return;
    }
    for (let index = 0; index < sliceSurfaceSegments; index += 1) {
      const from = (index / sliceSurfaceSegments) * fullCircleRadians;
      const to = ((index + 1) / sliceSurfaceSegments) * fullCircleRadians;
      const quad: SpacePoint[] = [
        { x: radius * Math.cos(from), y: -1, z: radius * Math.sin(from) },
        { x: radius * Math.cos(to), y: -1, z: radius * Math.sin(to) },
        { x: radius * Math.cos(to), y: 1, z: radius * Math.sin(to) },
        { x: radius * Math.cos(from), y: 1, z: radius * Math.sin(from) },
      ];
      const projected = quad.map((point) =>
        projectSpacePoint(point, rotation, width, height, objectScale)
      );
      drawProjectedPolygon(context, projected);
    }
    return;
  }

  if (space === "lab" && isLabSliceAxis(axis)) {
    const corners: SpacePoint[] =
      axis === "lab-l"
        ? [
            { x: -1, y: toLabHeight(value), z: -1 },
            { x: 1, y: toLabHeight(value), z: -1 },
            { x: 1, y: toLabHeight(value), z: 1 },
            { x: -1, y: toLabHeight(value), z: 1 },
          ]
        : axis === "lab-a"
          ? [
              { x: toLabChannel(value), y: -1, z: -1 },
              { x: toLabChannel(value), y: -1, z: 1 },
              { x: toLabChannel(value), y: 1, z: 1 },
              { x: toLabChannel(value), y: 1, z: -1 },
            ]
          : [
              { x: -1, y: -1, z: toLabChannel(value) },
              { x: 1, y: -1, z: toLabChannel(value) },
              { x: 1, y: 1, z: toLabChannel(value) },
              { x: -1, y: 1, z: toLabChannel(value) },
            ];

    const projected = corners.map((point) =>
      projectSpacePoint(point, rotation, width, height, objectScale)
    );
    drawProjectedPolygon(context, projected);
  }
};

export const drawGuide = (
  context: CanvasRenderingContext2D,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): void => {
  if (space === "rgb") {
    drawGuideRgb(context, rotation, width, height, objectScale);
    return;
  }
  if (space === "hsl") {
    drawGuideHsl(context, rotation, width, height, objectScale);
    return;
  }
  drawGuideLab(context, rotation, width, height, objectScale);
};

const getAxisLabels = (space: ColorSpace3d): { x: string; y: string; z: string } => {
  if (space === "rgb") {
    return { x: "R", y: "G", z: "B" };
  }
  if (space === "hsl") {
    return { x: "S·cos(H)", y: "L", z: "S·sin(H)" };
  }
  return { x: "a", y: "L", z: "b" };
};

export const drawAxisGuide = (
  context: CanvasRenderingContext2D,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): void => {
  const origin = projectSpacePoint({ x: 0, y: 0, z: 0 }, rotation, width, height, objectScale);
  const xAxis = projectSpacePoint({ x: 1, y: 0, z: 0 }, rotation, width, height, objectScale);
  const yAxis = projectSpacePoint({ x: 0, y: 1, z: 0 }, rotation, width, height, objectScale);
  const zAxis = projectSpacePoint({ x: 0, y: 0, z: 1 }, rotation, width, height, objectScale);
  const labels = getAxisLabels(space);

  context.lineWidth = 1.4;
  context.font = "11px monospace";

  context.strokeStyle = "rgba(255, 107, 107, 0.9)";
  drawLine(context, origin, xAxis);
  context.fillStyle = "rgba(255, 128, 128, 0.95)";
  context.fillText(labels.x, xAxis.x + 6, xAxis.y - 6);

  context.strokeStyle = "rgba(107, 224, 152, 0.9)";
  drawLine(context, origin, yAxis);
  context.fillStyle = "rgba(137, 235, 173, 0.95)";
  context.fillText(labels.y, yAxis.x + 6, yAxis.y - 6);

  context.strokeStyle = "rgba(120, 186, 255, 0.9)";
  drawLine(context, origin, zAxis);
  context.fillStyle = "rgba(156, 206, 255, 0.95)";
  context.fillText(labels.z, zAxis.x + 6, zAxis.y - 6);
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

export const rgbCubeColorCount = colorChannelLevels;
