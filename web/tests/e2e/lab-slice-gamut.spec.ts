import { expect, test } from "@playwright/test";
import { getPanel, getSliceCanvas } from "./helpers";

test("Lab slices have transparent outside pixels while RGB remains opaque", async ({ page }) => {
  await page.goto("/");
  const slice = getPanel(page, "スライス");
  const canvas = getSliceCanvas(page);
  await expect(canvas).toBeVisible();
  const countOpaque = () =>
    canvas.evaluate((element) => {
      const target = element as HTMLCanvasElement;
      const data = target.getContext("2d")!.getImageData(0, 0, target.width, target.height).data;
      let opaque = 0;
      for (let offset = 3; offset < data.length; offset += 4) {
        if (data[offset] === 255) opaque += 1;
      }
      return opaque;
    });
  await expect.poll(countOpaque).toBe(256 * 256);
  await page.getByRole("tab", { name: "Lab", exact: true }).click();
  for (const [axis, value] of [
    ["lab-l", "50"],
    ["lab-a", "0"],
    ["lab-b", "0"],
  ]) {
    await slice.getByRole("combobox").selectOption(axis);
    await slice.getByRole("slider").fill(value);
    await expect.poll(countOpaque).toBeGreaterThan(0);
    await expect.poll(countOpaque).toBeLessThan(256 * 256);
    await expect
      .poll(() =>
        canvas.evaluate(
          (element) =>
            (element as HTMLCanvasElement).getContext("2d")!.getImageData(0, 0, 1, 1).data[3]
        )
      )
      .toBe(0);
  }
  await page.getByRole("tab", { name: "RGB", exact: true }).click();
  await expect.poll(countOpaque).toBe(256 * 256);
});
