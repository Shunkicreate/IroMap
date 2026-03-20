import { expect, test } from "@playwright/test";
import { getSliceCanvas, uploadRedPng } from "./helpers";

test("T-101(ui-foundation): トップページに機能/ドキュメント導線を表示しない", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "機能" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "ドキュメント" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "仕様ドキュメントへ" })).toHaveCount(0);
});

test("T-102(ui-foundation): モバイル幅でレイアウト崩れがないことを確認", async ({ page }) => {
  const viewports = [
    { width: 320, height: 900 },
    { width: 375, height: 900 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1440, height: 960 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const overflowDelta = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });

    expect(overflowDelta).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { name: "画像の色構造を一目で理解する" })).toBeVisible();

    const cubeBox = await page.locator(".cubeCanvas").boundingBox();
    expect(cubeBox).not.toBeNull();
    expect(cubeBox!.width).toBeLessThanOrEqual(viewport.width - 16);

    const sliceBox = await getSliceCanvas(page).boundingBox();
    expect(sliceBox).not.toBeNull();
    expect(sliceBox!.width).toBeLessThanOrEqual(viewport.width - 16);
  }
});

test("T-103(ui-foundation): キーボード操作でタブを切替できる", async ({ page }) => {
  await page.goto("/");

  const rgbTab = page.getByRole("tab", { name: "RGB" });
  await rgbTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "HSL", selected: true })).toBeVisible();
});

test("T-104(ui-foundation): ライト/ダーク切替時の可読性を確認", async ({ page }) => {
  await page.goto("/");

  const themeButton = page.getByRole("button", { name: "テーマ" });
  await themeButton.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator(".landingHero")).toBeVisible();

  await themeButton.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("T-105(ui-foundation): インスペクタから貼り付け色を適用できる", async ({ page }) => {
  await page.goto("/");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(async () => {
    await navigator.clipboard.writeText("#ff4020");
  });
  const inspector = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "インスペクタ" }),
  });
  await inspector.locator(".persistedDisclosureTrigger").click();
  await inspector.getByRole("button", { name: "貼り付け" }).click();
  await expect(inspector.getByText(/^#[0-9A-F]{6}$/i).last()).toBeVisible();
});

test("T-106(ui-foundation): 可視化の軸/凡例/説明が表示されることを確認", async ({ page }) => {
  await page.goto("/");
  await uploadRedPng(page);

  await expect(page.getByText(/^X軸: [RGB] \(左→右\)$/)).toBeVisible();
  await expect(page.getByText(/^Y軸: [RGB] \(下→上\)$/)).toBeVisible();
  await expect(page.getByText("分析結果の見方")).toBeVisible();
});

test("T-107(ui-foundation): 操作通知がaria-liveで提供されることを確認", async ({ page }) => {
  await page.goto("/");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(async () => {
    await navigator.clipboard.writeText("#ff4020");
  });

  const inspector = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "インスペクタ" }),
  });
  await inspector.locator(".persistedDisclosureTrigger").click();
  await inspector.getByRole("button", { name: "貼り付け" }).click();

  const liveRegion = inspector.locator(".copyStatus[aria-live='polite']");
  await expect(liveRegion).toContainText("貼り付け色を適用しました");
});

test("T-108(ui-foundation): ヘッダーがモバイル/デスクトップで過剰な高さを使わない", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const desktopHeight = await page.locator(".landingHero").evaluate((node) => {
    return node.getBoundingClientRect().height;
  });
  expect(desktopHeight).toBeLessThan(180);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileHeight = await page.locator(".landingHero").evaluate((node) => {
    return node.getBoundingClientRect().height;
  });
  expect(mobileHeight).toBeLessThan(220);
});

test("T-109(ui-foundation): 写真分析の上部CTAと分析パネルが表示される", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByText("画像をアップロードして分析を始める")).toBeVisible();
  await expect(page.getByRole("heading", { name: "写真分析" })).toBeVisible();
});
