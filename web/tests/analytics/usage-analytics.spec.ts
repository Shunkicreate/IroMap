import { expect, test, type Page } from "@playwright/test";
import { uploadRedPng, getPanel, pasteRedPngToPhotoAnalysis } from "../e2e/helpers";

type AnalyticsEvent = { name: string; params: Record<string, string | number> };

async function events(page: Page): Promise<AnalyticsEvent[]> {
  return page.evaluate(() => {
    const analyticsWindow = window as Window & { dataLayer?: ArrayLike<unknown>[] };
    return (analyticsWindow.dataLayer ?? [])
      .map((item) => Array.from(item))
      .filter((item) => item[0] === "event")
      .map((item) => ({
        name: item[1] as string,
        params: item[2] as Record<string, string | number>,
      }));
  });
}

test.beforeEach(async ({ page, context }) => {
  // Neither the loader nor collect requests may reach a real GA property.
  await context.route(
    /https:\/\/[^/]*(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//,
    (route) => route.fulfill({ body: "", contentType: "application/javascript" })
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?private=do-not-collect#secret");
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  await expect
    .poll(async () => (await events(page)).filter((event) => event.name === "page_view").length)
    .toBe(1);
});

test("records the upload-analysis-selection-copy funnel and preserves order after reload", async ({
  page,
}) => {
  await uploadRedPng(page);
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) =>
          event.params.control_id === "photo-analysis" && event.params.action === "succeeded"
      )
    )
    .toBe(true);
  const preview = getPanel(page, "選択画像");
  await preview.locator("img").click({ position: { x: 24, y: 24 } });
  await expect
    .poll(async () =>
      (await events(page)).some((event) => event.params.control_id === "preview-point")
    )
    .toBe(true);
  await page.locator('[data-analytics-id="metrics-copy"]').click();
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) => event.params.control_id === "metrics-copy" && event.params.action === "succeeded"
      )
    )
    .toBe(true);
  const timeline = await events(page);
  expect(timeline.map((event) => event.params.event_sequence)).toEqual(
    timeline.map((_, index) => index + 1)
  );
  const analysis = timeline.filter((event) => event.params.control_id === "photo-analysis");
  expect(analysis.map((event) => event.params.action)).toEqual(["started", "succeeded"]);
  expect(analysis[0].params.operation_id).toBe(analysis[1].params.operation_id);
  const copyClick = timeline.find(
    (event) => event.name === "ui_action" && event.params.control_id === "metrics-copy"
  )!;
  expect(copyClick.params.destination).toBe("clipboard");
  expect(JSON.stringify(timeline)).not.toMatch(
    /do-not-collect|#secret|red\.png|blob:|data:image|#FF0000/i
  );
  await page.reload();
  await expect.poll(async () => (await events(page)).length).toBe(1);
  const reloaded = (await events(page))[0];
  expect(reloaded.params.journey_id).toBe(timeline[0].params.journey_id);
  expect(reloaded.params.event_sequence).toBe(timeline.length + 1);
});

test("records mouse and keyboard tabs, disclosures, toggles and committed sliders without hover noise", async ({
  page,
}) => {
  const cube = getPanel(page, "3Dキューブ");
  await cube.getByRole("tab", { name: "HSL", exact: true }).click();
  await cube.getByRole("tab", { name: "HSL", exact: true }).press("ArrowRight");
  await expect(cube.getByRole("tab", { name: "Lab", exact: true })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await cube.locator('[data-analytics-id="cube-options"]').click();
  await cube.locator('[data-analytics-id="cube-guides"]').click();
  const size = cube.locator('[data-analytics-id="cube-size"]');
  await size.focus();
  await size.press("ArrowRight");
  await page.mouse.move(100, 100);
  await page.mouse.move(110, 120);
  const timeline = await events(page);
  expect(timeline.filter((event) => event.params.control_id === "cube-hsl")).toHaveLength(1);
  expect(timeline.filter((event) => event.params.control_id === "cube-lab")).toHaveLength(1);
  expect(timeline.find((event) => event.params.control_id === "cube-options")?.params.action).toBe(
    "open"
  );
  expect(timeline.find((event) => event.params.control_id === "cube-guides")?.params.action).toBe(
    "disable"
  );
  expect(timeline.filter((event) => event.params.control_id === "cube-size")).toHaveLength(1);
  const beforeHover = timeline.length;
  await page.mouse.move(200, 200);
  expect(await events(page)).toHaveLength(beforeHover);
});

test("analysis and copy failures have explicit outcomes and no raw error text", async ({
  page,
}) => {
  await page.getByLabel("画像をアップロード").setInputFiles({
    name: "private-image.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid-image"),
  });
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) => event.params.control_id === "photo-analysis" && event.params.action === "failed"
      )
    )
    .toBe(true);
  await uploadRedPng(page);
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) =>
          event.params.control_id === "photo-analysis" && event.params.action === "succeeded"
      )
    )
    .toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        throw new Error("private clipboard text");
      },
    });
  });
  await page.locator('[data-analytics-id="histogram-copy"]').click();
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) => event.params.control_id === "histogram-copy" && event.params.action === "failed"
      )
    )
    .toBe(true);
  expect(JSON.stringify(await events(page))).not.toMatch(/private-image|private clipboard/);
});

