import { expect, test, type Page } from "@playwright/test";
import {
  analyticsConsentVersion,
  analyticsConsentStorageKey,
  analyticsConsentLifetimeMs,
} from "../../src/lib/analytics-consent";
import { uploadRedPng } from "../e2e/helpers";

const gaUrl =
  /https:\/\/[^/]*(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//;

async function eventCount(page: Page) {
  return page.evaluate(
    () =>
      ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).filter(
        (item) => item[0] === "event"
      ).length
  );
}

test.beforeEach(async ({ context }) => {
  await context.route(gaUrl, (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" })
  );
});

test("no GA loader, events, journey or cookies before consent or after refusal", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (gaUrl.test(request.url())) requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "同意する", exact: true })).toBeVisible();
  await page.locator('[data-analytics-id="cube-options"]').click();
  await page.mouse.wheel(0, 200);
  expect(await eventCount(page)).toBe(0);
  expect(requests).toHaveLength(0);
  expect(
    await page.evaluate(() => sessionStorage.getItem("iromap.analytics.journey.v1"))
  ).toBeNull();
  await page.getByRole("button", { name: "同意しない", exact: true }).click();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    analyticsConsentStorageKey
  );
  expect(saved.policyVersion).toBe(analyticsConsentVersion);
  expect(saved.decision).toBe("denied");
  expect(saved.expiresAt - saved.decidedAt).toBe(analyticsConsentLifetimeMs);
  await uploadRedPng(page);
  await expect(page.locator('img[src^="blob:"]')).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "同意する", exact: true })).toHaveCount(0);
  expect(await eventCount(page)).toBe(0);
  expect(requests).toHaveLength(0);
  expect(await page.context().cookies()).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ name: "_ga" })])
  );
});

test("accept saves the exact current version, initializes once and survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  await expect.poll(() => eventCount(page)).toBe(1);
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    analyticsConsentStorageKey
  );
  expect(saved.policyVersion).toBe(analyticsConsentVersion);
  expect(saved.decision).toBe("granted");
  await page.reload();
  await expect.poll(() => eventCount(page)).toBe(1);
  await expect(page.getByRole("button", { name: "同意する", exact: true })).toHaveCount(0);
});

for (const state of ["old", "future", "expired", "malformed"]) {
  test(`${state} consent never grants analytics and prompts for current consent`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(
      ({ key, version, lifetime, state }) => {
        const decidedAt = state === "expired" ? Date.now() - lifetime - 1000 : Date.now();
        localStorage.setItem(
          key,
          state === "malformed"
            ? "true"
            : JSON.stringify({
                schemaVersion: 1,
                policyVersion: state === "old" ? "2" : state === "future" ? "4" : version,
                decision: "granted",
                decidedAt,
                expiresAt: decidedAt + lifetime,
              })
        );
      },
      {
        key: analyticsConsentStorageKey,
        version: analyticsConsentVersion,
        lifetime: analyticsConsentLifetimeMs,
        state,
      }
    );
    await page.reload();
    await expect(page.getByRole("button", { name: "同意する", exact: true })).toBeVisible();
    await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
    expect(await eventCount(page)).toBe(0);
  });
}

test("withdrawal immediately disables GA, deletes GA cookies and timeline but preserves UI preferences", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  await expect.poll(() => eventCount(page)).toBe(1);
  await page.evaluate(() => localStorage.setItem("iromap.workbench.cube.space", "rgb"));
  await context.addCookies([
    { name: "_ga", value: "test", url: new URL(page.url()).origin },
    { name: "_ga_TEST", value: "test", url: new URL(page.url()).origin },
  ]);
  await page.getByRole("button", { name: "Cookie設定", exact: true }).click();
  await page.getByRole("button", { name: "同意しない", exact: true }).click();
  expect(await page.evaluate(() => Reflect.get(window, "ga-disable-G-ANALYTICSTEST"))).toBe(true);
  await page.locator('[data-analytics-id="theme-toggle"]').click();
  expect(await eventCount(page)).toBe(0);
  expect(
    await page.evaluate(() => sessionStorage.getItem("iromap.analytics.journey.v1"))
  ).toBeNull();
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("_ga"))).toHaveLength(
    0
  );
  expect(await page.evaluate(() => localStorage.getItem("iromap.workbench.cube.space"))).toBe(
    "rgb"
  );
  await page.getByRole("button", { name: "Cookie設定", exact: true }).click();
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  await expect.poll(() => eventCount(page)).toBe(1);
  expect(await page.evaluate(() => Reflect.get(window, "ga-disable-G-ANALYTICSTEST"))).toBe(false);
});

test("revocation in another tab stops analytics in both tabs", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  const other = await context.newPage();
  await other.goto("/");
  await expect.poll(() => eventCount(other)).toBe(1);
  await page.getByRole("button", { name: "Cookie設定", exact: true }).click();
  await page.getByRole("button", { name: "同意しない", exact: true }).click();
  await expect
    .poll(() => other.evaluate(() => Reflect.get(window, "ga-disable-G-ANALYTICSTEST")))
    .toBe(true);
  await other.locator('[data-analytics-id="theme-toggle"]').click();
  expect(await eventCount(other)).toBe(0);
});

test("unavailable storage never enables analytics even after an accept click", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  await expect(page.locator('#analytics-consent [role="alert"]')).toContainText(
    "アクセス解析は無効"
  );
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  expect(await eventCount(page)).toBe(0);
});

test("scroll milestones are sent only after current consent", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  await expect.poll(() => eventCount(page)).toBe(1);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(async () =>
      page.evaluate(() =>
        ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).some(
          (item) =>
            item[0] === "event" &&
            (item[2] as Record<string, string>).control_id === "page-scroll-90"
        )
      )
    )
    .toBe(true);
});

test("consent choices remain usable at supported screen widths without moving the page", async ({
  page,
}, testInfo) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const banner = page.locator("#analytics-consent");
    await expect(banner).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    const reject = banner.getByRole("button", { name: "同意しない", exact: true });
    await reject.scrollIntoViewIfNeeded();
    await expect(reject).toBeVisible();
    if (width === 375 || width === 1440)
      await page.screenshot({ path: testInfo.outputPath(`consent-${width}.png`) });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "同意する", exact: true }).click();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("the consent banner and privacy page link to the public implementation", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator('#analytics-consent a[href="https://github.com/Shunkicreate/IroMap"]')
  ).toHaveText("公開リポジトリ（GitHub）");
  await expect(page.locator("#analytics-consent")).toContainText(
    "ご本人を直接特定する個人情報は取得しません"
  );
  await page.getByRole("button", { name: "同意しない", exact: true }).click();
  await page.goto("/privacy");
  await expect(page.locator('main a[href="https://github.com/Shunkicreate/IroMap"]')).toBeVisible();
  await expect(page.getByRole("main")).toContainText("365日間（1年）");
  await expect(page.getByRole("heading", { name: "計測内容の変更と再同意" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText(
    "こうした変更のたびに再同意をお願いすることはありません"
  );
  await expect(page.getByRole("main")).toContainText(
    "変更後の取扱いを始める前に改めて同意を確認します"
  );
});
