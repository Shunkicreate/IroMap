import { expect, test } from "@playwright/test";
import { getPanel, uploadRedPng } from "./helpers";

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

test.describe("ワイドレイアウト", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("主要UIが横並びで表示される", async ({ page }) => {
    await page.goto("/");

    await expect(getPanel(page, "選択画像")).toBeVisible();
    await expect(getPanel(page, "3Dキューブ")).toBeVisible();
    await expect(getPanel(page, "スライス")).toBeVisible();
    await expect(getPanel(page, "分析表")).toBeVisible();

    const previewBox = await getPanel(page, "選択画像").boundingBox();
    const cubeBox = await getPanel(page, "3Dキューブ").boundingBox();
    const sliceBox = await getPanel(page, "スライス").boundingBox();
    const metricsBox = await getPanel(page, "分析表").boundingBox();

    expect(previewBox).not.toBeNull();
    expect(cubeBox).not.toBeNull();
    expect(sliceBox).not.toBeNull();
    expect(metricsBox).not.toBeNull();

    expect(Math.abs(previewBox!.y - cubeBox!.y)).toBeLessThan(40);
    expect(Math.abs(cubeBox!.y - sliceBox!.y)).toBeLessThan(40);
    expect(Math.abs(sliceBox!.y - metricsBox!.y)).toBeLessThan(40);

    expect(previewBox!.x).toBeLessThan(cubeBox!.x);
    expect(cubeBox!.x).toBeLessThan(sliceBox!.x);
    expect(sliceBox!.x).toBeLessThan(metricsBox!.x);
  });
});

test.describe("中間レイアウト", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("主要UIが2カラムで表示される", async ({ page }) => {
    await page.goto("/");

    await expect(getPanel(page, "選択画像")).toBeVisible();
    await expect(getPanel(page, "3Dキューブ")).toBeVisible();
    await expect(getPanel(page, "スライス")).toBeVisible();
    await expect(getPanel(page, "分析表")).toBeVisible();

    const previewBox = await getPanel(page, "選択画像").boundingBox();
    const cubeBox = await getPanel(page, "3Dキューブ").boundingBox();
    const sliceBox = await getPanel(page, "スライス").boundingBox();
    const metricsBox = await getPanel(page, "分析表").boundingBox();

    expect(previewBox).not.toBeNull();
    expect(cubeBox).not.toBeNull();
    expect(sliceBox).not.toBeNull();
    expect(metricsBox).not.toBeNull();

    expect(Math.abs(previewBox!.y - cubeBox!.y)).toBeLessThan(40);
    expect(previewBox!.x).toBeLessThan(cubeBox!.x);

    expect(Math.abs(sliceBox!.y - metricsBox!.y)).toBeLessThan(40);
    expect(sliceBox!.x).toBeLessThan(metricsBox!.x);
    expect(sliceBox!.y).toBeGreaterThan(previewBox!.y + 40);
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

test("3Dキューブの設定がリロード後も保持される", async ({ page }) => {
  await page.goto("/");

  const cubePanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "3Dキューブ" }),
  });

  await cubePanel.getByRole("tab", { name: "HSL" }).click();
  await cubePanel.getByRole("button", { name: "表示オプション" }).click();
  await cubePanel.getByLabel("サイズスライダーを表示").uncheck();
  await cubePanel.getByRole("tab", { name: "画像のみ", exact: true }).click();

  await page.reload();

  const reloadedCubePanel = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "3Dキューブ" }),
  });

  await expect(reloadedCubePanel.getByRole("tab", { name: "HSL" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(reloadedCubePanel.getByLabel("サイズスライダーを表示")).not.toBeChecked();
  await expect(reloadedCubePanel.getByRole("slider", { name: /キューブサイズ:/ })).toHaveCount(0);
  await expect(
    reloadedCubePanel.getByRole("tab", { name: "画像のみ", exact: true })
  ).toHaveAttribute("aria-selected", "true");
});