test("paste and inspector copy are attributed to their own controls", async ({ page }) => {
  await pasteRedPngToPhotoAnalysis(page);
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) =>
          event.params.control_id === "photo-analysis" && event.params.action === "succeeded"
      )
    )
    .toBe(true);
  await page.locator('[data-analytics-id="inspector-open"]').click();
  await page.evaluate(() => navigator.clipboard.writeText("#ff4020"));
  await page.locator('[data-analytics-id="color-paste"]').click();
  await page.locator('[data-analytics-id="color-copy-hex"]').click();
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) =>
          event.params.control_id === "color-copy-hex" && event.params.action === "succeeded"
      )
    )
    .toBe(true);
  const timeline = await events(page);
  expect(
    timeline.some(
      (event) => event.name === "feature_use" && event.params.control_id === "photo-paste"
    )
  ).toBe(true);
  expect(
    timeline.some(
      (event) => event.name === "feature_use" && event.params.control_id === "photo-file"
    )
  ).toBe(false);
  expect(timeline.some((event) => event.params.control_id === "cube-pick")).toBe(false);
  expect(JSON.stringify(timeline)).not.toMatch(/clipboard-image|#ff4020/i);
});

test("region selection and cube rotation emit only committed feature events", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp({
    create: { width: 32, height: 32, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("画像をアップロード")
    .setInputFiles({ name: "private-region.png", mimeType: "image/png", buffer });
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) =>
          event.params.control_id === "photo-analysis" && event.params.action === "succeeded"
      )
    )
    .toBe(true);
  const image = getPanel(page, "選択画像").locator("img");
  await image.scrollIntoViewIfNeeded();
  const imageBox = await image.boundingBox();
  expect(imageBox).not.toBeNull();
  // Dispatch pointer events to exercise selection independently of native image dragging.
  await image.dispatchEvent("pointerdown", {
    clientX: imageBox!.x + imageBox!.width * 0.2,
    clientY: imageBox!.y + imageBox!.height * 0.2,
  });
  await image.dispatchEvent("pointermove", {
    clientX: imageBox!.x + imageBox!.width * 0.8,
    clientY: imageBox!.y + imageBox!.height * 0.8,
  });
  await image.dispatchEvent("pointerup", {
    clientX: imageBox!.x + imageBox!.width * 0.8,
    clientY: imageBox!.y + imageBox!.height * 0.8,
  });
  const cube = page.locator(".cubeCanvas");
  await cube.scrollIntoViewIfNeeded();
  const cubeBox = await cube.boundingBox();
  expect(cubeBox).not.toBeNull();
  await page.mouse.move(cubeBox!.x + 60, cubeBox!.y + 60);
  await page.mouse.down();
  await page.mouse.move(cubeBox!.x + 100, cubeBox!.y + 100, { steps: 5 });
  await page.mouse.up();
  const timeline = await events(page);
  expect(timeline.filter((event) => event.params.control_id === "preview-region")).toHaveLength(1);
  expect(timeline.filter((event) => event.params.control_id === "cube-rotate")).toHaveLength(1);
});

test("API form failure keeps the same journey across pages", async ({ page }) => {
  const firstPage = (await events(page))[0];
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 422,
      json: {
        error: { code: "IMAGE_DECODE_FAILED", message: "private message", retryable: false },
      },
    })
  );
  await page.goto("/analyze");
  await page.locator('[data-analytics-id="api-file"]').setInputFiles({
    name: "private-api.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid"),
  });
  await page.locator('[data-analytics-id="api-submit"]').click();
  await expect
    .poll(async () =>
      (await events(page)).some(
        (event) => event.params.control_id === "api-submit" && event.params.action === "failed"
      )
    )
    .toBe(true);
  const timeline = await events(page);
  expect(timeline[0].params.journey_id).toBe(firstPage.params.journey_id);
  expect(timeline[0].params.event_sequence).toBe(2);
  expect(
    timeline
      .filter((event) => event.name === "operation_result")
      .map((event) => event.params.action)
  ).toEqual(["started", "failed"]);
  expect(JSON.stringify(timeline)).not.toMatch(/private-api|private message/);
});
