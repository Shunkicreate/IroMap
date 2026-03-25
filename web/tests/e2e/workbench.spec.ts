import { expect, test } from "@playwright/test";
import { getPanel } from "./helpers";

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

test.describe("モバイルレイアウト", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("主要UIが意図した順番で並ぶ", async ({ page }) => {
    await page.goto("/");

    const previewPanel = getPanel(page, "選択画像");
    const cubePanel = getPanel(page, "3Dキューブ");
    const slicePanel = getPanel(page, "スライス");
    const metricsPanel = getPanel(page, "分析表");

    await expect(previewPanel).toBeVisible();
    await expect(cubePanel).toBeVisible();
    await expect(slicePanel).toBeVisible();
    await expect(metricsPanel).toBeVisible();

    const previewBox = await previewPanel.boundingBox();
    const cubeBox = await cubePanel.boundingBox();
    const sliceBox = await slicePanel.boundingBox();
    const metricsBox = await metricsPanel.boundingBox();

    expect(previewBox).not.toBeNull();
    expect(cubeBox).not.toBeNull();
    expect(sliceBox).not.toBeNull();
    expect(metricsBox).not.toBeNull();

    expect(previewBox!.y).toBeLessThan(cubeBox!.y);
    expect(cubeBox!.y).toBeLessThan(sliceBox!.y);
    expect(sliceBox!.y).toBeLessThan(metricsBox!.y);
  });
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

test("折りたたみ状態と表示オプションがリロード後も保持される", async ({ page }) => {
  await page.goto("/");

  const cubePanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "3Dキューブ" }),
  });
  await cubePanel.getByRole("button", { name: "表示オプション" }).click();
  await cubePanel.getByLabel("白マッピングを表示").uncheck();

  const inspectorPanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "インスペクタ" }),
  });
  await inspectorPanel.locator(".persistedDisclosureTrigger").click();
  await expect(inspectorPanel.getByText("プレビュー（ホバー）")).toBeVisible();

  await page.reload();

  const reloadedCubePanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "3Dキューブ" }),
  });
  await expect(reloadedCubePanel.getByLabel("白マッピングを表示")).toBeVisible();
  await expect(reloadedCubePanel.getByLabel("白マッピングを表示")).not.toBeChecked();

  const reloadedInspectorPanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "インスペクタ" }),
  });
  await expect(reloadedInspectorPanel.getByText("プレビュー（ホバー）")).toBeVisible();
});
