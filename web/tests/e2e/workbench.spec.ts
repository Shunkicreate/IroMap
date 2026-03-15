import { expect, test } from "@playwright/test";

test("ワークベンチの主要UIが表示される", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "写真の色構造を一目で理解する" })).toBeVisible();
  await expect(page.getByText("写真をアップロードして分析を始める")).toBeVisible();
  await expect(page.getByText("画像を選ぶ", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "RGBキューブ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "インスペクタ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "スライス" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "写真分析 MVP" })).toBeVisible();
});

test("サイズスライダーの表示切り替えができる", async ({ page }) => {
  await page.goto("/");

  const toggle = page.getByLabel("サイズスライダーを表示");
  const cubeSizeSlider = page.getByRole("slider", { name: /キューブサイズ:/ });

  await expect(cubeSizeSlider).toBeVisible();

  await toggle.uncheck();
  await expect(cubeSizeSlider).toHaveCount(0);

  await toggle.check();
  await expect(cubeSizeSlider).toBeVisible();
});
