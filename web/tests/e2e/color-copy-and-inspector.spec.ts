import { expect, test, type Page } from "@playwright/test";
import { getPanel } from "./helpers";

const openInspector = async (page: Page): Promise<void> => {
  const inspector = getPanel(page, "インスペクタ");
  await inspector.locator(".persistedDisclosureTrigger").click();
};

const applyColorViaInspectorPaste = async (page: Page, value = "#ff4020"): Promise<void> => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(async (nextValue) => {
    await navigator.clipboard.writeText(nextValue);
  }, value);
  const inspector = getPanel(page, "インスペクタ");
  await inspector.getByRole("button", { name: "貼り付け" }).click();
};

test("T-101(color-copy): 選択色保持の確認", async ({ page }) => {
  await page.goto("/");
  await openInspector(page);
  await applyColorViaInspectorPaste(page);

  const selectedCard = getPanel(page, "インスペクタ").locator(".inspectorCard").nth(1);
  await expect(
    selectedCard.locator(".copyValueRow").filter({ hasText: "HEX" }).locator("code")
  ).not.toHaveText("--");
});

test("T-102(color-copy): コピー形式の確認", async ({ page }) => {
  await page.goto("/");
  await openInspector(page);
  await applyColorViaInspectorPaste(page);

  const inspector = getPanel(page, "インスペクタ");
  await expect(
    inspector
      .locator(".inspectorCard")
      .nth(1)
      .locator(".copyValueRow")
      .filter({ hasText: "HEX" })
      .locator("code")
  ).not.toHaveText("--");
  await expect(
    inspector
      .locator(".inspectorCard")
      .nth(1)
      .locator(".copyValueRow")
      .filter({ hasText: "rgb()" })
      .locator("code")
  ).toHaveText(/^rgb\(\d+, \d+, \d+\)$/);
  await expect(
    inspector
      .locator(".inspectorCard")
      .nth(1)
      .locator(".copyValueRow")
      .filter({ hasText: "hsl()" })
      .locator("code")
  ).toHaveText(/^hsl\(\d+, \d+%, \d+%\)$/);
});

test("T-101(inspector): プレビュー表示の確認", async ({ page }) => {
  await page.goto("/");
  await openInspector(page);
  const inspector = getPanel(page, "インスペクタ");
  await expect(inspector.locator("code")).toHaveCount(6);
  await expect(inspector.locator("code", { hasText: "--" })).toHaveCount(6);
  await expect(inspector.getByText("プレビュー（ホバー）")).toBeVisible();
});

test("T-102(inspector): 選択色保持の確認", async ({ page }) => {
  await page.goto("/");
  await openInspector(page);
  await applyColorViaInspectorPaste(page);

  const selectedCard = getPanel(page, "インスペクタ").locator(".inspectorCard").nth(1);
  await expect(
    selectedCard.locator(".copyValueRow").filter({ hasText: "HEX" }).locator("code")
  ).toHaveText(/^#[0-9A-F]{6}$/i);
});

test("T-103(inspector): 3形式表示の確認", async ({ page }) => {
  await page.goto("/");
  await openInspector(page);
  await applyColorViaInspectorPaste(page);

  const selectedCard = getPanel(page, "インスペクタ").locator(".inspectorCard").nth(1);
  await expect(
    selectedCard.locator(".copyValueRow").filter({ hasText: "HEX" }).locator("code")
  ).toHaveText(/^#[0-9A-F]{6}$/i);
  await expect(
    selectedCard.locator(".copyValueRow").filter({ hasText: "rgb()" }).locator("code")
  ).toHaveText(/^rgb\(\d+, \d+, \d+\)$/);
  await expect(
    selectedCard.locator(".copyValueRow").filter({ hasText: "hsl()" }).locator("code")
  ).toHaveText(/^hsl\(\d+, \d+%, \d+%\)$/);
});

test("T-104(inspector): デスクトップ幅で2要素が横並び表示される", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await openInspector(page);

  const cards = getPanel(page, "インスペクタ").locator(".inspectorCard");
  await expect(cards).toHaveCount(2);
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();

  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  if (!first || !second) {
    return;
  }
  expect(Math.abs(first.y - second.y)).toBeLessThan(20);
});
