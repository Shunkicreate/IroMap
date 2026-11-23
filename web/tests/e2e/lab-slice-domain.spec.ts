import { expect, test } from "@playwright/test";
import { labToRgb } from "@/domain/color/color-conversion";
import { getLabSliceColor } from "@/domain/color/lab-slice";

test("each Lab slice keeps its neutral center and rejects an outside corner", () => {
  expect(getLabSliceColor("lab-l", 50, 128, 127)).toEqual(labToRgb({ l: 50, a: 0, b: 0 }));
  for (const axis of ["lab-a", "lab-b"] as const) {
    expect(getLabSliceColor(axis, 0, 128, 127)).toEqual(labToRgb({ l: 50, a: 0, b: 0 }));
    expect(getLabSliceColor(axis, 0, 0, 0)).toBeNull();
  }
  expect(getLabSliceColor("lab-l", 50, 0, 0)).toBeNull();
});

test("Lab axis mapping preserves signed channels and the existing pixel rounding", () => {
  expect(getLabSliceColor("lab-l", 50, 118, 117)).toEqual(labToRgb({ l: 50, a: -10, b: 10 }));
  expect(getLabSliceColor("lab-a", -10, 138, 127)).toEqual(labToRgb({ l: 50, a: -10, b: 10 }));
  expect(getLabSliceColor("lab-b", 10, 118, 127)).toEqual(labToRgb({ l: 50, a: -10, b: 10 }));
});
