import {
  rgbaFromGray,
  fullCircleRadians,
  projectSpacePoint,
  labAxisRange,
  type Rotation,
  type SpacePoint,
} from "@/features/rgb-cube/rgb-cube-projection";
import { type ColorSpace3d } from "@/domain/color/color-types";
import { colorChannelMax } from "@/domain/color/color-constants";

const neutralGray = 220;
const defaultAlpha = 0.5;
const hslGuideSegments = 12;

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
  return { x: "a*", y: "L*", z: "b*" };
};

type AxisName = "x" | "y" | "z";
type LabelBounds = { x: number; y: number; width: number; height: number };

const axisColors = { x: "#ff8080", y: "#89ebad", z: "#9cceff" };

const getTickLabel = (space: ColorSpace3d, axis: AxisName, position: number): string => {
  if (space === "rgb") {
    return String(Math.round(((position + 1) / 2) * colorChannelMax));
  }
  if (axis === "y") {
    const value = (position + 1) * 50;
    return space === "hsl" ? `${value}%` : String(value);
  }
  return space === "lab" ? String(position * labAxisRange) : `${position * 100}%`;
};

export const drawAxisGuide = (
  context: CanvasRenderingContext2D,
  space: ColorSpace3d,
  rotation: Rotation,
  width: number,
  height: number,
  objectScale = 1
): void => {
  const labels = getAxisLabels(space);
  const occupied: LabelBounds[] = [{ x: 0, y: 0, width, height: 66 }];
  const center = { x: width / 2, y: height / 2 };

  context.save();
  context.lineWidth = 1.4;
  context.font = "11px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";

  const drawLabel = (text: string, x: number, y: number): void => {
    const labelWidth = context.measureText(text).width + 8;
    const labelHeight = 18;
    const left = Math.max(2, Math.min(width - labelWidth - 2, x - labelWidth / 2));
    const top = Math.max(68, Math.min(height - labelHeight - 2, y - labelHeight / 2));
    if (
      occupied.some(
        (bounds) =>
          left < bounds.x + bounds.width + 2 &&
          left + labelWidth + 2 > bounds.x &&
          top < bounds.y + bounds.height + 2 &&
          top + labelHeight + 2 > bounds.y
      )
    ) {
      return;
    }
    occupied.push({ x: left, y: top, width: labelWidth, height: labelHeight });
    const color = context.fillStyle;
    context.fillStyle = "rgba(14, 17, 24, 0.9)";
    context.fillRect(left, top, labelWidth, labelHeight);
    context.fillStyle = color;
    context.fillText(text, left + labelWidth / 2, top + labelHeight / 2);
  };

  // Boundary rulers keep numbers away from the dense center of the point cloud.
  // The vertical ruler gets priority when projected labels overlap.
  for (const axis of ["y", "x", "z"] as const) {
    const base: SpacePoint =
      space === "hsl" ? { x: 0, y: -1, z: 0 } : { x: axis === "z" ? 1 : -1, y: -1, z: -1 };
    if (space === "hsl" && axis === "y") {
      base.x = -1;
    }
    const project = (position: number) =>
      projectSpacePoint({ ...base, [axis]: position }, rotation, width, height, objectScale);
    const start = project(-1);
    const end = project(1);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) {
      continue;
    }
    const midpoint = project(0);
    const direction = -dy * (midpoint.x - center.x) + dx * (midpoint.y - center.y) < 0 ? -1 : 1;
    const normal = { x: (-dy / length) * direction, y: (dx / length) * direction };
    context.strokeStyle = axisColors[axis];
    context.fillStyle = axisColors[axis];
    drawLine(context, start, end);

    // Draw endpoints and the midpoint before intermediate labels for small canvases.
    for (const position of [-1, 1, 0, -0.5, 0.5]) {
      const point = project(position);
      drawLine(context, point, { x: point.x + normal.x * 5, y: point.y + normal.y * 5 });
      const value = getTickLabel(space, axis, position);
      drawLabel(
        position === 1 ? `${labels[axis]} ${value}` : value,
        point.x + normal.x * 18,
        point.y + normal.y * 18
      );
    }
  }
  context.restore();
};
