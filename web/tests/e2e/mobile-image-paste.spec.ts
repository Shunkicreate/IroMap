import { expect, test } from "@playwright/test";
import { getPanel, pasteRedJpegToPhotoAnalysis } from "./helpers";

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

test("iPhone paste input accepts JPEG once without inserting clipboard HTML", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "画像のペースト入力欄" });
  await expect(input).toHaveAttribute("contenteditable", "true");
  await input.focus();
  await page.evaluate(async () => {
    // Exercise the files-only path rather than Chromium's usual items representation.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "red";
    context.fillRect(0, 0, 2, 2);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((result) => resolve(result!), "image/jpeg")
    );
    const file = new File([blob], "note-image.JPG");
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { items: [], files: [file] } });
    document.querySelector('[contenteditable="true"]')!.dispatchEvent(event);
  });
  const panel = getPanel(page, "選択画像");
  await expect(panel.getByRole("img", { name: "分析対象画像: note-image.JPG" })).toBeVisible();
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "クリップボード画像を適用しました" })
  ).toHaveCount(1);
  await expect(input).toHaveText("");
  await pasteRedJpegToPhotoAnalysis(page);
  await expect(panel.getByRole("img", { name: "分析対象画像: clipboard-image.jpg" })).toBeVisible();
});

test("paste input rejects URL-only and HTML-only content without requesting it", async ({
  page,
}) => {
  await page.goto("/");
  let externalRequests = 0;
  await page.route("https://example.com/**", (route) => {
    externalRequests += 1;
    return route.abort();
  });
  await page.getByRole("textbox", { name: "画像のペースト入力欄" }).focus();
  const isPrevented = await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/html", '<img src="https://example.com/note.jpg">');
    data.setData("text/plain", "https://example.com/note.jpg");
    const event = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: data,
    });
    document.querySelector('[contenteditable="true"]')!.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(isPrevented).toBe(true);
  await expect(page.getByRole("textbox", { name: "画像のペースト入力欄" })).toHaveText("");
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "クリップボード内に画像がありません" })
  ).toHaveCount(1);
  expect(externalRequests).toBe(0);
  const recovery = page
    .getByRole("status")
    .filter({ hasText: "クリップボード内に画像がありません" });
  await expect(recovery).toBeVisible();
  await pasteRedJpegToPhotoAnalysis(page);
  await expect(
    getPanel(page, "選択画像").getByRole("img", { name: "分析対象画像: clipboard-image.jpg" })
  ).toBeVisible();
  await expect(recovery).toHaveCount(0);
});

test("single paste control uses native paste without clipboard.read", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        read: () => {
          document.documentElement.dataset.clipboardReadCalled = "true";
          throw new Error("Direct clipboard reading must not be used");
        },
      },
    });
  });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "画像のペースト入力欄" });
  await expect(input).toHaveAttribute("data-placeholder", "貼り付け");
  await expect(
    page.getByText("長押ししてペースト。PC は Ctrl+V / ⌘V。", { exact: true })
  ).toHaveCount(0);
  await input.click();
  await expect(input).toBeFocused();
  await expect(
    page.getByText("長押ししてペースト。PC は Ctrl+V / ⌘V。", { exact: true })
  ).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-clipboard-read-called", "true");
  await expect(page.getByRole("button", { name: "画像を貼り付け", exact: true })).toHaveCount(0);
  await pasteRedJpegToPhotoAnalysis(page);
  await expect(
    getPanel(page, "選択画像").getByRole("img", { name: "分析対象画像: clipboard-image.jpg" })
  ).toBeVisible();
});

test("paste input fits supported viewport widths", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "画像のペースト入力欄" });
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 812 });
    await expect(input).toBeVisible();
    const bounds = await input.boundingBox();
    const choose = await page
      .locator("label")
      .filter({ has: page.locator("input[type=file]") })
      .boundingBox();
    expect(choose).not.toBeNull();
    expect(Math.abs(choose!.y - bounds!.y)).toBeLessThan(1);
    expect(Math.abs(choose!.width - bounds!.width)).toBeLessThan(1);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width
    );
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await input.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/mobile-image-paste.png" });
});
