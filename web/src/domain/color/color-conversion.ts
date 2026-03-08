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
const initialHue = 0;
const initialSaturation = 0;
const halfDivisor = 2;
const hslDoubleScale = 2;
const hslBaseOffset = 1;
const xyzCubeRootPower = 1 / 3;
const hueGreenOffset = 2;
const hueBlueOffset = 4;
const xyzFromRgbXr = 0.4124;
const xyzFromRgbXg = 0.3576;
const xyzFromRgbXb = 0.1805;
const xyzFromRgbYr = 0.2126;
const xyzFromRgbYg = 0.7152;
const xyzFromRgbYb = 0.0722;
const xyzFromRgbZr = 0.0193;
const xyzFromRgbZg = 0.1192;
const xyzFromRgbZb = 0.9505;

const srgbPivot = (value: number): number => {
  const normalized = value / colorChannelMax;
  if (normalized <= srgbLinearThreshold) {
    return normalized / srgbLinearDivisor;
  }
  return ((normalized + srgbOffset) / srgbGammaDivisor) ** srgbGammaPower;
};

const xyzPivot = (value: number): number => {
  if (value > xyzThreshold) {
    return value ** xyzCubeRootPower;
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

  let h = initialHue;
  const l = (max + min) / halfDivisor;
  let s = initialSaturation;

  if (delta !== initialSaturation) {
    s = delta / (hslBaseOffset - Math.abs(hslDoubleScale * l - hslBaseOffset));

    if (max === r) {
      h = hueSectorDegrees * (((g - b) / delta) % hueSectorCount);
    } else if (max === g) {
      h = hueSectorDegrees * ((b - r) / delta + hueGreenOffset);
    } else {
      h = hueSectorDegrees * ((r - g) / delta + hueBlueOffset);
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

  const x = (r * xyzFromRgbXr + g * xyzFromRgbXg + b * xyzFromRgbXb) / xyzWhitePointX;
  const y = (r * xyzFromRgbYr + g * xyzFromRgbYg + b * xyzFromRgbYb) / xyzWhitePointY;
  const z = (r * xyzFromRgbZr + g * xyzFromRgbZg + b * xyzFromRgbZb) / xyzWhitePointZ;

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
