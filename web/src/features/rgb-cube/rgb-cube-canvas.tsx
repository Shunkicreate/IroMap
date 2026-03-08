"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  isRgbSliceAxis,
  toRgbColor,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import { clampRgb, rgbToHsl, rgbToLab } from "@/domain/color/color-conversion";
import {
  colorChannelLevels,
  colorChannelMax,
  colorChannelMidpoint,
  colorChannelMin,
} from "@/domain/color/color-constants";
import { t } from "@/i18n/translate";

type Rotation = {
  x: number;
  y: number;
};

type SpacePoint = {
  x: number;
  y: number;
  z: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  color: RgbColor;
};

type Props = {
  space: ColorSpace3d;
  rotation: Rotation;
  cubeSize: number;
  axisGuideMode: "visible" | "hidden";
  sliceAxis: SliceAxis;
  sliceValue: number;
  onRotationChange: (rotation: Rotation) => void;
  onHoverColorChange: (color: RgbColor | null) => void;
  onColorSelect: (color: RgbColor) => void;
};

const colorSampleSteps = 16;
const colorSampleStepSize = colorChannelMax / (colorSampleSteps - 1);
const neutralGray = 220;
const defaultAlpha = 0.5;
const planeFillAlpha = 0.05;
const planeStrokeAlpha = 0.45;
const textAlpha = 0.85;
const perspectiveOffset = 3;
const scaleRatio = 0.43;
const markerRadius = 2;
const fullCircleRadians = Math.PI * 2;
const nearestDistanceThresholdSquared = 64;
const rotationSensitivity = 0.01;
const overlayTextLeft = 14;
const resolutionTextTop = 22;
const secondOverlayTextTop = 40;
const hslGuideSegments = 12;
const labAxisRange = 128;
const defaultCubeSize = 400;

const levels = Array.from({ length: colorSampleSteps }, (_, index) =>
  Math.round(index * colorSampleStepSize)
);

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
  objectScale: number
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

const projectColor = (
  color: RgbColor,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale: number
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
  objectScale: number
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
  objectScale: number
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
  objectScale: number
): void => {
  drawGuideRgb(context, rotation, width, height, objectScale);
};

const getPlaneCorners = (axis: SliceAxis, value: number): RgbColor[] => {
  if (axis === "r") {
    return [
      toRgbColor(value, colorChannelMin, colorChannelMin),
      toRgbColor(value, colorChannelMax, colorChannelMin),
      toRgbColor(value, colorChannelMax, colorChannelMax),
      toRgbColor(value, colorChannelMin, colorChannelMax),
    ];
  }
  if (axis === "g") {
    return [
      toRgbColor(colorChannelMin, value, colorChannelMin),
      toRgbColor(colorChannelMax, value, colorChannelMin),
      toRgbColor(colorChannelMax, value, colorChannelMax),
      toRgbColor(colorChannelMin, value, colorChannelMax),
    ];
  }
  return [
    toRgbColor(colorChannelMin, colorChannelMin, value),
    toRgbColor(colorChannelMax, colorChannelMin, value),
    toRgbColor(colorChannelMax, colorChannelMax, value),
    toRgbColor(colorChannelMin, colorChannelMax, value),
  ];
};

const drawSlicePlane = (
  context: CanvasRenderingContext2D,
  rotation: Rotation,
  width: number,
  height: number,
  axis: SliceAxis,
  value: number,
  objectScale: number
): void => {
  if (!isRgbSliceAxis(axis)) {
    return;
  }

  const planeCorners = getPlaneCorners(axis, value).map((color) =>
    projectSpacePoint(toSpacePoint(color, "rgb"), rotation, width, height, objectScale)
  );

  context.beginPath();
  context.moveTo(planeCorners[0].x, planeCorners[0].y);
  context.lineTo(planeCorners[1].x, planeCorners[1].y);
  context.lineTo(planeCorners[2].x, planeCorners[2].y);
  context.lineTo(planeCorners[3].x, planeCorners[3].y);
  context.closePath();
  context.fillStyle = rgbaFromGray(colorChannelMax, planeFillAlpha);
  context.strokeStyle = rgbaFromGray(colorChannelMax, planeStrokeAlpha);
  context.lineWidth = 1.5;
  context.fill();
  context.stroke();
};

