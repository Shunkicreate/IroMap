import { expect, test, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";
import { getPanel } from "./helpers";

type SamplingTestWindow = typeof window & {
  pendingSamplingAnalysisCount: () => number;
  releaseSamplingAnalysis: () => void;
};

const storageKey = "iromap.workbench.preview.sampling-density-percent";

const getAnalysisCount = (page: Page): Promise<number> =>
  page.evaluate(
    () =>
      window.__IROMAP_PERF__?.entries.filter(
        (entry) => entry.name === "workbench.photo-analysis.total"
      ).length ?? 0
  );

const getStoredDensity = (page: Page): Promise<string | null> =>
  page.evaluate((key) => localStorage.getItem(key), storageKey);

const prepareSamplingSlider = async (page: Page): Promise<Locator> => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, "40");
    }
  }, storageKey);
  await page.goto("/");
  const buffer = await sharp({
    create: { width: 256, height: 256, channels: 3, background: "#ff0000" },
  })
    .png()
    .toBuffer();
  await page.getByLabel("画像をアップロード").setInputFiles({
    name: "sampling.png",
    mimeType: "image/png",
    buffer,
  });
  await expect.poll(() => getAnalysisCount(page)).toBe(1);
  const preview = getPanel(page, "選択画像");
  await preview.getByRole("button", { name: "表示オプション", exact: true }).click();
  await preview.getByLabel("サンプリンググリッドを表示").check();
  const slider = preview.getByRole("slider", { name: /サンプリング密度:/ });
  await expect(slider).toHaveValue("40");
  return slider;
};

const expectUncommitted = async (page: Page, slider: Locator, value: string): Promise<void> => {
  await expect(slider).toHaveValue(value);
  await expect(slider).toHaveAccessibleName(`サンプリング密度: ${value}% (16,384 samples)`);
  await expect(getPanel(page, "選択画像").locator("pattern")).toHaveAttribute("width", "2");
  // Allow an incorrectly triggered asynchronous analysis to finish before checking its count.
  await page.waitForTimeout(200);
  expect(await getAnalysisCount(page)).toBe(1);
  expect(await getStoredDensity(page)).toBe("40");
};

const holdSamplingAnalysis = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const originalPostMessage = Worker.prototype.postMessage;
    const pending: Array<() => void> = [];
    Worker.prototype.postMessage = function (
      message: unknown,
      options?: StructuredSerializeOptions | Transferable[]
    ): void {
      const send = () => Reflect.apply(originalPostMessage, this, [message, options]);
      if (
        message &&
        typeof message === "object" &&
        "kind" in message &&
        message.kind === "analyze-photo"
      ) {
        pending.push(send);
      } else {
        send();
      }
    };
    const testWindow = window as SamplingTestWindow;
    testWindow.pendingSamplingAnalysisCount = () => pending.length;
    testWindow.releaseSamplingAnalysis = () => {
      Worker.prototype.postMessage = originalPostMessage;
      for (const send of pending.splice(0)) {
        send();
      }
    };
  });
};

const waitForHeldAnalysis = async (page: Page): Promise<void> => {
  await expect
    .poll(() => page.evaluate(() => (window as SamplingTestWindow).pendingSamplingAnalysisCount()))
    .toBe(1);
};

test("密度を確定した後の再解析中もサンプル数とグリッドとプレビューを保持する", async ({ page }) => {
  const slider = await prepareSamplingSlider(page);
  const preview = getPanel(page, "選択画像");
  const previewUrl = await preview.locator("img").getAttribute("src");
  await holdSamplingAnalysis(page);
  await slider.press("End");
  await waitForHeldAnalysis(page);

  await expect(slider).toHaveAccessibleName("サンプリング密度: 100% (16,384 samples)");
  await expect(preview.locator("pattern")).toHaveAttribute("width", "2");
  await expect(preview.locator("img")).toHaveAttribute("src", previewUrl!);
  expect(await getAnalysisCount(page)).toBe(1);

  await page.evaluate(() => (window as SamplingTestWindow).releaseSamplingAnalysis());
  await expect.poll(() => getAnalysisCount(page), { timeout: 15_000 }).toBe(2);
  await expect(slider).toHaveAccessibleName("サンプリング密度: 100% (65,536 samples)");
  await expect(preview.locator("pattern")).toHaveAttribute("width", "1");
  await expect(preview.locator("img")).toHaveAttribute("src", previewUrl!);
});

