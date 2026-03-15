import { expect, test } from "@playwright/test";
import { getPanel, getSliceCanvas, uploadRedPng } from "./helpers";

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

test("T-105(photo-analysis): アップロード画像のプレビューを表示できる", async ({ page }) => {
  await page.goto("/");
  await uploadRedPng(page);

  const photoPanel = getPanel(page, "写真分析 MVP");
  const previewImage = photoPanel.locator(".photoPreviewImage");

  await expect(previewImage).toBeVisible();
  await expect(previewImage).toHaveAttribute("alt", "分析対象画像: red.png");
  await expect(photoPanel.getByText("red.png")).toBeVisible();
});
