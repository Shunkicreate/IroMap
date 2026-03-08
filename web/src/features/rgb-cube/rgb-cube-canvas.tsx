"use client";

import { useEffect, useMemo, useRef } from "react";
import { clampRgb } from "@/domain/color/color-conversion";
import {
  type ColorSpace3d,
  toRgbColor,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
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
  onRotationChange: (rotation: Rotation) => void;
  onHoverColorChange: (color: RgbColor | null) => void;
  onColorSelect: (color: RgbColor) => void;
};

const nearestDistanceThresholdSquared = 64;
const rotationSensitivity = 0.01;
const overlayTextLeft = 14;
const resolutionTextTop = 22;
const secondOverlayTextTop = 40;
const textAlpha = 0.85;

const getSpaceLabel = (space: ColorSpace3d): string => {
  if (space === "rgb") {
    return t("spaceRgb");
  }
  if (space === "hsl") {
    return t("spaceHsl");
  }
  return t("spaceLab");
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
    for (const r of sampledLevels) {
      for (const g of sampledLevels) {
        for (const b of sampledLevels) {
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

    drawGuide(context, space, rotation, width, height);
    if (axisGuideMode === "visible") {
      drawAxisGuide(context, space, rotation, width, height);
    }
    if (space === "rgb") {
      drawSlicePlane(context, rotation, width, height, sliceAxis, sliceValue);
    }

    const projected = sampledColors
      .map((color) => projectColor(color, space, rotation, width, height))
      .sort((left, right) => left.depth - right.depth);

    projectedPointsRef.current = projected;

    for (const point of projected) {
      context.fillStyle = `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})`;
      context.beginPath();
      context.arc(point.x, point.y, markerRadius, 0, fullCircleRadians);
      context.fill();
    }

    context.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
    context.font = "12px monospace";
    context.fillText(
      t("cubeResolutionOverlay", { levels: rgbCubeColorCount }),
      overlayTextLeft,
      resolutionTextTop
    );
    if (space === "rgb") {
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
  }, [axisGuideMode, rotation, sampledColors, sliceAxis, sliceValue, space]);

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
    <canvas
      ref={canvasRef}
      className="cubeCanvas"
      style={{ height: `${cubeSize}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}
