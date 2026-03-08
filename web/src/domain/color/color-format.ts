import type { RgbColor } from "@/domain/color/color-types";
import { rgbToHsl } from "@/domain/color/color-conversion";

export type CopyFormat = "hex" | "rgb" | "hsl";

const hexRadix = 16;
const hexByteLength = 2;
const hexPadChar = "0";

const toHexByte = (value: number): string => {
  return value.toString(hexRadix).padStart(hexByteLength, hexPadChar).toUpperCase();
};

export const rgbToHex = (color: RgbColor): string => {
  return `#${toHexByte(color.r)}${toHexByte(color.g)}${toHexByte(color.b)}`;
};

export const formatRgb = (color: RgbColor): string => {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
};

export const formatHsl = (color: RgbColor): string => {
  const hsl = rgbToHsl(color);
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
};

export const formatColor = (color: RgbColor, format: CopyFormat): string => {
  if (format === "hex") {
    return rgbToHex(color);
  }
  if (format === "rgb") {
    return formatRgb(color);
  }
  return formatHsl(color);
};
