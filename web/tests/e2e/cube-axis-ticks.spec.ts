import { expect, test, type Page } from "@playwright/test";
import { getCubeCanvas, getPanel } from "./helpers";

type AxisLabel = { text: string; x: number; y: number; width: number };
type AxisTestWindow = Window & { cubeAxisLabels: AxisLabel[] };

const readLabels = (page: Page) =>
  page.evaluate(() => (window as unknown as AxisTestWindow).cubeAxisLabels);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as AxisTestWindow;
    state.cubeAxisLabels = [];
    const clearRect = CanvasRenderingContext2D.prototype.clearRect;
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains("cubeCanvas")) {
        state.cubeAxisLabels = [];
      }
      clearRect.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      if (
        this.canvas.classList.contains("cubeCanvas") &&
        ["#ff8080", "#89ebad", "#9cceff"].includes(String(this.fillStyle))
      ) {
        state.cubeAxisLabels.push({ text, x, y, width: this.measureText(text).width });
      }
      if (maxWidth === undefined) {
        fillText.call(this, text, x, y);
      } else {
        fillText.call(this, text, x, y, maxWidth);
      }
    };
  });
  await page.goto("/");
});

test("色空間ごとの軸名と数値が描画され、表示切替と回転に追従する", async ({ page }) => {
  const panel = getPanel(page, "3Dキューブ");
  await expect
    .poll(async () => (await readLabels(page)).map((label) => label.text))
    .toEqual(expect.arrayContaining(["G 255", "R 255", "B 255", "0", "128"]));
  await panel.getByRole("tab", { name: "HSL" }).click();
  await expect
    .poll(async () => (await readLabels(page)).map((label) => label.text))
    .toEqual(expect.arrayContaining(["L 100%", "0%", "50%", "S·cos(H) 100%", "S·sin(H) 100%"]));
  await panel.getByRole("tab", { name: "Lab" }).click();
  await expect
    .poll(async () => (await readLabels(page)).map((label) => label.text))
    .toEqual(expect.arrayContaining(["L* 100", "0", "50", "a* 128", "b* 128", "-64"]));
  await panel.getByRole("button", { name: "表示オプション" }).click();
  await panel.getByLabel("軸ガイドを表示").uncheck();
  await expect.poll(() => readLabels(page)).toEqual([]);
  await panel.getByLabel("軸ガイドを表示").check();
  await expect.poll(async () => (await readLabels(page)).length).toBeGreaterThan(0);

  const slider = panel.getByRole("slider", { name: /キューブサイズ:/ });
  await slider.fill("320");
  await expect(slider).toHaveValue("320");
  const atMinimum = await readLabels(page);
  await slider.fill("900");
  await expect(slider).toHaveValue("900");
  await expect.poll(() => readLabels(page)).not.toEqual(atMinimum);

  const before = await readLabels(page);
  const canvas = getCubeCanvas(page);
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2 + 20, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => readLabels(page)).not.toEqual(before);
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`幅${width}で数値がキャンバス内に収まり重ならない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const panel = getPanel(page, "3Dキューブ");
    for (const space of ["RGB", "HSL", "Lab"]) {
      await panel.getByRole("tab", { name: space, exact: true }).click();
      await expect.poll(async () => (await readLabels(page)).length).toBeGreaterThan(0);
      await getCubeCanvas(page).screenshot({ path: test.info().outputPath(`${space}.png`) });
      // Screenshot waits for the resized canvas to settle before reading this frame's labels.
      const labels = await readLabels(page);
      const box = await getCubeCanvas(page).boundingBox();
      expect(box).not.toBeNull();
      for (const label of labels) {
        expect(label.x - label.width / 2).toBeGreaterThanOrEqual(0);
        expect(label.x + label.width / 2).toBeLessThanOrEqual(box!.width);
        expect(label.y - 9).toBeGreaterThanOrEqual(0);
        expect(label.y + 9).toBeLessThanOrEqual(box!.height);
      }
      for (let index = 0; index < labels.length; index += 1) {
        for (const other of labels.slice(index + 1)) {
          const label = labels[index];
          expect(
            Math.abs(label.x - other.x) >= (label.width + other.width) / 2 ||
              Math.abs(label.y - other.y) >= 18
          ).toBe(true);
        }
      }
    }
  });
}
