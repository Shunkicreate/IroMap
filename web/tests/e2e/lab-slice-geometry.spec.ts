import { expect, test } from "@playwright/test";
import { buildLabSliceGeometry, getLabSliceColor } from "@/domain/color/lab-slice";
import { drawSlicePlane } from "@/features/rgb-cube/rgb-cube-slice-plane";

for (const [axis, value] of [
  ["lab-l", 50],
  ["lab-a", 0],
  ["lab-b", 0],
] as const) {
  test(`${axis} geometry covers exactly the visible 2D mask and outlines only its border`, () => {
    const geometry = buildLabSliceGeometry(axis, value);
    const actual = new Uint8Array(256 * 256);
    const expected = new Uint8Array(256 * 256);
    for (const { row, start, end } of geometry.runs) {
      for (let x = start; x < end; x += 1) actual[row * 256 + x] = 1;
    }
    for (let y = 0; y < 256; y += 1) {
      for (let x = 0; x < 256; x += 1) {
        expected[y * 256 + x] = getLabSliceColor(axis, value, x, y) ? 1 : 0;
      }
    }
    expect(actual).toEqual(expected);
    const inside = (x: number, y: number) =>
      x >= 0 && x < 256 && y >= 0 && y < 256 ? actual[y * 256 + x] : 0;
    for (const { from, to } of geometry.boundary) {
      const adjacent =
        from.y === to.y
          ? inside(from.x, from.y - 1) + inside(from.x, from.y)
          : inside(from.x - 1, from.y) + inside(from.x, from.y);
      expect(adjacent).toBe(1);
    }
    expect(geometry.runs.length).toBeGreaterThan(1);
    expect(geometry.boundary.length).toBeGreaterThan(4);
  });
}

test("3D Lab plane fills the union once and does not stroke internal row edges", () => {
  let fills = 0;
  let strokes = 0;
  let closedSubpaths = 0;
  const context = {
    beginPath: () => {},
    moveTo: (x: number, y: number) => expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true),
    lineTo: (x: number, y: number) => expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true),
    closePath: () => {
      closedSubpaths += 1;
    },
    fill: () => {
      fills += 1;
    },
    stroke: () => {
      strokes += 1;
    },
  } as unknown as CanvasRenderingContext2D;
  drawSlicePlane(context, "lab", { x: 0.3, y: 0.5 }, 640, 480, "lab-l", 50);
  expect(fills).toBe(1);
  expect(strokes).toBe(1);
  expect(closedSubpaths).toBe(buildLabSliceGeometry("lab-l", 50).runs.length);
});
