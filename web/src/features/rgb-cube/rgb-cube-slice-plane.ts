import { observationColors, type ObservationColors } from "@/lib/observation-colors";
import { colorChannelMax, colorChannelMin } from "@/domain/color/color-constants";
import { buildLabSliceGeometry, type LabSliceGeometry } from "@/domain/color/lab-slice";
import {
  isHslSliceAxis,
  isLabSliceAxis,
  isRgbSliceAxis,
  toRgbColor,
  type ColorSpace3d,
  type SliceAxis,
  type LabSliceAxis,
} from "@/domain/color/color-types";
import {
  clampUnit,
  fullCircleRadians,
  labAxisRange,
  projectSpacePoint,
  toSpacePoint,
  type Rotation,
  type SpacePoint,
} from "@/features/rgb-cube/rgb-cube-projection";

const sliceSurfaceSegments = 24;
const labGeometryCache = new Map<string, LabSliceGeometry>();

const getLabGeometry = (axis: LabSliceAxis, value: number): LabSliceGeometry => {
  const key = `${axis}:${value}`;
  const cached = labGeometryCache.get(key);
  if (cached) return cached;
  const geometry = buildLabSliceGeometry(axis, value);
  if (labGeometryCache.size >= 3) {
    labGeometryCache.delete(labGeometryCache.keys().next().value!);
  }
  labGeometryCache.set(key, geometry);
  return geometry;
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

const drawProjectedPolygon = (
  context: CanvasRenderingContext2D,
  projected: Array<{ x: number; y: number }>,
  colors: ObservationColors
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
  context.fillStyle = colors.guide + "16";
  context.strokeStyle = colors.guide;
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
  objectScale = 1,
  colors: ObservationColors = observationColors.dark
): void => {
  if (space === "rgb" && isRgbSliceAxis(axis)) {
    const planeCorners = getRgbPlaneCorners(axis, value).map((point) =>
      projectSpacePoint(point, rotation, width, height, objectScale)
    );
    drawProjectedPolygon(context, planeCorners, colors);
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
      drawProjectedPolygon(context, projected, colors);
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
      drawProjectedPolygon(context, projected, colors);
      return;
    }

    const radius = toHslRadius(value);
    if (radius <= 0) {
      const bottom = projectSpacePoint({ x: 0, y: -1, z: 0 }, rotation, width, height, objectScale);
      const top = projectSpacePoint({ x: 0, y: 1, z: 0 }, rotation, width, height, objectScale);
      context.strokeStyle = colors.guide;
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
      drawProjectedPolygon(context, projected, colors);
    }
    return;
  }

  if (space === "lab" && isLabSliceAxis(axis)) {
    const geometry = getLabGeometry(axis, value);
    const projectGridPoint = (x: number, y: number) => {
      const horizontal = toLabChannel(x - 128.5);
      const point: SpacePoint =
        axis === "lab-l"
          ? { x: horizontal, y: toLabHeight(value), z: toLabChannel(127.5 - y) }
          : axis === "lab-a"
            ? { x: toLabChannel(value), y: toLabHeight(((255.5 - y) / 255) * 100), z: horizontal }
            : { x: horizontal, y: toLabHeight(((255.5 - y) / 255) * 100), z: toLabChannel(value) };
      return projectSpacePoint(point, rotation, width, height, objectScale);
    };
    context.beginPath();
    for (const { row, start, end } of geometry.runs) {
      const corners = [
        projectGridPoint(start, row),
        projectGridPoint(end, row),
        projectGridPoint(end, row + 1),
        projectGridPoint(start, row + 1),
      ];
      context.moveTo(corners[0].x, corners[0].y);
      for (const corner of corners.slice(1)) context.lineTo(corner.x, corner.y);
      context.closePath();
    }
    context.fillStyle = colors.guide + "16";
    context.fill();
    context.beginPath();
    for (const { from, to } of geometry.boundary) {
      const start = projectGridPoint(from.x, from.y);
      const end = projectGridPoint(to.x, to.y);
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
    }
    context.strokeStyle = colors.guide;
    context.lineWidth = 1.5;
    context.stroke();
  }
};
