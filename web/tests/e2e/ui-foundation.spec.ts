import { expect, test } from "@playwright/test";

test("T-103(ui-foundation): トップページに Hero / Preview が表示され、不要導線がない", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /^IroMap$/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Workbench Preview" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Feature Cards" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Docs" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "ドキュメントを見る" })).toHaveCount(0);
});

test("T-102(ui-foundation): モバイル幅でレイアウト崩れがないことを確認", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const overflowWidth = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });

  expect(overflowWidth).toBeLessThanOrEqual(24);
  await expect(page.getByRole("heading", { name: "IroMap ワークベンチ" })).toBeVisible();
});

test("T-103(ui-foundation): モバイル幅でも写真分析パネルが表示される", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".analysisSection")).toBeVisible();
  await expect(page.getByRole("heading", { name: "写真分析 MVP" })).toBeVisible();
});

test("T-104(ui-foundation): テーマトグルでライト/ダークが切り替わる", async ({ page }) => {
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "テーマ切替" });
  const isDarkBefore = await page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );

  await toggle.click();

  const isDarkAfter = await page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );
  expect(isDarkAfter).toBe(!isDarkBefore);
});

test("T-105(ui-foundation): ポインタ非依存の導線で選択色を更新できる", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /プリセット 1:/ }).click();
  await expect(page.locator(".copyValue")).toHaveText("#FF6347");
});

test("T-106(ui-foundation): 内部要件IDを表示せず、可視化の解釈ガイドを表示する", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByText(/FR-\d/)).toHaveCount(0);
  await expect(page.getByText("分析の見方")).toBeVisible();
});

test("T-107(ui-foundation): コピー通知が aria-live で更新される", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /プリセット 1:/ }).click();
  await page.getByRole("button", { name: "コピー" }).click();
  await expect(page.locator(".copyStatus").first()).toContainText(/1\./);
});
