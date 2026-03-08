import { expect, type Locator, type Page } from "@playwright/test";

const redPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z/C/HwAF/gL+4W2KIwAAAABJRU5ErkJggg==";
const grayPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNkYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==";

export const getPanel = (page: Page, heading: string): Locator => {
  return page.locator("section.panel", {
    has: page.getByRole("heading", { name: heading }),
  });
};

export const getSliceCanvas = (page: Page): Locator => {
  return page.locator(".sliceCanvas");
};

export const getCubeCanvas = (page: Page): Locator => {
  return page.locator(".cubeCanvas");
};

export const selectColorFromSlice = async (page: Page): Promise<void> => {
  const canvas = getSliceCanvas(page);
  await expect(canvas).toBeVisible();
  await canvas.click({ position: { x: 24, y: 24 } });
};

export const hoverColorOnSlice = async (page: Page): Promise<void> => {
  const canvas = getSliceCanvas(page);
  await expect(canvas).toBeVisible();
  await canvas.hover({ position: { x: 40, y: 40 } });
};

const setFile = async (page: Page, fileName: string, base64: string): Promise<void> => {
  await page.getByLabel("写真分析用画像").setInputFiles({
    name: fileName,
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
};

export const uploadRedPng = async (page: Page): Promise<void> => {
  await setFile(page, "red.png", redPngBase64);
};

export const uploadGrayPng = async (page: Page): Promise<void> => {
  await setFile(page, "gray.png", grayPngBase64);
};
