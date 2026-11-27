import { expect, test } from "@playwright/test";
import { uploadRedPng } from "./helpers";

test("development interactions do not inject GA or enqueue analytics", async ({ page }) => {
  test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) && !process.env.IROMAP_TEST_DEVELOPMENT,
    "Requires the development server"
  );
  await page.goto("/");
  await uploadRedPng(page);
  await page.locator('[data-analytics-id="cube-options"]').click();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as Window & { dataLayer?: unknown[] }).dataLayer)
  ).toBeUndefined();
});
