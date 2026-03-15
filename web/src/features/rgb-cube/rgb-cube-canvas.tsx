"use client";

import { useEffect, useMemo, useRef } from "react";
import { clampRgb } from "@/domain/color/color-conversion";
import {
  type ColorSpace3d,
  toRgbColor,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import { type RgbCubePoint } from "@/domain/photo-analysis/photo-analysis";
import { t } from "@/i18n/translate";
import {
  drawAxisGuide,
  drawGuide,
  drawSlicePlane,
  fullCircleRadians,
  getNearestProjectedColor,
  markerRadius,
  projectColor,
  rgbCubeColorCount,
  sampledLevels,
  type ProjectedPoint,
  type Rotation,
} from "@/features/rgb-cube/rgb-cube-core";

type Props = {
  space: ColorSpace3d;
  rotation: Rotation;
  cubeSize: number;
  axisGuideMode: "visible" | "hidden";
  sliceAxis: SliceAxis;
  sliceValue: number;
  imageCubePoints: RgbCubePoint[];
  compareCubePoints?: RgbCubePoint[];
  selectionCubePoints?: RgbCubePoint[];
  hoverColor?: RgbColor | null;
  selectedColor?: RgbColor | null;
  overlayMode: "grid" | "image" | "both";
  onRotationChange: (rotation: Rotation) => void;
  onHoverColorChange: (color: RgbColor | null) => void;
  onColorSelect: (color: RgbColor) => void;
};

const nearestDistanceThresholdSquared = 64;
const rotationSensitivity = 0.01;
const overlayTextLeft = 14;
const resolutionTextTop = 22;
const secondOverlayTextTop = 40;
const thirdOverlayTextTop = 58;
const textAlpha = 0.85;
const defaultCubeSize = 400;
const minCubeSize = 320;
const maxCubeSize = 900;
const cubeSizeStep = 10;
const imageOverlayMinAlpha = 0.45;
const imageOverlayMaxAlpha = 1;
const imageOverlayMinRadius = 2.8;
const imageOverlayMaxRadius = 7.2;
const imageOverlayStrokeAlpha = 0.9;
const imageOverlayStrokeWidth = 0.8;
const compareOverlayStroke = "#f4b942";
const selectionOverlayStroke = "#f97316";
const hoverOverlayStroke = "#ffffff";
const selectionOverlayRadiusOffset = 2.2;
const compareOverlayRadiusOffset = 1.6;
const focusOverlayRadius = 6.5;

const getSliceAxisLabel = (axis: SliceAxis): string => {
  if (axis === "lab-l") {
    return "L*";
  }
  if (axis === "lab-a") {
    return "a";
  }
  if (axis === "lab-b") {
    return "b";
  }
  return axis.toUpperCase();
};

const mapPointer = (event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
};

export function RgbCubeCanvas({
  space,
  rotation,
  cubeSize,
  axisGuideMode,
  sliceAxis,
  sliceValue,
  imageCubePoints,
  compareCubePoints = [],
  selectionCubePoints = [],
  hoverColor = null,
  selectedColor = null,
  overlayMode,
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
  const normalizedCubeSize =
    Math.round(Math.min(maxCubeSize, Math.max(minCubeSize, cubeSize)) / cubeSizeStep) *
    cubeSizeStep;
  const canvasWrapClassName = `cubeCanvasWrap cubeCanvasWrapSize${normalizedCubeSize}`;

  const sampledColors = useMemo(() => {
    const colors: RgbColor[] = [];
    for (const r of sampledLevels) {
      for (const g of sampledLevels) {
        for (const b of sampledLevels) {
          colors.push(toRgbColor(r, g, b));
        }
      }
    }
    return colors;
  }, []);

  const hasGridOverlay = overlayMode === "grid" || overlayMode === "both";
  const hasImageOverlay = overlayMode === "image" || overlayMode === "both";

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
    drawSlicePlane(context, space, rotation, width, height, sliceAxis, sliceValue, objectScale);

    const projectedGrid = hasGridOverlay
      ? sampledColors
          .map((color) => projectColor(color, space, rotation, width, height, objectScale))
          .sort((left, right) => left.depth - right.depth)
      : [];

    const maxImageCount = imageCubePoints.reduce((max, point) => Math.max(max, point.count), 1);
    const projectedImage = hasImageOverlay
      ? imageCubePoints
          .map((point) => ({
            ...projectColor(point.color, space, rotation, width, height, objectScale),
            count: point.count,
            ratio: point.ratio,
          }))
          .sort((left, right) => left.depth - right.depth)
      : [];

    const projectedCompare = hasImageOverlay
      ? compareCubePoints
          .map((point) => ({
            ...projectColor(point.color, space, rotation, width, height, objectScale),
            count: point.count,
          }))
          .sort((left, right) => left.depth - right.depth)
      : [];

    const projectedSelection = selectionCubePoints
      .map((point) => ({
        ...projectColor(point.color, space, rotation, width, height, objectScale),
        count: point.count,
      }))
      .sort((left, right) => left.depth - right.depth);

    projectedPointsRef.current = [...projectedGrid, ...projectedImage, ...projectedCompare];

    for (const point of projectedGrid) {
      context.fillStyle = `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})`;
      context.beginPath();
      context.arc(point.x, point.y, markerRadius, 0, fullCircleRadians);
      context.fill();
    }

    for (const point of projectedImage) {
      const intensity = point.count / maxImageCount;
      const radius =
        imageOverlayMinRadius + (imageOverlayMaxRadius - imageOverlayMinRadius) * intensity;
      const alpha =
        imageOverlayMinAlpha + (imageOverlayMaxAlpha - imageOverlayMinAlpha) * intensity;
      context.fillStyle = `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, ${alpha})`;
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, fullCircleRadians);
      context.fill();
      context.strokeStyle = `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, ${imageOverlayStrokeAlpha})`;
      context.lineWidth = imageOverlayStrokeWidth;
      context.stroke();
    }

    for (const point of projectedCompare) {
      const intensity = point.count / maxImageCount;
      const radius =
        imageOverlayMinRadius + (imageOverlayMaxRadius - imageOverlayMinRadius) * intensity;
      context.strokeStyle = compareOverlayStroke;
      context.lineWidth = 1.4;
      context.beginPath();
      context.arc(point.x, point.y, radius + compareOverlayRadiusOffset, 0, fullCircleRadians);
      context.stroke();
    }

    const maxSelectionCount = projectedSelection.reduce(
      (current, point) => Math.max(current, point.count),
      1
    );
    for (const point of projectedSelection) {
      const intensity = point.count / maxSelectionCount;
      const radius =
        imageOverlayMinRadius + (imageOverlayMaxRadius - imageOverlayMinRadius) * intensity;
      context.strokeStyle = selectionOverlayStroke;
      context.lineWidth = 1.6;
      context.beginPath();
      context.arc(point.x, point.y, radius + selectionOverlayRadiusOffset, 0, fullCircleRadians);
      context.stroke();
    }

    const drawFocusRing = (color: RgbColor | null | undefined, strokeStyle: string): void => {
      if (!color) {
        return;
      }
      const point = projectColor(color, space, rotation, width, height, objectScale);
      context.strokeStyle = strokeStyle;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(point.x, point.y, focusOverlayRadius, 0, fullCircleRadians);
      context.stroke();
    };

    drawFocusRing(selectedColor, selectionOverlayStroke);
    drawFocusRing(hoverColor, hoverOverlayStroke);

    context.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
    context.font = "0.75rem monospace";
    context.fillText(
      t("cubeResolutionOverlay", { levels: rgbCubeColorCount }),
      overlayTextLeft,
      resolutionTextTop
    );
    context.fillText(
      t("cubeSliceOverlay", { axis: getSliceAxisLabel(sliceAxis), value: sliceValue }),
      overlayTextLeft,
      secondOverlayTextTop
    );
    context.fillText(
      t("cubeOverlayStatus", {
        mode: t(
          overlayMode === "grid"
            ? "cubeOverlayModeGrid"
            : overlayMode === "image"
              ? "cubeOverlayModeImage"
              : "cubeOverlayModeBoth"
        ),
        points: imageCubePoints.length,
      }),
      overlayTextLeft,
      thirdOverlayTextTop
    );
  }, [
    axisGuideMode,
    cubeSize,
    hasGridOverlay,
    hasImageOverlay,
    compareCubePoints,
    hoverColor,
    imageCubePoints,
    overlayMode,
    rotation,
    sampledColors,
    selectedColor,
    selectionCubePoints,
    sliceAxis,
    sliceValue,
    space,
  ]);

  const findNearestColor = (offsetX: number, offsetY: number): RgbColor | null => {
    return getNearestProjectedColor(
      projectedPointsRef.current,
      offsetX,
      offsetY,
      nearestDistanceThresholdSquared
    );
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
    <div className={canvasWrapClassName}>
      <canvas
        ref={canvasRef}
        className="cubeCanvas"
        tabIndex={0}
        aria-label={t("cubeCanvasAriaLabel")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
}
