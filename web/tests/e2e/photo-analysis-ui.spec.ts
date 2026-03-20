import { expect, test } from "@playwright/test";
import { getPanel, uploadRedPng } from "./helpers";

test("T-105(photo-analysis): 評価基準ヘルプの表示とラベル判定を確認", async ({ page }) => {
  await page.goto("/");
  await uploadRedPng(page);

  const analysis = getPanel(page, "写真分析 MVP");
  await expect(analysis.getByText("色相ヒストグラム")).toBeVisible({ timeout: 15000 });
  await expect(analysis.getByText("分析結果の見方")).toBeVisible();
  await expect(analysis.getByText(/^色相バランス:/)).toBeVisible();
  await expect(analysis.getByText(/^彩度傾向:/)).toBeVisible();
  await expect(analysis.getByText("選択領域の占有率", { exact: true })).toHaveCount(0);
});

test("T-005(photo-analysis): 画像アップロード操作を写真分析パネル内で完結できる", async ({
  page,
}) => {
  await page.goto("/");
  await uploadRedPng(page);

  await expect(page.getByLabel("画像をアップロード")).toBeVisible();

  const analysis = getPanel(page, "写真分析 MVP");
  await expect(analysis.getByText("色面積比")).toBeVisible({ timeout: 15000 });
  await expect(analysis.locator(".areaList li").first()).toBeVisible();
  await expect(analysis.locator(".areaList li strong").first()).toContainText("%");
});
