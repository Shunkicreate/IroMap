import { expect, test } from "@playwright/test";
import { getPanel, getSliceCanvas } from "./helpers";

test("a sample remains selectable after fitting a high-lightness Lab slice", async ({ page }) => {
  await page.goto("/");
  const png = await page.evaluate(() => {
    window.__IROMAP_PERF__ = { entries: [] };
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#e6e6e6";
    context.fillRect(0, 0, 1, 1);
    return canvas.toDataURL().split(",")[1];
  });
  await page.getByLabel("画像をアップロード").setInputFiles({
    name: "light-gray.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await expect(
    getPanel(page, "写真分析").getByRole("heading", { name: "Lab a-b 散布図" })
  ).toBeVisible();
  await page.getByRole("tab", { name: "Lab", exact: true }).click();
  const panel = getPanel(page, "スライス");
  await panel.getByRole("combobox").selectOption("lab-l");
  await panel.getByRole("slider").fill("91");
  const canvas = getSliceCanvas(page);
  await expect
    .poll(() => canvas.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a))
    .toBeGreaterThan(1);
  await canvas.scrollIntoViewIfNeeded();
  const point = await canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.left + (128.5 / 256) * bounds.width,
      y: bounds.top + (127.5 / 256) * bounds.height,
    };
  });
  await page.mouse.click(point.x, point.y);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__IROMAP_PERF__?.entries
            .filter((entry) => entry.name === "workbench.derived-analysis.total")
            .at(-1)?.detail?.selectionSource
      )
    )
    .toBe("slice-pick");
});

test("Lab lightness slices share a finite display transform across all canvas layers", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Lab", exact: true }).click();
  const panel = getPanel(page, "スライス");
  await panel.getByRole("combobox").selectOption("lab-l");
  for (const value of [0, 1, 50, 91, 99, 100]) {
    await panel.getByRole("slider").fill(String(value));
    await expect
      .poll(() =>
        panel.locator(".sliceCanvasStack").evaluate((stack) => {
          const transforms = Array.from(
            stack.querySelectorAll("canvas"),
            (canvas) => getComputedStyle(canvas).transform
          );
          return (
            transforms.length === 3 &&
            transforms.every(
              (transform) => transform === transforms[0] && !transform.includes("NaN")
            )
          );
        })
      )
      .toBe(true);
    if (value === 91) {
      const transform = await getSliceCanvas(page).evaluate(
        (canvas) => new DOMMatrix(getComputedStyle(canvas).transform).a
      );
      expect(transform).toBeGreaterThan(1);
      await panel.screenshot({ path: testInfo.outputPath("lab-l91-fit.png") });
    }
  }
  await page.getByRole("tab", { name: "RGB", exact: true }).click();
  await expect
    .poll(() => getSliceCanvas(page).evaluate((canvas) => getComputedStyle(canvas).transform))
    .toBe("none");
});
