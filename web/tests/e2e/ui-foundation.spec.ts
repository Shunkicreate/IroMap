import { expect, test } from "@playwright/test";
import { uploadRedPng } from "./helpers";

test("T-101(ui-foundation): トップページに機能/ドキュメント導線を表示しない", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "機能" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "ドキュメント" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "仕様ドキュメントへ" })).toHaveCount(0);
});

test("T-102(ui-foundation): モバイル幅でレイアウト崩れがないことを確認", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const overflowDelta = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });

  expect(overflowDelta).toBeLessThanOrEqual(20);
  await expect(page.getByRole("heading", { name: "IroMap ワークベンチ" })).toBeVisible();
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
  await expect(page.locator(".workbenchTopBar")).toBeVisible();

  await themeButton.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("T-105(ui-foundation): ポインタ未使用で色選択が完了できる", async ({ page }) => {
  await page.goto("/");

  const picker = page.locator(".manualColorPicker");
  await picker.getByRole("spinbutton", { name: "R" }).fill("255");
  await picker.getByRole("spinbutton", { name: "G" }).fill("64");
  await picker.getByRole("spinbutton", { name: "B" }).fill("32");
  await picker.getByRole("button", { name: "選択色に反映" }).click();

  const inspector = page.locator("section.panel", {
    has: page.getByRole("heading", { name: "インスペクタ" }),
  });
  await expect(inspector.getByText("#FF4020")).toBeVisible();
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

  const picker = page.locator(".manualColorPicker");
  await picker.getByRole("spinbutton", { name: "R" }).fill("20");
  await picker.getByRole("spinbutton", { name: "G" }).fill("30");
  await picker.getByRole("spinbutton", { name: "B" }).fill("40");
  await picker.getByRole("button", { name: "選択色に反映" }).click();

  const liveRegion = page.locator(".srOnly[aria-live='polite']");
  await expect(liveRegion).toContainText("キーボード入力から選択色を更新しました");
});

test("T-108(ui-foundation): ヘッダーがモバイル/デスクトップで過剰な高さを使わない", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const desktopHeight = await page.locator(".workbenchTopBar").evaluate((node) => {
    return node.getBoundingClientRect().height;
  });
  expect(desktopHeight).toBeLessThan(120);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileHeight = await page.locator(".workbenchTopBar").evaluate((node) => {
    return node.getBoundingClientRect().height;
  });
  expect(mobileHeight).toBeLessThan(140);
});
