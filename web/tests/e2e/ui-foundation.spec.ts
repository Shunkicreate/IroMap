import { expect, test } from "@playwright/test";

test("T-102(ui-foundation): モバイル幅でレイアウト崩れがないことを確認", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  expect(hasOverflow).toBe(false);
  await expect(page.getByRole("heading", { name: "IroMap ワークベンチ" })).toBeVisible();
});

test("T-103(ui-foundation): モバイル幅でも写真分析パネルが表示される", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".analysisSection")).toBeVisible();
  await expect(page.getByText("写真をアップロードして分析を始める")).toBeVisible();
  await expect(page.getByRole("heading", { name: "写真分析 MVP" })).toBeVisible();
});
