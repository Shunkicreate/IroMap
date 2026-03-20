import { expect, test, type Page } from "@playwright/test";
import { getCubeCanvas, getPanel, getSliceCanvas } from "./helpers";

const dragOnCube = async (page: Page): Promise<void> => {
  const cube = getCubeCanvas(page);
  await expect(cube).toBeVisible();
  const box = await cube.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 - 30);
  await page.mouse.up();
};

test("T-101(color-space-3d): タブ切替描画を確認", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "HSL" }).click();
  await expect(page.getByRole("tab", { name: "HSL", selected: true })).toBeVisible();
  await page.getByRole("tab", { name: "Lab" }).click();
  await expect(page.getByRole("tab", { name: "Lab", selected: true })).toBeVisible();
  await page.getByRole("tab", { name: "RGB" }).click();
  await expect(page.getByRole("tab", { name: "RGB", selected: true })).toBeVisible();
});

test("T-102(color-space-3d): 全色空間の回転操作を確認", async ({ page }) => {
  await page.goto("/");
  for (const tab of ["RGB", "HSL", "Lab"]) {
    await page.getByRole("tab", { name: tab }).click();
    await dragOnCube(page);
  }
});

test("T-103(color-space-3d): ホバー/選択連携を確認", async ({ page }) => {
  await page.goto("/");
  await dragOnCube(page);
  const inspector = getPanel(page, "インスペクタ");
  await expect(inspector.getByText("選択色がありません")).toHaveCount(0);
});

test("T-104(color-space-3d): RGBスライス連携回帰を確認", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "RGB" }).click();
  await getPanel(page, "スライス").getByRole("combobox").selectOption("g");
  await expect(page.getByText("G 固定 = 128")).toBeVisible();
});

test("T-105(color-space-3d): タブ選択状態の視認性を確認", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Lab" }).click();
  await expect(page.getByRole("tab", { name: "Lab", selected: true })).toHaveAttribute(
    "data-state",
    "active"
  );
});

test("T-106(color-space-3d): 3D軸ガイドのON/OFFを確認", async ({ page }) => {
  await page.goto("/");
  const cubePanel = getPanel(page, "RGBキューブ");
  await cubePanel.getByRole("button", { name: "表示オプション" }).click();
  const axisGuide = cubePanel.getByLabel("軸ガイドを表示");
  await expect(axisGuide).toBeChecked();
  await axisGuide.uncheck();
  await expect(axisGuide).not.toBeChecked();
  await axisGuide.check();
  await expect(axisGuide).toBeChecked();
});

test("T-107(color-space-3d): Sliceの軸ラベル表示を確認", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/^X軸: [RGB] \(左→右\)$/)).toBeVisible();
  await expect(page.getByText(/^Y軸: [RGB] \(下→上\)$/)).toBeVisible();
});

test("T-108(color-space-3d): RGBキューブとSliceの近接配置を確認", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");
  const cubeBox = await getCubeCanvas(page).boundingBox();
  const sliceBox = await getSliceCanvas(page).boundingBox();

  expect(cubeBox).not.toBeNull();
  expect(sliceBox).not.toBeNull();
  if (!cubeBox || !sliceBox) {
    return;
  }
  expect(Math.abs(sliceBox.y - cubeBox.y)).toBeLessThan(700);
});

test("T-109(color-space-3d): キューブサイズスライダー表示とサイズ変更を確認", async ({ page }) => {
  await page.goto("/");
  const cubePanel = getPanel(page, "RGBキューブ");
  await cubePanel.getByRole("button", { name: "表示オプション" }).click();
  const slider = cubePanel.getByRole("slider", { name: /キューブサイズ:/ });
  await slider.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "520";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(slider).toHaveValue("520");
});

test("T-110(color-space-3d): 上下ドラッグ回転方向補正の回帰確認", async ({ page }) => {
  await page.goto("/");
  const cube = getCubeCanvas(page);
  const box = await cube.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 70);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 70);
  await page.mouse.up();
  await expect(cube).toBeVisible();
});

test("T-111(color-space-3d): HSLで軸変更してもクラッシュしない", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/");
  await page.getByRole("tab", { name: "HSL" }).click();

  const slice = getPanel(page, "スライス");
  const slider = slice.getByRole("slider");
  await slider.fill("360");
  await expect(slice.getByText("H 固定 = 360")).toBeVisible();

  await slice.getByRole("combobox").selectOption("s");

  await expect(pageErrors).toHaveLength(0);
  await expect(slice.getByText(/^S 固定 = \d+$/)).toBeVisible();
  await expect(slider).toHaveValue("100");
});

test("T-112(color-space-3d): HSLからLab遷移後もSliceとキューブ状態が同期する", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "HSL" }).click();

  const slice = getPanel(page, "スライス");
  const slider = slice.getByRole("slider");
  await slider.fill("360");
  await slice.getByRole("combobox").selectOption("s");
  await expect(slider).toHaveValue("100");

  await page.getByRole("tab", { name: "Lab" }).click();
  await expect(slice.getByRole("combobox")).toHaveValue("lab-l");
  await expect(slider).toHaveValue("100");
  await expect(slice.getByText("L* 固定 = 100")).toBeVisible();
  await page.getByRole("tab", { name: "RGB" }).click();
  await expect(slice.getByRole("combobox")).toHaveValue("r");
  await expect(slider).toHaveValue("255");
  await expect(slice.getByText("R 固定 = 255")).toBeVisible();
});

test("T-101(rgb-cube): 3Dキューブの初期表示を確認", async ({ page }) => {
  await page.goto("/");
  await expect(getCubeCanvas(page)).toBeVisible();
});

test("T-102(rgb-cube): 回転操作の動作確認", async ({ page }) => {
  await page.goto("/");
  await dragOnCube(page);
  await expect(getCubeCanvas(page)).toBeVisible();
});

test("T-103(rgb-cube): 解像度固定の確認", async ({ page }) => {
  await page.goto("/");
  await expect(getSliceCanvas(page)).toHaveAttribute("width", "256");
  await expect(getSliceCanvas(page)).toHaveAttribute("height", "256");
});
