import {
  toHueDegree,
  toPercentage,
  toRgbColor,
  type HslColor,
  type LabColor,
  type RgbColor,
} from "@/domain/color/color-types";
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
const rgbFromXyzX = 3.2406;
const rgbFromXyzY = -1.5372;
const rgbFromXyzZ = -0.4986;
const greenFromXyzX = -0.9689;
const greenFromXyzY = 1.8758;
const greenFromXyzZ = 0.0415;
const blueFromXyzX = 0.0557;
const blueFromXyzY = -0.204;
const blueFromXyzZ = 1.057;
const xyzLinearRgbThreshold = 0.0031308;

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

const xyzInversePivot = (value: number): number => {
  const cubed = value * value * value;
  if (cubed > xyzThreshold) {
    return cubed;
  }
  return (value - xyzOffsetNumerator / xyzOffsetDenominator) / xyzLinearScale;
};

const linearToSrgb = (value: number): number => {
  if (value <= xyzLinearRgbThreshold) {
    return srgbLinearDivisor * value;
  }
  return srgbGammaDivisor * value ** (1 / srgbGammaPower) - srgbOffset;
};

const clamp01 = (value: number): number => {
  return Math.max(0, Math.min(1, value));
};

export const clampRgb = (color: RgbColor): RgbColor => {
  return toRgbColor(
    Math.max(colorChannelMin, Math.min(colorChannelMax, Math.round(color.r))),
    Math.max(colorChannelMin, Math.min(colorChannelMax, Math.round(color.g))),
    Math.max(colorChannelMin, Math.min(colorChannelMax, Math.round(color.b)))
  );
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
    h: toHueDegree(h),
    s: toPercentage(s * hslSaturationPercentage),
    l: toPercentage(l * hslSaturationPercentage),
  };
};

export const hslToRgb = (hsl: HslColor): RgbColor => {
  const h = hsl.h / hueCircleDegrees;
  const s = hsl.s / hslSaturationPercentage;
  const l = hsl.l / hslSaturationPercentage;

  if (s === 0) {
    const gray = Math.round(l * colorChannelMax);
    return toRgbColor(gray, gray, gray);
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = hslDoubleScale * l - q;

  const hueToChannel = (tRaw: number): number => {
    let t = tRaw;
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }

    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  };

  const r = hueToChannel(h + 1 / 3);
  const g = hueToChannel(h);
  const b = hueToChannel(h - 1 / 3);

  return toRgbColor(r * colorChannelMax, g * colorChannelMax, b * colorChannelMax);
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

export const labToRgb = (lab: LabColor): RgbColor => {
  const fy = (lab.l + labLightnessOffset) / labLightnessScale;
  const fx = fy + lab.a / labAChannelScale;
  const fz = fy - lab.b / labBChannelScale;

  const x = xyzWhitePointX * xyzInversePivot(fx);
  const y = xyzWhitePointY * xyzInversePivot(fy);
  const z = xyzWhitePointZ * xyzInversePivot(fz);

  const linearR = x * rgbFromXyzX + y * rgbFromXyzY + z * rgbFromXyzZ;
  const linearG = x * greenFromXyzX + y * greenFromXyzY + z * greenFromXyzZ;
  const linearB = x * blueFromXyzX + y * blueFromXyzY + z * blueFromXyzZ;

  return toRgbColor(
    clamp01(linearToSrgb(linearR)) * colorChannelMax,
    clamp01(linearToSrgb(linearG)) * colorChannelMax,
    clamp01(linearToSrgb(linearB)) * colorChannelMax
  );
};

export const rgbToHueAndSaturation = (color: RgbColor): { hue: number; saturation: number } => {
  const hsl = rgbToHsl(color);
  return {
    hue: hsl.h,
    saturation: hsl.s / hslSaturationPercentage,
  };
};

export const labToChroma = (lab: LabColor): number => {
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b);
};

export const deltaE76 = (left: LabColor, right: LabColor): number => {
  const deltaL = left.l - right.l;
  const deltaA = left.a - right.a;
  const deltaB = left.b - right.b;
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
};
