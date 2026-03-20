import { expect, test } from "@playwright/test";
import { getPanel, uploadRedPng } from "./helpers";

test("T-105(photo-analysis): 評価基準ヘルプの表示とラベル判定を確認", async ({ page }) => {
  await page.goto("/");
  await uploadRedPng(page);

  const analysis = getPanel(page, "写真分析");
  await expect(analysis.getByText("Lab a-b 散布図")).toBeVisible({ timeout: 15000 });
  await expect(analysis.getByText("分析結果の見方")).toBeVisible();
  await expect(analysis.getByText(/^色相バランス:/)).toBeVisible();
  await expect(analysis.getByText(/^彩度傾向:/)).toBeVisible();
  await expect(analysis.getByText(/^分布の広がり:/)).toBeVisible();
});

test("T-005(photo-analysis): 画像アップロード操作を写真分析パネル内で完結できる", async ({
  page,
}) => {
  await page.goto("/");
  await uploadRedPng(page);

  await expect(page.getByLabel("画像をアップロード")).toBeVisible();

  const analysis = getPanel(page, "写真分析");
  await expect(analysis.getByRole("button", { name: "キューブで確認" }).first()).toBeVisible({
    timeout: 15000,
  });
  await analysis.getByRole("button", { name: "キューブで確認" }).first().click();

  const inspector = getPanel(page, "インスペクタ");
  await expect(inspector.getByText(/^#[0-9A-F]{6}$/i).last()).toBeVisible();
});
