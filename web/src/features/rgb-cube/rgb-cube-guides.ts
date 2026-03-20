import {
  rgbaFromGray,
  fullCircleRadians,
  projectSpacePoint,
  type Rotation,
  type SpacePoint,
} from "@/features/rgb-cube/rgb-cube-projection";
import { type ColorSpace3d } from "@/domain/color/color-types";

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
