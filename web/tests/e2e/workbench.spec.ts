import { expect, test } from "@playwright/test";
import { uploadRedPng } from "./helpers";

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

test("アップロードと選択操作の計測ログを取得できる", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__IROMAP_PERF__ = { entries: [] };
  });

  await uploadRedPng(page);
  await expect
    .poll(async () => {
      return page.evaluate(() => window.__IROMAP_PERF__?.entries.map((entry) => entry.name) ?? []);
    })
    .toContain("workbench.photo-analysis.total");

  const sliceCanvas = page.locator(".sliceCanvas:not(.sliceCanvasOverlay)");
  await expect(sliceCanvas).toBeVisible();
  await sliceCanvas.click({ position: { x: 24, y: 24 } });

  await expect
    .poll(async () => {
      return page.evaluate(() => window.__IROMAP_PERF__?.entries.map((entry) => entry.name) ?? []);
    })
    .toEqual(
      expect.arrayContaining(["workbench.photo-analysis.total", "workbench.derived-analysis.total"])
    );

  const entries = await page.evaluate(() => window.__IROMAP_PERF__?.entries ?? []);
  for (const entry of entries) {
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  }
});
