import { expect, test } from "@playwright/test";
import { getPanel, uploadRedPng } from "./helpers";

test("T-105(photo-analysis): 評価基準ヘルプの表示とラベル判定を確認", async ({ page }) => {
  await page.goto("/");
  await uploadRedPng(page);

  const analysis = getPanel(page, "写真分析");
  await expect(analysis.getByText("分析結果の見方")).toBeVisible();
  await expect(analysis.getByText(/^色相バランス:/)).toBeVisible();
  await expect(analysis.getByText(/^彩度傾向:/)).toBeVisible();
  await expect(getPanel(page, "Lab a-b 散布図")).toBeVisible({ timeout: 15000 });
});

test("T-005(photo-analysis): 画像アップロード操作で分析結果表示まで完結できる", async ({
  page,
}) => {
  await page.goto("/");
  await uploadRedPng(page);

  await expect(page.getByLabel("画像をアップロード")).toBeVisible();

  await expect(getPanel(page, "Lab a-b 散布図")).toBeVisible({ timeout: 15000 });
  await expect(
    getPanel(page, "選択画像").getByRole("img", { name: "分析対象画像: red.png" })
  ).toBeVisible();
});
