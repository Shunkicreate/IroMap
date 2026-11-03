import { isLabInSrgbGamut, labToRgb } from "@/domain/color/color-conversion";
import { colorChannelLevels, colorChannelMax } from "@/domain/color/color-constants";
import { type LabColor, type LabSliceAxis, type RgbColor } from "@/domain/color/color-types";

export const getLabSliceColor = (
  axis: LabSliceAxis,
  value: number,
  x: number,
  y: number
): RgbColor | null => {
  const lightness = Math.round(((colorChannelMax - y) / colorChannelMax) * 100);
  const horizontal = x - 128;
  const vertical = 127 - y;
  const lab: LabColor =
    axis === "lab-l"
      ? { l: Math.min(100, Math.max(0, value)), a: horizontal, b: vertical }
      : axis === "lab-a"
        ? { l: lightness, a: Math.min(127, Math.max(-128, value)), b: horizontal }
        : { l: lightness, a: horizontal, b: Math.min(127, Math.max(-128, value)) };
  return isLabInSrgbGamut(lab) ? labToRgb(lab) : null;
};

type GridPoint = { x: number; y: number };
export type LabSliceGeometry = {
  runs: Array<{ row: number; start: number; end: number }>;
  boundary: Array<{ from: GridPoint; to: GridPoint }>;
};

export const buildLabSliceGeometry = (axis: LabSliceAxis, value: number): LabSliceGeometry => {
  const size = colorChannelLevels;
  const mask = new Uint8Array(size * size);
  const runs: LabSliceGeometry["runs"] = [];
  for (let row = 0; row < size; row += 1) {
    let start = -1;
    for (let x = 0; x <= size; x += 1) {
      const isInside = x < size && getLabSliceColor(axis, value, x, row) !== null;
      if (isInside) {
        mask[row * size + x] = 1;
        if (start < 0) start = x;
      } else if (start >= 0) {
        runs.push({ row, start, end: x });
        start = -1;
      }
    }
  }
  const boundary: LabSliceGeometry["boundary"] = [];
  const isInside = (x: number, y: number) =>
    x >= 0 && x < size && y >= 0 && y < size && mask[y * size + x] === 1;
  for (const { row, start, end } of runs) {
    boundary.push({ from: { x: start, y: row }, to: { x: start, y: row + 1 } });
    boundary.push({ from: { x: end, y: row }, to: { x: end, y: row + 1 } });
    for (let x = start; x < end; x += 1) {
      if (!isInside(x, row - 1)) {
        boundary.push({ from: { x, y: row }, to: { x: x + 1, y: row } });
      }
      if (!isInside(x, row + 1)) {
        boundary.push({ from: { x, y: row + 1 }, to: { x: x + 1, y: row + 1 } });
      }
    }
  }
  return { runs, boundary };
};