const drawGuide = (
  context: CanvasRenderingContext2D,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale: number
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

const getSpaceLabel = (space: ColorSpace3d): string => {
  if (space === "rgb") {
    return t("spaceRgb");
  }
  if (space === "hsl") {
    return t("spaceHsl");
  }
  return t("spaceLab");
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

const drawAxisGuide = (
  context: CanvasRenderingContext2D,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale: number
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

export function RgbCubeCanvas({
  space,
  rotation,
  cubeSize,
  axisGuideMode,
  sliceAxis,
  sliceValue,
  onRotationChange,
  onHoverColorChange,
  onColorSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ isDragging: boolean; x: number; y: number }>({
    isDragging: false,
    x: 0,
    y: 0,
  });
  const projectedPointsRef = useRef<ProjectedPoint[]>([]);

  const sampledColors = useMemo(() => {
    const colors: RgbColor[] = [];
    for (const r of levels) {
      for (const g of levels) {
        for (const b of levels) {
          colors.push(toRgbColor(r, g, b));
        }
      }
    }
    return colors;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * devicePixelRatio);
    canvas.height = Math.floor(height * devicePixelRatio);
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0e1118";
    context.fillRect(0, 0, width, height);

    const objectScale = cubeSize / defaultCubeSize;
    drawGuide(context, space, rotation, width, height, objectScale);
    if (axisGuideMode === "visible") {
      drawAxisGuide(context, space, rotation, width, height, objectScale);
    }
    if (space === "rgb" && isRgbSliceAxis(sliceAxis)) {
      drawSlicePlane(context, rotation, width, height, sliceAxis, sliceValue, objectScale);
    }

    const projected = sampledColors
      .map((color) => projectColor(color, space, rotation, width, height, objectScale))
      .sort((left, right) => left.depth - right.depth);

    projectedPointsRef.current = projected;

    for (const point of projected) {
      context.fillStyle = `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})`;
      context.beginPath();
      context.arc(point.x, point.y, markerRadius, 0, fullCircleRadians);
      context.fill();
    }

    context.fillStyle = rgbaFromGray(colorChannelMax, textAlpha);
    context.font = "12px monospace";
    context.fillText(
      t("cubeResolutionOverlay", { levels: colorChannelLevels }),
      overlayTextLeft,
      resolutionTextTop
    );
    if (space === "rgb" || space === "hsl") {
      context.fillText(
        t("cubeSliceOverlay", { axis: sliceAxis.toUpperCase(), value: sliceValue }),
        overlayTextLeft,
        secondOverlayTextTop
      );
    } else {
      context.fillText(
        t("cubeSpaceOverlay", { space: getSpaceLabel(space) }),
        overlayTextLeft,
        secondOverlayTextTop
      );
    }
  }, [axisGuideMode, cubeSize, rotation, sampledColors, sliceAxis, sliceValue, space]);

  const findNearestColor = (offsetX: number, offsetY: number): RgbColor | null => {
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestColor: RgbColor | null = null;

    for (const point of projectedPointsRef.current) {
      const dx = point.x - offsetX;
      const dy = point.y - offsetY;
      const squaredDistance = dx * dx + dy * dy;
      if (squaredDistance < bestDistance) {
        bestDistance = squaredDistance;
        bestColor = point.color;
      }
    }

    if (bestDistance > nearestDistanceThresholdSquared) {
      return null;
    }

    return bestColor;
  };

  const mapPointer = (event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const pointer = mapPointer(event);
    dragRef.current = { isDragging: true, x: pointer.x, y: pointer.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const pointer = mapPointer(event);

    const nearest = findNearestColor(pointer.x, pointer.y);
    onHoverColorChange(nearest ? clampRgb(nearest) : null);

    if (!dragRef.current.isDragging) {
      return;
    }

    const deltaX = pointer.x - dragRef.current.x;
    const deltaY = pointer.y - dragRef.current.y;
    dragRef.current.x = pointer.x;
    dragRef.current.y = pointer.y;

    onRotationChange({
      x: rotation.x - deltaY * rotationSensitivity,
      y: rotation.y + deltaX * rotationSensitivity,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const pointer = mapPointer(event);
    const nearest = findNearestColor(pointer.x, pointer.y);
    if (nearest) {
      onColorSelect(clampRgb(nearest));
    }

    dragRef.current.isDragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handlePointerLeave = (): void => {
    dragRef.current.isDragging = false;
    onHoverColorChange(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="cubeCanvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}
