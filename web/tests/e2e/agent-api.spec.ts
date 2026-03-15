import { expect, test } from "@playwright/test";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2ZQ1EAAAAASUVORK5CYII=";

const tinyPngBytes = Buffer.from(tinyPngBase64, "base64");

test("T-301(agent-api): raw image body を解析して JSON を返す", async ({ request }) => {
  const response = await request.post("/api/analyze", {
    data: tinyPngBytes,
    headers: {
      Accept: "application/json",
      "Content-Type": "image/png",
    },
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.input.mimeType).toBe("image/png");
  expect(payload.summary.dominantColors.length).toBeGreaterThan(0);
  expect(payload.explanations.length).toBeGreaterThan(0);
});

test("T-302(agent-api): Accept=text/html で HTML を返す", async ({ request }) => {
  const response = await request.post("/api/analyze", {
    data: tinyPngBytes,
    headers: {
      Accept: "text/html",
      "Content-Type": "image/png",
    },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/html");
  expect(await response.text()).toContain("IroMap image analysis result");
});

test("T-303(agent-api): 非対応 Content-Type で 400 を返す", async ({ request }) => {
  const response = await request.post("/api/analyze", {
    data: "not-an-image",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
  });

  expect(response.status()).toBe(400);
  const payload = await response.json();
  expect(payload.error.code).toBe("UNSUPPORTED_CONTENT_TYPE");
});

test("T-304(agent-api): 壊れた画像で 422 を返す", async ({ request }) => {
  const response = await request.post("/api/analyze", {
    data: Buffer.from("not-a-valid-image"),
    headers: {
      Accept: "application/json",
      "Content-Type": "image/png",
    },
  });

  expect(response.status()).toBe(422);
  const payload = await response.json();
  expect(payload.error.code).toBe("IMAGE_DECODE_FAILED");
});

test("T-305(agent-api): docs と machine-readable endpoints を公開する", async ({
  page,
  request,
}) => {
  await page.goto("/docs/agent-api");
  await expect(page.getByRole("heading", { name: "Agent API" })).toBeVisible();
  await expect(page.getByText("POST /api/analyze")).toBeVisible();

  const openApiResponse = await request.get("/openapi.json");
  expect(openApiResponse.status()).toBe(200);
  const openApi = await openApiResponse.json();
  expect(openApi.paths["/api/analyze"]).toBeTruthy();

  const llmsResponse = await request.get("/llms.txt");
  expect(llmsResponse.status()).toBe(200);
  expect(await llmsResponse.text()).toContain("/api/analyze");
});

test("T-306(agent-api): llms.txt は forwarded host を使って absolute URL を返す", async ({
  request,
}) => {
  const response = await request.get("/llms.txt", {
    headers: {
      "X-Forwarded-Host": "agents.example.test",
      "X-Forwarded-Proto": "https",
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("https://agents.example.test/api/analyze");
  expect(body).toContain("https://agents.example.test/docs/agent-api");
  expect(body).toContain("https://agents.example.test/openapi.json");
  expect(body).not.toContain("localhost:3000");
});
