import { expect, test } from "@playwright/test";

test("ワークベンチの主要UIが表示される", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "画像の色構造を一目で理解する" })).toBeVisible();
  await expect(page.getByText("画像をアップロードして分析を始める")).toBeVisible();
  await expect(page.getByText("画像を選ぶ", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3Dキューブ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "インスペクタ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "スライス" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "写真分析" })).toBeVisible();
});

test("サイズスライダーの表示切り替えができる", async ({ page }) => {
  await page.goto("/");

  const cubePanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "3Dキューブ" }),
  });
  await cubePanel.getByRole("button", { name: "表示オプション" }).click();

  const toggle = cubePanel.getByLabel("サイズスライダーを表示");
  const cubeSizeSlider = cubePanel.getByRole("slider", { name: /キューブサイズ:/ });

  await expect(cubeSizeSlider).toBeVisible();

  await toggle.uncheck();
  await expect(cubeSizeSlider).toHaveCount(0);

  await toggle.check();
  await expect(cubeSizeSlider).toBeVisible();
});
