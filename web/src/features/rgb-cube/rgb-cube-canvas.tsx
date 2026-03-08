"use client";

import { useEffect, useMemo, useRef } from "react";
import { toRgbColor, type RgbColor, type SliceAxis } from "@/domain/color/color-types";
import { clampRgb } from "@/domain/color/color-conversion";
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

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  color: RgbColor;
};

type Props = {
  rotation: Rotation;
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
const sliceTextTop = 40;

const levels = Array.from({ length: colorSampleSteps }, (_, index) =>
  Math.round(index * colorSampleStepSize)
);

const toSpace = (value: number): number => {
  return value / colorChannelMidpoint - 1;
};

const rgbaFromGray = (gray: number, alpha: number): string => {
  return `rgba(${gray}, ${gray}, ${gray}, ${alpha})`;
};

const projectColor = (
  color: RgbColor,
  rotation: Rotation,
  width: number,
  height: number
): ProjectedPoint => {
  const baseX = toSpace(color.r);
  const baseY = toSpace(color.g);
  const baseZ = toSpace(color.b);

  const cy = Math.cos(rotation.y);
  const sy = Math.sin(rotation.y);
  const cx = Math.cos(rotation.x);
  const sx = Math.sin(rotation.x);

  const x1 = baseX * cy + baseZ * sy;
  const z1 = -baseX * sy + baseZ * cy;
  const y2 = baseY * cx - z1 * sx;
  const z2 = baseY * sx + z1 * cx;

  const perspective = 1 / (z2 + perspectiveOffset);
  const scale = Math.min(width, height) * scaleRatio;

  return {
    x: width / 2 + x1 * scale * perspective,
    y: height / 2 - y2 * scale * perspective,
    depth: z2,
    color,
  };
};

const drawGuideCube = (
  context: CanvasRenderingContext2D,
  rotation: Rotation,
  width: number,
  height: number
): void => {
  const corners: RgbColor[] = [
    toRgbColor(colorChannelMin, colorChannelMin, colorChannelMin),
    toRgbColor(colorChannelMax, colorChannelMin, colorChannelMin),
    toRgbColor(colorChannelMin, colorChannelMax, colorChannelMin),
    toRgbColor(colorChannelMax, colorChannelMax, colorChannelMin),
    toRgbColor(colorChannelMin, colorChannelMin, colorChannelMax),
    toRgbColor(colorChannelMax, colorChannelMin, colorChannelMax),
    toRgbColor(colorChannelMin, colorChannelMax, colorChannelMax),
    toRgbColor(colorChannelMax, colorChannelMax, colorChannelMax),
  ];

  const projected = corners.map((color) => projectColor(color, rotation, width, height));
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
    const start = projected[from];
    const end = projected[to];
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
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
  value: number
): void => {
  const planeCorners = getPlaneCorners(axis, value).map((color) =>
    projectColor(color, rotation, width, height)
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

export function RgbCubeCanvas({
  rotation,
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

    drawGuideCube(context, rotation, width, height);
    drawSlicePlane(context, rotation, width, height, sliceAxis, sliceValue);

    const projected = sampledColors
      .map((color) => projectColor(color, rotation, width, height))
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
    context.fillText(
      t("cubeSliceOverlay", { axis: sliceAxis.toUpperCase(), value: sliceValue }),
      overlayTextLeft,
      sliceTextTop
    );
  }, [rotation, sampledColors, sliceAxis, sliceValue]);

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
      x: rotation.x + deltaY * rotationSensitivity,
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
