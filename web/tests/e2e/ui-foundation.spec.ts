import { expect, test } from "@playwright/test";

test("T-103(ui-foundation): トップページに Hero / Preview / Feature Cards / Docs 導線が表示される", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /^IroMap$/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Workbench Preview" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Feature Cards" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ドキュメントを見る" })).toBeVisible();
});

test("T-102(ui-foundation): モバイル幅でレイアウト崩れがないことを確認", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  expect(hasOverflow).toBe(false);
  await expect(page.getByRole("heading", { name: "IroMap ワークベンチ" })).toBeVisible();
});
