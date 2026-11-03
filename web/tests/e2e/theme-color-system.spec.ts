import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { getCubeCanvas, getPanel, getSliceCanvas } from "./helpers";

const palette = JSON.parse(readFileSync("../docs/specs/theme-color-system/tokens.json", "utf8"));
const toCss = (hex: string): string =>
  "rgb(" + [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).join(", ") + ")";

test("FR-2/FR-6: both themes apply approved roles and survive reload without hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const themeToggle = page.locator(".themeToggleButton");
  for (const mode of ["light", "dark"] as const) {
    const tokens = palette.modes[mode].tokens;
    for (const overlay of await page.locator(".sliceCanvasOverlay").all())
      await expect(overlay).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    if (
      !(await themeToggle.getAttribute("aria-label"))?.includes(
        mode === "light" ? "ダーク" : "ライト"
      )
    )
      await themeToggle.click();
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      toCss(tokens["surface.canvas"])
    );
    for (const overlay of await page.locator(".sliceCanvasOverlay").all())
      await expect(overlay).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    for (const canvas of [getCubeCanvas(page), getSliceCanvas(page)]) {
      await expect(canvas).toHaveCSS("border-top-width", "1px");
      await expect(canvas).toHaveCSS("border-top-color", toCss(tokens["observation.guide"]));
    }
    await expect(page.locator('[class*="imageStage"]').first()).toHaveCSS(
      "border-top-color",
      toCss(tokens["observation.guide"])
    );
    for (const title of ["3Dキューブ", "スライス"])
      await expect(getPanel(page, title)).toHaveCSS(
        "background-color",
        toCss(tokens["observation.surface"])
      );
    await expect(page.locator(".panel").first()).toHaveCSS(
      "background-color",
      toCss(tokens["observation.surface"])
    );
    await expect(page.locator(".photoUploadButton").first()).toHaveCSS(
      "background-color",
      toCss(tokens["action.primary"])
    );
    await expect(page.locator(".photoUploadButton").first()).toHaveCSS(
      "color",
      toCss(tokens["action.onPrimary"])
    );
    await expect(page.getByRole("tab", { name: "RGB", exact: true })).toHaveCSS(
      "background-color",
      toCss(tokens["selection.surface"])
    );
    await expect(
      getPanel(page, "スライス").getByRole("button", { name: "選択色の高さへ移動" })
    ).toHaveCSS("opacity", "1");
    await expect
      .poll(() =>
        getCubeCanvas(page).evaluate((canvas) => {
          const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
          return "rgb(" + [...pixel].slice(0, 3).join(", ") + ")";
        })
      )
      .toBe(toCss(tokens["observation.surface"]));
    const cube = getCubeCanvas(page);
    const bounds = (await cube.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 100, bounds.y + 80, { steps: 10 });
    await page.mouse.up();
    await expect
      .poll(() =>
        cube.evaluate((element) => {
          const canvas = element as HTMLCanvasElement;
          const ctx = canvas.getContext("2d")!;
          const expected = ctx.getImageData(0, 0, 1, 1).data;
          const strip = ctx.getImageData(0, 0, canvas.width, 5).data;
          return strip.every((channel, index) => channel === expected[index % 4]);
        })
      )
      .toBe(true);
    await page.getByRole("tab", { name: "RGB", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "HSL", exact: true })).toBeFocused();
    await expect(page.getByRole("tab", { name: "HSL", exact: true })).toHaveCSS(
      "outline-color",
      toCss(tokens["focus.ring"])
    );
    await page.getByRole("tab", { name: "RGB", exact: true }).click();
    await page.reload();
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      toCss(tokens["surface.canvas"])
    );
    await expect(themeToggle).toHaveAttribute(
      "aria-label",
      mode === "light" ? "テーマ: ダーク" : "テーマ: ライト"
    );
  }
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("body")).toHaveCSS("font-family", /Noto Sans JP/);
  await expect(page.locator(".landingHero p")).toHaveCSS("letter-spacing", "0.64px");
  await expect(themeToggle).toHaveCSS("letter-spacing", "normal");
  const notoLoaded = await page.evaluate(() =>
    [...document.fonts].some(
      (face) =>
        face.family.includes("Noto Sans JP") &&
        !face.family.includes("Fallback") &&
        face.status === "loaded"
    )
  );
  expect(notoLoaded).toBe(true);
  expect(errors).toEqual([]);
});

test("FR-3: theme changes preserve image pixels, slice RGB, selected HEX and analysis values", async ({
  page,
}) => {
  await page.goto("/");
  const colors = ["#FFFFFF", "#000000", "#FCE6E8", "#A6C8F0", "#E7EDDF", "#EAE1C4"];
  const raw = Buffer.alloc(120 * 20 * 3);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 120; x++) {
      const hex = colors[Math.floor(x / 20)];
      for (let channel = 0; channel < 3; channel++)
        raw[(y * 120 + x) * 3 + channel] = parseInt(
          hex.slice(1 + channel * 2, 3 + channel * 2),
          16
        );
    }
  const image = await sharp(raw, { raw: { width: 120, height: 20, channels: 3 } })
    .png()
    .toBuffer();
  await page
    .getByLabel("画像をアップロード")
    .setInputFiles({ name: "theme-reference.png", mimeType: "image/png", buffer: image });
  const photo = page.getByRole("img", { name: "分析対象画像: theme-reference.png" });
  await expect(photo).toBeVisible();
  await expect(getPanel(page, "分析表").locator("tbody tr").first()).not.toContainText("N/A");
  const readImage = () =>
    photo.evaluate(async (element) => {
      const image = element as HTMLImageElement;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      return [...ctx.getImageData(0, 0, 120, 20).data];
    });
  const beforeImage = await readImage();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("#FCE6E8"));
  const inspector = getPanel(page, "インスペクタ");
  await inspector.locator(".persistedDisclosureTrigger").click();
  await inspector.getByRole("button", { name: "貼り付け", exact: true }).click();
  await expect(inspector.locator(".colorRowSelected code").first()).toHaveText("#FCE6E8");
  const beforeSlice = await getSliceCanvas(page).evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL()
  );
  const beforeMetrics = await getPanel(page, "分析表").locator("tbody").innerText();
  await page.locator(".themeToggleButton").click();
  await expect(inspector.locator(".colorRowSelected code").first()).toHaveText("#FCE6E8");
  expect(
    await getSliceCanvas(page).evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())
  ).toBe(beforeSlice);
  expect(await readImage()).toEqual(beforeImage);
  expect(await getPanel(page, "分析表").locator("tbody").innerText()).toBe(beforeMetrics);
});

test("FR-4: both palettes fit mobile, desktop, 4K and ultrawide viewports", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 375, 768, 1024, 1440, 3440, 3840]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const mode of ["light", "dark"] as const) {
      const toggle = page.locator(".themeToggleButton");
      if (
        !(await toggle.getAttribute("aria-label"))?.includes(mode === "light" ? "ダーク" : "ライト")
      )
        await toggle.click();
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        toCss(palette.modes[mode].tokens["surface.canvas"])
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width
      );
      for (const locator of [
        getCubeCanvas(page),
        getSliceCanvas(page),
        getPanel(page, "スライス").getByRole("slider"),
      ]) {
        const bounds = await locator.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
    }
  }
});
