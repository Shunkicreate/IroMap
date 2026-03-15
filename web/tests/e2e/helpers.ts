import { expect, type Locator, type Page } from "@playwright/test";

const redPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z/C/HwAF/gL+4W2KIwAAAABJRU5ErkJggg==";
const grayPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNkYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==";

export const getPanel = (page: Page, heading: string): Locator => {
  return page.locator("section.panel", {
    has: page.getByRole("heading", { name: heading }),
  });
};

export const getSliceCanvas = (page: Page): Locator => {
  return page.locator(".sliceCanvas:not(.sliceCanvasOverlay)");
};

export const getCubeCanvas = (page: Page): Locator => {
  return page.locator(".cubeCanvas");
};

export const selectColorFromSlice = async (page: Page): Promise<void> => {
  const canvas = getSliceCanvas(page);
  await expect(canvas).toBeVisible();
  await canvas.click({ position: { x: 24, y: 24 } });
};

export const hoverColorOnSlice = async (page: Page): Promise<void> => {
  const canvas = getSliceCanvas(page);
  await expect(canvas).toBeVisible();
  await canvas.hover({ position: { x: 40, y: 40 } });
};

export const applyManualColor = async (
  page: Page,
  color: { r: number; g: number; b: number }
): Promise<void> => {
  const picker = page.locator(".manualColorPicker");
  await picker.getByRole("spinbutton", { name: "R" }).fill(String(color.r));
  await picker.getByRole("spinbutton", { name: "G" }).fill(String(color.g));
  await picker.getByRole("spinbutton", { name: "B" }).fill(String(color.b));
  await picker.getByRole("button", { name: "選択色に反映" }).click();
};

const setFile = async (page: Page, fileName: string, base64: string): Promise<void> => {
  await page.getByLabel("画像をアップロード").setInputFiles({
    name: fileName,
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
};

export const uploadRedPng = async (page: Page): Promise<void> => {
  await setFile(page, "red.png", redPngBase64);
};

export const uploadGrayPng = async (page: Page): Promise<void> => {
  await setFile(page, "gray.png", grayPngBase64);
};

export const pasteRedPngToPhotoAnalysis = async (page: Page): Promise<void> => {
  await pasteImageToPhotoAnalysis(page, {
    fileName: "clipboard-image.png",
    mimeType: "image/png",
    base64: redPngBase64,
  });
};

export const pasteRedJpegToPhotoAnalysis = async (page: Page): Promise<void> => {
  const pasteZone = page.getByRole("button", { name: "画像貼り付けエリア" });
  await expect(pasteZone).toBeVisible();
  await pasteZone.focus();

  await page.evaluate(
    async ({ targetLabel }: { targetLabel: string }) => {
      const target = Array.from(document.querySelectorAll<HTMLElement>("[aria-label]")).find(
        (element) => element.getAttribute("aria-label") === targetLabel
      );
      if (!target) {
        throw new Error("paste target not found");
      }

      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("2d context unavailable");
      }

      context.fillStyle = "#ff0000";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
            return;
          }
          reject(new Error("jpeg blob generation failed"));
        }, "image/jpeg");
      });

      const file = new File([blob], "clipboard-image.jpg", { type: "image/jpeg" });
      const clipboardData = new DataTransfer();
      clipboardData.items.add(file);
      const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, "clipboardData", {
        value: clipboardData,
      });

      target.dispatchEvent(pasteEvent);
    },
    { targetLabel: "画像貼り付けエリア" }
  );
};

const pasteImageToPhotoAnalysis = async (
  page: Page,
  payload: { fileName: string; mimeType: string; base64: string }
): Promise<void> => {
  const pasteZone = page.getByRole("button", { name: "画像貼り付けエリア" });
  await expect(pasteZone).toBeVisible();
  await pasteZone.focus();

  await page.evaluate(
    async ({
      targetLabel,
      fileName,
      mimeType,
      base64,
    }: {
      targetLabel: string;
      fileName: string;
      mimeType: string;
      base64: string;
    }) => {
      const target = Array.from(document.querySelectorAll<HTMLElement>("[aria-label]")).find(
        (element) => element.getAttribute("aria-label") === targetLabel
      );
      if (!target) {
        throw new Error("paste target not found");
      }

      const response = await fetch(`data:${mimeType};base64,${base64}`);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: mimeType });
      const clipboardData = new DataTransfer();
      clipboardData.items.add(file);
      const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, "clipboardData", {
        value: clipboardData,
      });

      target.dispatchEvent(pasteEvent);
    },
    { targetLabel: "画像貼り付けエリア", ...payload }
  );
};
