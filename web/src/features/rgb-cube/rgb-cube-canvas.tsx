"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  selectionCubePoints?: RgbCubePoint[];
  isimageMappingVisible?: boolean;
  isselectionMappingVisible?: boolean;
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
const selectionOverlayStroke = "#f97316";
const hoverOverlayStroke = "#ffffff";
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
  selectionCubePoints = [],
  isimageMappingVisible = true,
  isselectionMappingVisible = true,
  hoverColor = null,
  selectedColor = null,
  overlayMode,
  onRotationChange,
  onHoverColorChange,
  onColorSelect,
}: Props) {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const focusCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ isDragging: boolean; x: number; y: number }>({
    isDragging: false,
    x: 0,
    y: 0,
  });
  const projectedPointsRef = useRef<ProjectedPoint[]>([]);
  const [localHoverColor, setLocalHoverColor] = useState<RgbColor | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const normalizedCubeSize =
    Math.round(Math.min(maxCubeSize, Math.max(minCubeSize, cubeSize)) / cubeSizeStep) *
    cubeSizeStep;

  useEffect(() => {
    canvasWrapRef.current?.style.setProperty(
      "--rgb-cube-inline-size",
      `${normalizedCubeSize / 16}rem`
    );
  }, [normalizedCubeSize]);

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
  const displayHoverColor = isPointerInside || isDragging ? localHoverColor : hoverColor;

  const configureCanvas = (
    canvas: HTMLCanvasElement
  ): { context: CanvasRenderingContext2D; width: number; height: number } | null => {
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * devicePixelRatio);
    canvas.height = Math.floor(height * devicePixelRatio);
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    return { context, width, height };
  };

  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) {
      return;
    }

    const configuredCanvas = configureCanvas(canvas);
    if (!configuredCanvas) {
      return;
    }
    const { context, width, height } = configuredCanvas;

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
    const projectedImage =
      hasImageOverlay && isimageMappingVisible
        ? imageCubePoints
            .map((point) => ({
              ...projectColor(point.color, space, rotation, width, height, objectScale),
              count: point.count,
              ratio: point.ratio,
            }))
            .sort((left, right) => left.depth - right.depth)
        : [];

    const projectedSelection = isselectionMappingVisible
      ? selectionCubePoints
          .map((point) => ({
            ...projectColor(point.color, space, rotation, width, height, objectScale),
            count: point.count,
          }))
          .sort((left, right) => left.depth - right.depth)
      : [];

    projectedPointsRef.current = [...projectedGrid, ...projectedImage];

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

    const maxSelectionCount = projectedSelection.reduce(
      (current, point) => Math.max(current, point.count),
      1
    );
    for (const point of projectedSelection) {
      const intensity = point.count / maxSelectionCount;
      const radius =
        imageOverlayMinRadius + (imageOverlayMaxRadius - imageOverlayMinRadius) * intensity + 2.4;
      const gradient = context.createRadialGradient(
        point.x - radius * 0.35,
        point.y - radius * 0.45,
        radius * 0.15,
        point.x,
        point.y,
        radius
      );
      gradient.addColorStop(0, "rgba(255, 248, 240, 0.9)");
      gradient.addColorStop(0.2, "rgba(253, 186, 116, 0.75)");
      gradient.addColorStop(0.7, "rgba(249, 115, 22, 0.42)");
      gradient.addColorStop(1, "rgba(194, 65, 12, 0.18)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, fullCircleRadians);
      context.fill();
      context.strokeStyle = "rgba(251, 146, 60, 0.82)";
      context.lineWidth = 1.2;
      context.stroke();

      context.fillStyle = "rgba(255, 255, 255, 0.35)";
      context.beginPath();
      context.arc(
        point.x - radius * 0.3,
        point.y - radius * 0.35,
        Math.max(radius * 0.24, 0.8),
        0,
        fullCircleRadians
      );
      context.fill();
    }

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
    imageCubePoints,
    overlayMode,
    rotation,
    sampledColors,
    selectionCubePoints,
    isimageMappingVisible,
    isselectionMappingVisible,
    sliceAxis,
    sliceValue,
    space,
  ]);

  useEffect(() => {
    const canvas = focusCanvasRef.current;
    if (!canvas) {
      return;
    }

    const configuredCanvas = configureCanvas(canvas);
    if (!configuredCanvas) {
      return;
    }
    const { context, width, height } = configuredCanvas;
    const objectScale = cubeSize / defaultCubeSize;

    context.clearRect(0, 0, width, height);

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

    if (isselectionMappingVisible && selectionCubePoints.length === 0) {
      drawFocusRing(selectedColor, selectionOverlayStroke);
    }
    drawFocusRing(displayHoverColor, hoverOverlayStroke);
  }, [
    cubeSize,
    displayHoverColor,
    rotation,
    selectedColor,
    selectionCubePoints.length,
    isselectionMappingVisible,
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
    setIsDragging(true);
    setIsPointerInside(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const pointer = mapPointer(event);

    const nearest = findNearestColor(pointer.x, pointer.y);
    const nextHoverColor = nearest ? clampRgb(nearest) : null;
    setLocalHoverColor(nextHoverColor);
    onHoverColorChange(nextHoverColor);

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
    const nextHoverColor = nearest ? clampRgb(nearest) : null;
    setLocalHoverColor(nextHoverColor);
    onHoverColorChange(nextHoverColor);
    if (nearest) {
      onColorSelect(nextHoverColor ?? clampRgb(nearest));
    }

    dragRef.current.isDragging = false;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handlePointerLeave = (): void => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
    setIsPointerInside(false);
    setLocalHoverColor(null);
    onHoverColorChange(null);
  };

  return (
    <div ref={canvasWrapRef} className="cubeCanvasWrap">
      <div className="cubeCanvasStack">
        <canvas
          ref={baseCanvasRef}
          className="cubeCanvas"
          tabIndex={0}
          aria-label={t("cubeCanvasAriaLabel")}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />
        <canvas ref={focusCanvasRef} className="cubeCanvasOverlay" aria-hidden="true" />
      </div>
    </div>
  );
}
