import type { HslColor, LabColor, RgbColor } from "@/domain/color/color-types";
import { colorChannelMax, colorChannelMin } from "@/domain/color/color-constants";

const srgbLinearThreshold = 0.04045;
const srgbLinearDivisor = 12.92;
const srgbOffset = 0.055;
const srgbGammaDivisor = 1.055;
const srgbGammaPower = 2.4;
const xyzThreshold = 0.008856;
const xyzLinearScale = 7.787;
const xyzOffsetNumerator = 16;
const xyzOffsetDenominator = 116;
const hueCircleDegrees = 360;
const hueSectorDegrees = 60;
const hueSectorCount = 6;
const hslSaturationPercentage = 100;
const xyzWhitePointX = 0.95047;
const xyzWhitePointY = 1;
const xyzWhitePointZ = 1.08883;
const labLightnessScale = 116;
const labLightnessOffset = 16;
const labAChannelScale = 500;
const labBChannelScale = 200;

const srgbPivot = (value: number): number => {
  const normalized = value / colorChannelMax;
  if (normalized <= srgbLinearThreshold) {
    return normalized / srgbLinearDivisor;
  }
  return ((normalized + srgbOffset) / srgbGammaDivisor) ** srgbGammaPower;
};

const xyzPivot = (value: number): number => {
  if (value > xyzThreshold) {
    return value ** (1 / 3);
  }
  return xyzLinearScale * value + xyzOffsetNumerator / xyzOffsetDenominator;
};

export const clampRgb = (color: RgbColor): RgbColor => {
  return {
    r: Math.max(colorChannelMin, Math.min(colorChannelMax, Math.round(color.r))),
    g: Math.max(colorChannelMin, Math.min(colorChannelMax, Math.round(color.g))),
    b: Math.max(colorChannelMin, Math.min(colorChannelMax, Math.round(color.b))),
  };
};

export const rgbToHsl = (color: RgbColor): HslColor => {
  const r = color.r / colorChannelMax;
  const g = color.g / colorChannelMax;
  const b = color.b / colorChannelMax;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    if (max === r) {
      h = hueSectorDegrees * (((g - b) / delta) % hueSectorCount);
    } else if (max === g) {
      h = hueSectorDegrees * ((b - r) / delta + 2);
    } else {
      h = hueSectorDegrees * ((r - g) / delta + 4);
    }
  }

  if (h < colorChannelMin) {
    h += hueCircleDegrees;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * hslSaturationPercentage),
    l: Math.round(l * hslSaturationPercentage),
  };
};

export const rgbToLab = (color: RgbColor): LabColor => {
  const r = srgbPivot(color.r);
  const g = srgbPivot(color.g);
  const b = srgbPivot(color.b);

  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / xyzWhitePointX;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / xyzWhitePointY;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / xyzWhitePointZ;

  const fx = xyzPivot(x);
  const fy = xyzPivot(y);
  const fz = xyzPivot(z);

  return {
    l: labLightnessScale * fy - labLightnessOffset,
    a: labAChannelScale * (fx - fy),
    b: labBChannelScale * (fy - fz),
  };
};

export const rgbToHueAndSaturation = (color: RgbColor): { hue: number; saturation: number } => {
  const hsl = rgbToHsl(color);
  return {
    hue: hsl.h,
    saturation: hsl.s / hslSaturationPercentage,
  };
};
