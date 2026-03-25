import { expect, test, type Page } from "@playwright/test";
import {
  getPanel,
  getSliceCanvas,
  pasteRedJpegToPhotoAnalysis,
  pasteRedPngToPhotoAnalysis,
  pasteRedPngGlobally,
  uploadRedPng,
} from "./helpers";

const getSliceValueSlider = (page: Page) => {
  return getPanel(page, "スライス").locator(".sliceControls input[type='range']");
};

test("T-101(slice): 断面表示の確認", async ({ page }) => {
  await page.goto("/");
  const slice = getSliceCanvas(page);
  await expect(slice).toBeVisible();
  await expect(slice).toHaveAttribute("width", "256");
  await expect(slice).toHaveAttribute("height", "256");
});

test("T-102(slice): 固定値操作の確認", async ({ page }) => {
  await page.goto("/");
  const slicePanel = getPanel(page, "スライス");
  const valueSlider = getSliceValueSlider(page);
  await expect(valueSlider).toBeVisible();
  await expect
    .poll(async () => {
      await valueSlider.fill("200");
      return valueSlider.inputValue();
    })
    .toBe("200");
  await expect(slicePanel.locator(".sliceAxisBadge")).toContainText("200");
});

test("T-103(slice): 3D同期の確認", async ({ page }) => {
  await page.goto("/");
  const slider = getSliceValueSlider(page);
  await expect(slider).toBeVisible();
  await expect
    .poll(async () => {
      await slider.fill("180");
      return slider.inputValue();
    })
    .toBe("180");
  await expect(page.locator(".cubeCanvas")).toBeVisible();
});

test("T-201(photo-analysis): 上部CTAからアップロードして結果表示できる", async ({ page }) => {
  await page.goto("/");

  await uploadRedPng(page);

  const previewPanel = getPanel(page, "選択画像");
  const analysisPanel = getPanel(page, "写真分析");
  await previewPanel.getByText("画像情報").click();
  await expect(previewPanel.getByText("選択中: red.png")).toBeVisible();
  await expect(analysisPanel.getByRole("heading", { name: "Lab a-b 散布図" })).toBeVisible();
});

test("T-202(photo-analysis): クリップボード画像貼り付けで結果表示できる", async ({ page }) => {
  await page.goto("/");

  await pasteRedPngToPhotoAnalysis(page);

  const previewPanel = getPanel(page, "選択画像");
  const analysisPanel = getPanel(page, "写真分析");
  await previewPanel.getByText("画像情報").click();
  await expect(previewPanel.getByText("選択中: clipboard-image.png")).toBeVisible();
  await expect(analysisPanel.getByRole("heading", { name: "Lab a-b 散布図" })).toBeVisible();
});

test("T-203(photo-analysis): クリップボードJPEG貼り付けで結果表示できる", async ({ page }) => {
  await page.goto("/");

  await pasteRedJpegToPhotoAnalysis(page);

  const previewPanel = getPanel(page, "選択画像");
  const analysisPanel = getPanel(page, "写真分析");
  await previewPanel.getByText("画像情報").click();
  await expect(previewPanel.getByText("選択中: clipboard-image.jpg")).toBeVisible();
  await expect(analysisPanel.getByRole("heading", { name: "Lab a-b 散布図" })).toBeVisible();
});

test("T-204(photo-analysis): 選択画像を表示できる", async ({ page }) => {
  await page.goto("/");

  await uploadRedPng(page);

  const panel = getPanel(page, "選択画像");
  const previewImage = panel.getByRole("img", { name: "分析対象画像: red.png" });

  await expect(previewImage).toBeVisible();
  await expect(previewImage).toHaveAttribute("alt", "分析対象画像: red.png");
  await expect(panel.getByText("red.png", { exact: true }).first()).toBeVisible();
});

test("T-205(photo-analysis): 画像入力を閉じても画面全体ペーストで結果表示できる", async ({
  page,
}) => {
  await page.goto("/");

  const previewPanel = getPanel(page, "選択画像");
  await previewPanel.getByRole("button", { name: "アップロードとプレビュー" }).click();
  await expect(previewPanel.getByText("画像をアップロードして分析を始める")).toHaveCount(0);

  await pasteRedPngGlobally(page);

  await previewPanel.getByText("画像情報").click();
  const analysisPanel = getPanel(page, "写真分析");
  await expect(previewPanel.getByText("選択中: clipboard-image.png")).toBeVisible();
  await expect(analysisPanel.getByRole("heading", { name: "Lab a-b 散布図" })).toBeVisible();
});
