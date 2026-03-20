import { expect, test } from "@playwright/test";
import {
  getPanel,
  getSliceCanvas,
  pasteRedPngGlobally,
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
  const slicePanel = getPanel(page, "スライス");
  const valueSlider = slicePanel.getByRole("slider");
  await valueSlider.fill("200");
  await expect(slicePanel.getByText(/固定 = 200$/)).toBeVisible();
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

  const previewPanel = getPanel(page, "選択画像プレビュー");
  const panel = getPanel(page, "写真分析 MVP");
  await expect(page.getByText("選択中: red.png")).toBeVisible();
  await expect(panel.getByText("色相ヒストグラム")).toBeVisible();
  await expect(previewPanel.locator(".previewStatusGrid")).toContainText("file=red.png");
});

test("T-202(photo-analysis): クリップボード画像貼り付けで結果表示できる", async ({ page }) => {
  await page.goto("/");

  await pasteRedPngToPhotoAnalysis(page);

  const previewPanel = getPanel(page, "選択画像プレビュー");
  const panel = getPanel(page, "写真分析 MVP");
  await expect(panel.getByText("色相ヒストグラム")).toBeVisible();
  await expect(previewPanel.locator(".previewStatusGrid")).toContainText(
    "file=clipboard-image.png"
  );
});

test("T-203(photo-analysis): クリップボードJPEG貼り付けで結果表示できる", async ({ page }) => {
  await page.goto("/");

  await pasteRedJpegToPhotoAnalysis(page);

  const previewPanel = getPanel(page, "選択画像プレビュー");
  const panel = getPanel(page, "写真分析 MVP");
  await expect(panel.getByText("色相ヒストグラム")).toBeVisible();
  await expect(previewPanel.locator(".previewStatusGrid")).toContainText(
    "file=clipboard-image.jpg"
  );
});

test("T-204(photo-analysis): 選択画像プレビューを表示できる", async ({ page }) => {
  await page.goto("/");

  await uploadRedPng(page);

  const panel = getPanel(page, "選択画像プレビュー");
  const previewImage = panel.getByRole("img", { name: "分析対象画像: red.png" });

  await expect(previewImage).toBeVisible();
  await expect(previewImage).toHaveAttribute("alt", "分析対象画像: red.png");
  await expect(page.getByText("選択中: red.png")).toBeVisible();
});

test("T-205(photo-analysis): 画像入力を閉じても画面全体ペーストで結果表示できる", async ({
  page,
}) => {
  await page.goto("/");

  const previewPanel = getPanel(page, "選択画像プレビュー");
  await previewPanel.getByRole("button", { name: "画像アップロード / 貼り付け" }).click();
  await expect(previewPanel.getByText("写真をアップロードして分析を始める")).toHaveCount(0);

  await pasteRedPngGlobally(page);

  const panel = getPanel(page, "写真分析 MVP");
  await expect(panel.getByText("色相ヒストグラム")).toBeVisible();
  await expect(previewPanel.locator(".previewStatusGrid")).toContainText(
    "file=clipboard-image.png"
  );
});