test("別画像の解析中は前の画像のサンプル数とグリッドを表示しない", async ({ page }) => {
  const slider = await prepareSamplingSlider(page);
  const preview = getPanel(page, "選択画像");
  const previousPreviewUrl = await preview.locator("img").getAttribute("src");
  await holdSamplingAnalysis(page);
  const buffer = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "#0000ff" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("画像をアップロード")
    .setInputFiles({ name: "replacement.png", mimeType: "image/png", buffer });
  await waitForHeldAnalysis(page);

  await expect(slider).toHaveAccessibleName("サンプリング密度: 40% (0 samples)");
  await expect(preview.locator("pattern")).toHaveCount(0);
  await expect(preview.locator("img")).not.toHaveAttribute("src", previousPreviewUrl!);
  await page.evaluate(() => (window as SamplingTestWindow).releaseSamplingAnalysis());
  await expect.poll(() => getAnalysisCount(page), { timeout: 15_000 }).toBe(2);
  await expect(slider).toHaveAccessibleName("サンプリング密度: 40% (4 samples)");
});

test("密度はドラッグ中に解析せず、スライダー外で離しても最終値で一度だけ解析する", async ({
  page,
}) => {
  const slider = await prepareSamplingSlider(page);
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + 8 + (box.width - 16) * (39 / 99), box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 8 });
  await expectUncommitted(page, slider, "100");
  await page.mouse.move(box.x + box.width + 20, box.y + box.height + 20);
  await page.mouse.up();

  await expect.poll(() => getAnalysisCount(page), { timeout: 15_000 }).toBe(2);
  await expect(slider).toHaveAccessibleName("サンプリング密度: 100% (65,536 samples)");
  await expect(getPanel(page, "選択画像").locator("pattern")).toHaveAttribute("width", "1");
  expect(await getStoredDensity(page)).toBe("100");
  await slider.blur();
  expect(await getAnalysisCount(page)).toBe(2);
});

for (const { key, value } of [
  { key: "ArrowRight", value: "43" },
  { key: "Home", value: "1" },
  { key: "End", value: "100" },
  { key: "PageDown", value: "10" },
]) {
  test(`密度は ${key} のキーリピート中に解析せず、キーを離して確定する`, async ({ page }) => {
    const slider = await prepareSamplingSlider(page);
    await slider.focus();
    await page.keyboard.down(key);
    await page.keyboard.down(key);
    await page.keyboard.down(key);
    await expectUncommitted(page, slider, value);
    await page.keyboard.up(key);
    await expect.poll(() => getAnalysisCount(page), { timeout: 15_000 }).toBe(2);
    expect(await getStoredDensity(page)).toBe(value);
    await slider.blur();
    expect(await getAnalysisCount(page)).toBe(2);
  });
}

test("キー操作中にフォーカスを失っても密度を一度だけ確定する", async ({ page }) => {
  const slider = await prepareSamplingSlider(page);
  await slider.focus();
  await page.keyboard.down("End");
  await expectUncommitted(page, slider, "100");
  await slider.blur();
  await page.keyboard.up("End");
  await expect.poll(() => getAnalysisCount(page), { timeout: 15_000 }).toBe(2);
  expect(await getStoredDensity(page)).toBe("100");
});

test("ポインター操作のキャンセルでは密度と解析結果を維持する", async ({ page }) => {
  const slider = await prepareSamplingSlider(page);
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await expectUncommitted(page, slider, "100");
  await slider.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse" });
  await expect(slider).toHaveValue("40");
  await page.mouse.up();
  await slider.blur();
  await expectUncommitted(page, slider, "40");
});

test("密度が同じままの操作では再解析しない", async ({ page }) => {
  const slider = await prepareSamplingSlider(page);
  await slider.focus();
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowRight");
  await slider.blur();
  await expectUncommitted(page, slider, "40");
});

test.describe("タッチでの密度操作", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("指を離すまで解析せず、確定値をリロード後も復元する", async ({ page }) => {
    const slider = await prepareSamplingSlider(page);
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + box.width - 2, y: box.y + box.height / 2 }],
    });
    await expectUncommitted(page, slider, "100");
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => getAnalysisCount(page), { timeout: 15_000 }).toBe(2);
    expect(await getStoredDensity(page)).toBe("100");
    await session.detach();

    await page.reload();
    await expect(
      getPanel(page, "選択画像").getByRole("slider", { name: /サンプリング密度:/ })
    ).toHaveValue("100");
  });
});
