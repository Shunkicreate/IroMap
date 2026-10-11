import { expect, test, type Page } from "@playwright/test";
import { getPanel, getSliceCanvas } from "./helpers";

const applySelectedColor = async (page: Page, color: string): Promise<void> => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(async (value) => navigator.clipboard.writeText(value), color);
  const inspector = getPanel(page, "インスペクタ");
  const pasteButton = inspector.getByRole("button", { name: "貼り付け", exact: true });
  if (!(await pasteButton.isVisible())) {
    await inspector.locator(".persistedDisclosureTrigger").click();
  }
  await pasteButton.click();
  await expect(inspector.locator(".colorRowSelected code").first()).toHaveText(color);
};

test("T-104(slice): 未選択時は移動できず、選択色の高さに戻せる", async ({ page }) => {
  await page.goto("/");
  const panel = getPanel(page, "スライス");
  const button = panel.getByRole("button", { name: "選択色の高さへ移動" });
  const slider = panel.getByRole("slider");
  await expect(button).toBeDisabled();
  await applySelectedColor(page, "#FF0000");
  await expect(button).toBeEnabled();
  await slider.fill("64");
  await expect(slider).toHaveValue("64");
  await button.click();
  await expect(slider).toHaveValue("255");
  await slider.fill("64");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(slider).toHaveValue("255");
  await expect(panel.locator(".sliceAxisBadge")).toHaveText("R 固定 = 255");
});

test("T-105(slice): RGB/HSL/Lab の全固定軸で選択色へ移動する", async ({ page }) => {
  await page.goto("/");
  await applySelectedColor(page, "#FF0000");
  const panel = getPanel(page, "スライス");
  const slider = panel.getByRole("slider");
  const button = panel.getByRole("button", { name: "選択色の高さへ移動" });
  const cases = [
    { space: "RGB", axis: "r", label: "R", value: 255 },
    { space: "RGB", axis: "g", label: "G", value: 0 },
    { space: "RGB", axis: "b", label: "B", value: 0 },
    { space: "HSL", axis: "h", label: "H", value: 0 },
    { space: "HSL", axis: "s", label: "S", value: 100 },
    { space: "HSL", axis: "l", label: "L", value: 50 },
    { space: "Lab", axis: "lab-l", label: "L*", value: 53 },
    { space: "Lab", axis: "lab-a", label: "a", value: 80 },
    { space: "Lab", axis: "lab-b", label: "b", value: 67 },
  ];
  for (const entry of cases) {
    await page.getByRole("tab", { name: entry.space, exact: true }).click();
    await panel.getByRole("combobox").selectOption(entry.axis);
    await slider.fill("25");
    await expect(slider).toHaveValue("25");
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    );
    const previousCanvas = await getSliceCanvas(page).evaluate((canvas) =>
      (canvas as HTMLCanvasElement).toDataURL()
    );
    await button.click();
    await expect(slider).toHaveValue(String(entry.value));
    await expect(panel.getByRole("combobox")).toHaveValue(entry.axis);
    await expect(panel.locator(".sliceAxisBadge")).toHaveText(
      `${entry.label} 固定 = ${entry.value}`
    );
    await expect
      .poll(() =>
        getSliceCanvas(page).evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())
      )
      .not.toBe(previousCanvas);
  }
  await expect(getPanel(page, "インスペクタ").locator(".colorRowSelected code").first()).toHaveText(
    "#FF0000"
  );
});

test("T-105(slice): 新しい選択色の負の Lab 成分へ移動する", async ({ page }) => {
  await page.goto("/");
  await applySelectedColor(page, "#FF0000");
  await page.getByRole("tab", { name: "Lab", exact: true }).click();
  const panel = getPanel(page, "スライス");
  await panel.getByRole("combobox").selectOption("lab-a");
  const button = panel.getByRole("button", { name: "選択色の高さへ移動" });
  await button.click();
  await expect(panel.getByRole("slider")).toHaveValue("80");
  await applySelectedColor(page, "#00FF00");
  await expect(panel.getByRole("slider")).toHaveValue("80");
  await button.click();
  await expect(panel.getByRole("slider")).toHaveValue("-86");
  await expect(panel.locator(".sliceAxisBadge")).toHaveText("a 固定 = -86");
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`T-106(slice): ${width}px 幅で移動ボタンが画面内に収まる`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const button = getPanel(page, "スライス").getByRole("button", {
      name: "選択色の高さへ移動",
    });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await applySelectedColor(page, "#FF0000");
    await button.click();
    await expect(getPanel(page, "スライス").getByRole("slider")).toHaveValue("255");
  });
}
