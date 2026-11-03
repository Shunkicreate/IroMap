import { isLabInSrgbGamut, labToRgb } from "@/domain/color/color-conversion";
import { colorChannelMax } from "@/domain/color/color-constants";
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
