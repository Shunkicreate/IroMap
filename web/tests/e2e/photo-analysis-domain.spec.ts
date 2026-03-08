import { expect, test } from "@playwright/test";
import { analyzePhoto } from "@/domain/photo-analysis/photo-analysis";

const createImageDataLike = (
  width: number,
  height: number,
  fill: (x: number, y: number) => { r: number; g: number; b: number; a?: number }
): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const color = fill(x, y);
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = color.a ?? 255;
    }
  }
  return { data, width, height, colorSpace: "srgb" } as ImageData;
};

test("T-101(photo-analysis): 単色画像でLab scatter表示を確認", async () => {
  const imageData = createImageDataLike(8, 8, () => ({ r: 255, g: 0, b: 0 }));
  const result = analyzePhoto(imageData);

  expect(result.scatter.length).toBeGreaterThan(0);
});

test("T-102(photo-analysis): 色相が偏った画像でHue histogramを確認", async () => {
  const imageData = createImageDataLike(8, 8, () => ({ r: 255, g: 0, b: 0 }));
  const result = analyzePhoto(imageData);

  const activeHueBins = result.hueHistogram.filter((bin) => bin.count > 0);
  expect(activeHueBins.length).toBe(1);
});

test("T-103(photo-analysis): 低彩度画像でSaturation histogramを確認", async () => {
  const imageData = createImageDataLike(8, 8, () => ({ r: 128, g: 128, b: 128 }));
  const result = analyzePhoto(imageData);

  const firstBinCount = result.saturationHistogram[0]?.count ?? 0;
  expect(firstBinCount).toBeGreaterThan(0);
});

test("T-104(photo-analysis): 主要色比率の合計が100%になることを確認", async () => {
  const imageData = createImageDataLike(8, 8, (x) => {
    if (x < 4) {
      return { r: 255, g: 0, b: 0 };
    }
    return { r: 0, g: 255, b: 0 };
  });
  const result = analyzePhoto(imageData);

  const ratioSum = result.colorAreas.reduce((acc, area) => acc + area.ratio, 0);
  expect(ratioSum).toBeCloseTo(100, 1);
});
