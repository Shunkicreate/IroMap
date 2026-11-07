import { expect, test } from "@playwright/test";
import { isLabInSrgbGamut, labToRgb, rgbToLab } from "@/domain/color/color-conversion";
import { toRgbColor } from "@/domain/color/color-types";

test("RGB samples remain inside the Lab representation of sRGB", () => {
  const levels = [0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 255];
  for (const r of levels) {
    for (const g of levels) {
      for (const b of levels) {
        const rgb = toRgbColor(r, g, b);
        const lab = rgbToLab(rgb);
        expect(isLabInSrgbGamut(lab), JSON.stringify({ rgb, lab })).toBe(true);
        expect(labToRgb(lab)).toEqual(rgb);
      }
    }
  }
});

test("clipped Lab colors are rejected before RGB conversion", () => {
  for (const lab of [
    { l: 50, a: -128, b: -128 },
    { l: 50, a: 127, b: 127 },
    { l: -1, a: 0, b: 0 },
    { l: 101, a: 0, b: 0 },
  ]) {
    expect(isLabInSrgbGamut(lab)).toBe(false);
    const clipped = labToRgb(lab);
    expect(Object.values(clipped).every((channel) => channel >= 0 && channel <= 255)).toBe(true);
  }
  for (const l of [0, 25, 50, 75, 100]) {
    expect(isLabInSrgbGamut({ l, a: 0, b: 0 })).toBe(true);
  }
});

test("non-finite Lab components cannot become selectable colors", () => {
  for (const component of ["l", "a", "b"] as const) {
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(isLabInSrgbGamut({ l: 50, a: 0, b: 0, [component]: value })).toBe(false);
    }
  }
});
