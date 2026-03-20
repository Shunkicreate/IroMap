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

  const cubePanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "RGBキューブ" }),
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

test("折りたたみ状態と表示オプションがリロード後も保持される", async ({ page }) => {
  await page.goto("/");

  const cubePanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "RGBキューブ" }),
  });
  await cubePanel.getByRole("button", { name: "表示オプション" }).click();
  await cubePanel.getByLabel("RGBキューブの白マッピングを表示").uncheck();

  const inspectorPanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "インスペクタ" }),
  });
  await inspectorPanel.getByRole("button", { name: "インスペクタを開く" }).click();

  await page.reload();

  await expect(
    page
      .locator("section.panel", {
        has: page.getByRole("heading", { name: "RGBキューブ" }),
      })
      .getByLabel("RGBキューブの白マッピングを表示")
  ).not.toBeChecked();
  await expect(
    page
      .locator("section.panel", {
        has: page.getByRole("heading", { name: "インスペクタ" }),
      })
      .getByText("プレビュー（ホバー）")
  ).toBeVisible();
});
