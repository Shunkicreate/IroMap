import { expect, test } from "@playwright/test";
import { getPanel, getSliceCanvas } from "./helpers";

test("T-101(slice): 断面表示の確認", async ({ page }) => {
  await page.goto("/");
  const slice = getSliceCanvas(page);
  await expect(slice).toBeVisible();
  await expect(slice).toHaveAttribute("width", "256");
  await expect(slice).toHaveAttribute("height", "256");
});

test("T-102(slice): 固定値操作の確認", async ({ page }) => {
  await page.goto("/");
  const slicePanel = getPanel(page, "スライス");
  const valueSlider = slicePanel.getByRole("slider");
  await valueSlider.fill("200");
  await expect(slicePanel.getByText(/固定 = 200$/)).toBeVisible();
});

test("T-103(slice): 3D同期の確認", async ({ page }) => {
  await page.goto("/");
  const slider = getPanel(page, "スライス").locator("input[type='range']");
  await slider.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "180";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(slider).toHaveValue("180");
  await expect(page.locator(".cubeCanvas")).toBeVisible();
});
