import { expect, test } from "@playwright/test";
import { getSliceCanvas } from "./helpers";

test("T-101(slice): 断面表示の確認", async ({ page }) => {
  await page.goto("/");
  const slice = getSliceCanvas(page);
  await expect(slice).toBeVisible();
  await expect(slice).toHaveAttribute("width", "256");
  await expect(slice).toHaveAttribute("height", "256");
});

test("T-102(slice): 固定値操作の確認", async ({ page }) => {
  await page.goto("/");
  const valueSlider = page.getByRole("slider", { name: "固定値: 128" });
  await valueSlider.fill("200");
  await expect(page.getByText("R 固定 = 200")).toBeVisible();
});

test("T-103(slice): 3D同期の確認", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("slider", { name: "固定値: 128" }).fill("180");
  await expect(page.getByText("R 固定 = 180")).toBeVisible();
  await expect(page.locator(".cubeCanvas")).toBeVisible();
});
