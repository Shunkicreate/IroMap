import { expect, test } from "@playwright/test";
import {
  getPanel,
  getSliceCanvas,
  pasteRedJpegToPhotoAnalysis,
  pasteRedPngToPhotoAnalysis,
  uploadRedPng,
} from "./helpers";

test("T-101(slice): 断面表示の確認", async ({ page }) => {
  await page.goto("/");
  const slice = getSliceCanvas(page);
  await expect(slice).toBeVisible();
  await expect(slice).toHaveAttribute("width", "256");
  await expect(slice).toHaveAttribute("height", "256");
});

test("T-102(slice): 固定値操作の確認", async ({ page }) => {
  await page.goto("/");
  const valueSlider = page.getByRole("slider", { name: "固定値: 128" });
  await valueSlider.fill("200");
  await expect(page.getByText("R 固定 = 200")).toBeVisible();
});

test("T-103(slice): 3D同期の確認", async ({ page }) => {
  await page.goto("/");
  const slider = getPanel(page, "スライス").locator("input[type='range']");
  await slider.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "180";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(slider).toHaveValue("180");
  await expect(page.locator(".cubeCanvas")).toBeVisible();
});

test("T-201(photo-analysis): 上部CTAからアップロードして結果表示できる", async ({ page }) => {
  await page.goto("/");

  await uploadRedPng(page);

  await expect(page.getByText("選択中: red.png")).toBeVisible();
  await expect(getPanel(page, "写真分析 MVP").getByText("Lab a-b 散布図")).toBeVisible();
  await expect(getPanel(page, "写真分析 MVP").getByText(/file=red\.png/)).toBeVisible();
});

test("T-202(photo-analysis): クリップボード画像貼り付けで結果表示できる", async ({ page }) => {
  await page.goto("/");

  await pasteRedPngToPhotoAnalysis(page);

  const panel = getPanel(page, "写真分析 MVP");
  await expect(panel.getByText("クリップボード画像を適用しました")).toBeVisible();
  await expect(panel.getByText("Lab a-b 散布図")).toBeVisible();
  await expect(panel.getByText(/file=clipboard-image\.png/)).toBeVisible();
});

test("T-203(photo-analysis): クリップボードJPEG貼り付けで結果表示できる", async ({ page }) => {
  await page.goto("/");

  await pasteRedJpegToPhotoAnalysis(page);

  const panel = getPanel(page, "写真分析 MVP");
  await expect(panel.getByText("クリップボード画像を適用しました")).toBeVisible();
  await expect(panel.getByText("Lab a-b 散布図")).toBeVisible();
  await expect(panel.getByText(/file=clipboard-image\.jpg/)).toBeVisible();
});
