import { expect, test } from "@playwright/test";
import { getPanel, hoverColorOnSlice, selectColorFromSlice } from "./helpers";

test("T-101(color-copy): 選択色保持の確認", async ({ page }) => {
  await page.goto("/");
  await selectColorFromSlice(page);

  const selectedPanel = getPanel(page, "インスペクタ");
  await expect(selectedPanel.getByText(/^#[0-9A-F]{6}$/i).last()).toBeVisible();
});

test("T-102(color-copy): コピー形式の確認", async ({ page }) => {
  await page.goto("/");
  await selectColorFromSlice(page);

  const copyPanel = getPanel(page, "カラーコピー");
  await expect(copyPanel.locator("code.copyValue")).toHaveText(/^#[0-9A-F]{6}$/i);

  await copyPanel.getByLabel("形式").selectOption("rgb");
  await expect(copyPanel.locator("code.copyValue")).toHaveText(/^rgb\(\d+, \d+, \d+\)$/);

  await copyPanel.getByLabel("形式").selectOption("hsl");
  await expect(copyPanel.locator("code.copyValue")).toHaveText(/^hsl\(\d+, \d+%, \d+%\)$/);
});

test("T-101(inspector): プレビュー表示の確認", async ({ page }) => {
  await page.goto("/");
  const inspector = getPanel(page, "インスペクタ");
  await expect(inspector.locator("code")).toHaveCount(6);
  await expect(inspector.locator("code", { hasText: "--" })).toHaveCount(6);

  await hoverColorOnSlice(page);
  await expect(inspector.getByText(/^#[0-9A-F]{6}$/i).first()).toBeVisible();
});

test("T-102(inspector): 選択色保持の確認", async ({ page }) => {
  await page.goto("/");
  await selectColorFromSlice(page);

  const inspector = getPanel(page, "インスペクタ");
  await expect(inspector.getByText(/^#[0-9A-F]{6}$/i).last()).toBeVisible();
});

test("T-103(inspector): 3形式表示の確認", async ({ page }) => {
  await page.goto("/");
  await selectColorFromSlice(page);

  const inspector = getPanel(page, "インスペクタ");
  await expect(inspector.getByText(/^#[0-9A-F]{6}$/i).first()).toBeVisible();
  await expect(inspector.getByText(/^rgb\(\d+, \d+, \d+\)$/).first()).toBeVisible();
  await expect(inspector.getByText(/^hsl\(\d+, \d+%, \d+%\)$/).first()).toBeVisible();
});
