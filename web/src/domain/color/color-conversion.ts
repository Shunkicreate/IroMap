import type { HslColor, LabColor, RgbColor } from "@/domain/color/color-types";

const srgbPivot = (value: number): number => {
  const normalized = value / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return ((normalized + 0.055) / 1.055) ** 2.4;
};

const xyzPivot = (value: number): number => {
  if (value > 0.008856) {
    return value ** (1 / 3);
  }
  return 7.787 * value + 16 / 116;
};

export const clampRgb = (color: RgbColor): RgbColor => {
  return {
    r: Math.max(0, Math.min(255, Math.round(color.r))),
    g: Math.max(0, Math.min(255, Math.round(color.g))),
    b: Math.max(0, Math.min(255, Math.round(color.b))),
  };
};

export const rgbToHsl = (color: RgbColor): HslColor => {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const rgbToLab = (color: RgbColor): LabColor => {
  const r = srgbPivot(color.r);
  const g = srgbPivot(color.g);
  const b = srgbPivot(color.b);

  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  const fx = xyzPivot(x);
  const fy = xyzPivot(y);
  const fz = xyzPivot(z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
};

export const rgbToHueAndSaturation = (color: RgbColor): { hue: number; saturation: number } => {
  const hsl = rgbToHsl(color);
  return {
    hue: hsl.h,
    saturation: hsl.s / 100,
  };
};
