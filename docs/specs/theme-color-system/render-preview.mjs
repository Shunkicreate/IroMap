import { readFileSync, writeFileSync } from "node:fs";
import { withTypographyPreview } from "./typography-preview.mjs";

const root = new URL("./", import.meta.url);
const palette = JSON.parse(
  readFileSync(new URL("tokens.json", root), "utf8").replace(/^\uFEFF/, ""),
);
const modes = Object.entries(palette.modes);
const keys = Object.keys(palette.modes.light.tokens).sort();
const expectedRoles = {
  base: "surface.canvas",
  main: "action.primary",
  accent: "attention.accent",
};
if (modes.length !== 2 || !palette.modes.light || !palette.modes.dark)
  throw new Error("Exactly light and dark are required");
for (const [mode, definition] of modes) {
  if (
    JSON.stringify(Object.keys(definition.tokens).sort()) !==
    JSON.stringify(keys)
  )
    throw new Error(mode + ": token keys differ");
  for (const [key, value] of Object.entries(definition.tokens)) {
    if (!/^#[0-9A-F]{6}$/.test(value))
      throw new Error(mode + ": invalid sRGB value " + key);
  }
  for (const [role, key] of Object.entries(expectedRoles)) {
    if (definition.roles[role] !== key || !definition.tokens[key])
      throw new Error(mode + ": invalid role " + role);
  }
  const neutral = definition.tokens["observation.surface"];
  if (
    neutral.slice(1, 3) !== neutral.slice(3, 5) ||
    neutral.slice(3, 5) !== neutral.slice(5, 7)
  )
    throw new Error("Observation surface must be neutral");
}
for (const hex of [
  ...palette.dataSamples,
  ...Object.values(palette.selectionMarker),
]) {
  if (!/^#[0-9A-F]{6}$/.test(hex))
    throw new Error("Invalid data or marker color");
}
function luminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const pairs = [];
function pair(foreground, background, minimum, purpose) {
  pairs.push({ foreground, background, minimum, purpose });
}
const surfaces = [
  "surface.canvas",
  "surface.panel",
  "surface.raised",
  "surface.hover",
  "selection.surface",
  "attention.surface",
];
for (const background of surfaces) {
  pair("text.primary", background, 4.5, "通常文字");
  pair("text.secondary", background, 4.5, "補足文字");
  pair("focus.ring", background, 3, "フォーカス（面色の隙間あり）");
}
for (const background of surfaces.slice(0, 4)) {
  pair("border.control", background, 3, "操作境界");
  pair("selection.border", background, 3, "選択境界");
}
for (const [fill, text] of [
  ["action.primary", "action.onPrimary"],
  ["attention.accent", "attention.onAccent"],
]) {
  for (const suffix of ["", ".hover", ".pressed"]) {
    pair(text, fill + suffix, 4.5, "塗り操作の文字");
    for (const background of surfaces.slice(0, 4))
      pair(
        fill === "action.primary" ? "action.border" : "attention.border",
        background,
        3,
        "操作の識別境界",
      );
  }
}
pair("selection.text", "selection.surface", 4.5, "選択項目の文字");
pair("selection.border", "selection.surface", 3, "選択項目の境界");
pair("attention.text", "attention.surface", 4.5, "添え色の注記");
pair("disabled.text", "disabled.surface", 4.5, "利用不可の文字（独自目標）");
for (const state of ["success", "warning", "error", "info"]) {
  pair(
    "feedback." + state,
    "feedback." + state + ".surface",
    4.5,
    "通知文字・図形",
  );
}
pair("observation.text", "observation.surface", 4.5, "図のラベル");
pair("observation.secondary", "observation.surface", 4.5, "図の補足");
pair("observation.guide", "observation.surface", 3, "図のガイド");
pair("observation.selection", "observation.surface", 3, "観察面の選択枠");

const results = modes.flatMap(([mode, definition]) => {
  const actualPairs = [...pairs];
  for (const [fill, border] of [
    ["action.primary", "action.border"],
    ["attention.accent", "attention.border"],
  ]) {
    for (const suffix of ["", ".hover", ".pressed"]) {
      if (
        surfaces
          .slice(0, 4)
          .some(
            (bg) =>
              contrast(
                definition.tokens[fill + suffix],
                definition.tokens[bg],
              ) < 3,
          )
      ) {
        actualPairs.push({
          foreground: border,
          background: fill + suffix,
          minimum: 3,
          purpose: "淡い塗りと操作境界",
        });
      }
    }
  }
  return actualPairs.map((item) => {
    const ratio = contrast(
      definition.tokens[item.foreground],
      definition.tokens[item.background],
    );
    return { mode, ...item, ratio, pass: ratio >= item.minimum };
  });
});
const failed = results.filter((item) => !item.pass);
if (failed.length) {
  for (const item of failed)
    console.error(
      item.mode,
      item.foreground,
      item.background,
      item.ratio.toFixed(3),
      "<",
      item.minimum,
    );
  process.exit(1);
}
const report = [
  "# Contrast Report: テーマの色ルール",
  "",
  "- tokens.jsonから生成。判定には丸め前のsRGB相対輝度比を使用する。",
  "- " + results.length + "組を検査し、すべて指定下限を満たした。",
  "- 配色の数値検査。実画面のアクセシビリティ、任意画像上の二重輪郭、視覚承認は別に確認する。",
  "- 装飾線border.subtleは識別境界に使わないため、この必須検査に含めない。",
  "",
  "| モード | 前景 | 背景 | 比率 | 下限 | 目的 |",
  "| --- | --- | --- | --- | --- | --- |",
  ...results.map(
    (item) =>
      "| " +
      [
        item.mode,
        item.foreground,
        item.background,
        item.ratio.toFixed(2) + ":1",
        item.minimum + ":1",
        item.purpose,
      ].join(" | ") +
      " |",
  ),
  "",
].join("\n");
writeFileSync(new URL("contrast-report.md", root), report);
writeFileSync(
  new URL("palette.md", root),
  [
    "# Palette: 桜と夕紺",
    "",
    "- tokens.jsonから生成。意味・目的・背景・使用制約はdesign.mdを参照する。",
    "- すべて不透明なsRGB値。配色の基礎ルールは承認済み、アプリへの適用は別に行う。",
    "",
    "| 意味トークン | ライト：桜 | ダーク：夕紺 |",
    "| --- | --- | --- |",
    ...keys.map(
      (key) =>
        "| " +
        [
          key,
          palette.modes.light.tokens[key],
          palette.modes.dark.tokens[key],
        ].join(" | ") +
        " |",
    ),
    "",
  ].join("\n"),
);

const variable = (key) => "--" + key.replaceAll(".", "-");
const cssThemes = modes
  .map(
    ([mode, definition]) =>
      "[data-mode='" +
      mode +
      "']{" +
      Object.entries(definition.tokens)
        .map(([key, value]) => variable(key) + ":" + value)
        .join(";") +
      "}",
  )
  .join("\n");
const button = (name, label, modifier = "") =>
  '<span class="sample ' + name + " " + modifier + '">' + label + "</span>";
const roleNames = { base: "ベース", main: "メイン", accent: "添え色" };
const feedbackNames = {
  success: "成功",
  warning: "警告",
  error: "エラー",
  info: "情報",
};
function sheet(mode, definition) {
  const token = definition.tokens;
  return (
    '<article class="sheet" data-mode="' +
    mode +
    '"><header><p class="eyebrow">' +
    mode.toUpperCase() +
    "</p><h2>" +
    definition.name +
    (mode === "light" ? "と抹茶" : "と金星") +
    '</h2><p>色の役割と部品の見え方を確認する案</p></header><section class="roles">' +
    Object.entries(definition.roles)
      .map(
        ([role, key]) =>
          '<div class="role-' +
          role +
          '"><div class="swatch" style="background:' +
          token[key] +
          '"></div><h3>' +
          roleNames[role] +
          "</h3><code>" +
          token[key] +
          "</code></div>",
      )
      .join("") +
    (mode === "light"
      ? '<p class="reference">参考 <span style="background:#FDD9D9"></span><code>#FDD9D9</code> → 主操作 <span style="background:' +
        token["action.primary"] +
        '"></span><code>' +
        token["action.primary"] +
        "</code></p>"
      : '<p class="reference">青い夕暮れに、金星の柔らかな光を少量添える</p>') +
    '</section><section class="panel"><h3>操作と選択</h3><p class="secondary">文字・輪郭・塗りの強さを見比べる</p><div class="samples">' +
    button("primary", "主操作") +
    button("primary", "ホバー", "hover") +
    button("primary", "押下", "pressed") +
    button("primary", "フォーカス", "focus") +
    '</div><div class="samples">' +
    button("secondary-button", "補助操作") +
    button("selected", "✓ 選択中") +
    button("disabled", "利用不可") +
    button(
      "accent-note",
      mode === "light" ? "抹茶 · 補助の注記" : "金星 · 小さな印",
    ) +
    '</div><label class="field">値の入力 <input type="text" value="0.50" aria-label="' +
    definition.name +
    'の入力色の見本"></label><div class="slider" role="img" aria-label="アクティブ部分とつまみの色見本"><div></div><span></span></div></section>' +
    '<section class="panel"><h3>色の観察面</h3><p class="secondary">両モードで同じRGBのサンプル。3D・断面の完成画面ではありません。</p><div class="observation"><p>選択色 <code>#D7868C</code></p><div class="data">' +
    palette.dataSamples
      .map(
        (hex, i) =>
          '<span style="background:' +
          hex +
          '">' +
          (i === 3 ? '<i class="marker"></i>' : "") +
          "</span>",
      )
      .join("") +
    '</div><p class="observation-note">無彩色の面・二重輪郭・値のラベル</p><div class="guide"></div></div></section><section class="panel"><h3>通知と強調</h3><div class="feedbacks">' +
    Object.entries(feedbackNames)
      .map(
        ([key, label]) =>
          '<div style="color:var(--feedback-' +
          key +
          ");background:var(--feedback-" +
          key +
          '-surface)">' +
          label +
          " · 名称でも識別する</div>",
      )
      .join("") +
    "</div></section><footer>通常文字・操作境界の指定色対を検査済み。画面配置・文言・部品寸法は確認用の仮置き。</footer></article>"
  );
}
const css = [
  '.roles{grid-template-columns:1fr 1fr .65fr!important}.role-accent{align-self:end}.role-accent .swatch{height:24px}.reference{grid-column:1/-1;min-height:24px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--text-secondary)}.reference span{display:inline-block;width:36px;height:24px;border:1px solid var(--border-control);border-radius:3px}.accent-note{background:var(--attention-surface);color:var(--attention-text);font-weight:400;padding:4px 10px;min-height:32px}.accent-note:before{content:"";width:5px;height:5px;border-radius:50%;background:var(--attention-text);margin-right:7px}',
  '*{box-sizing:border-box}body{margin:0;background:#ECECEC;color:#282828;font-family:system-ui,"Yu Gothic",sans-serif;font-size:15px;line-height:1.6}',
  ".intro{max-width:1400px;margin:auto;padding:36px 32px 22px}.intro h1{font-size:24px;margin:0 0 8px}.intro p{margin:0}",
  ".compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;padding:0 32px 32px;max-width:1400px;margin:auto}",
  ".sheet{background:var(--surface-canvas);color:var(--text-primary);padding:28px;border-radius:12px;min-width:0}",
  "header{padding-bottom:22px;border-bottom:1px solid var(--border-subtle)}h2{font-size:30px;letter-spacing:.04em;margin:2px 0 8px}h3{font-size:16px;margin:0 0 10px}",
  "p{margin:0 0 12px}.eyebrow{font-size:12px;letter-spacing:.15em;color:var(--text-secondary);margin:0}header p:last-child,.secondary{color:var(--text-secondary)}",
  ".roles{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:24px 0}.swatch{height:72px;border:1px solid var(--border-control);border-radius:6px;margin-bottom:10px}.roles h3{margin:0;font-size:14px}code{font-size:13px;font-family:ui-monospace,monospace}",
  ".panel{background:var(--surface-panel);padding:20px;margin-top:16px;border:1px solid var(--border-subtle);border-radius:8px}",
  ".samples{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}.sample{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 14px;border:1px solid transparent;border-radius:6px;font-weight:600;font-size:14px}",
  ".primary{background:var(--action-primary);color:var(--action-onPrimary);border-color:var(--action-border)}.primary.hover{background:var(--action-primary-hover)}.primary.pressed{background:var(--action-primary-pressed)}",
  ".primary.focus{outline:2px solid var(--focus-ring);outline-offset:2px}.secondary-button{border-color:var(--border-control)}",
  ".selected{background:var(--selection-surface);color:var(--selection-text);border:2px solid var(--selection-border)}",
  ".disabled{background:var(--disabled-surface);color:var(--disabled-text)}.accent{background:var(--attention-accent);color:var(--attention-onAccent)}",
  ".field{display:flex;gap:16px;align-items:center}.field input{background:var(--surface-panel);color:var(--text-primary);border:1px solid var(--border-control);border-radius:4px;padding:10px;max-width:110px;font:inherit}",
  ".field input:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}.slider{height:8px;background:var(--border-control);border-radius:4px;position:relative;margin:26px 6px 8px}.slider div{width:50%;height:100%;background:var(--selection-border);border-radius:4px}.slider span{position:absolute;left:50%;top:-7px;width:22px;height:22px;border-radius:50%;background:var(--action-primary);border:3px solid var(--surface-panel);outline:1px solid var(--action-border)}",
  ".observation{padding:18px;background:var(--observation-surface);color:var(--observation-text);border-radius:4px}.data{display:grid;grid-template-columns:repeat(6,1fr);height:68px}.data span{position:relative}.marker{position:absolute;top:50%;left:50%;width:18px;height:18px;transform:translate(-50%,-50%);border:3px solid " +
    palette.selectionMarker.inner +
    ";outline:2px solid " +
    palette.selectionMarker.outer +
    ";border-radius:50%}",
  ".observation-note{color:var(--observation-secondary);font-size:13px;margin:12px 0}.guide{border-bottom:1px solid var(--observation-guide)}",
  ".feedbacks{display:grid;gap:8px}.feedbacks div{padding:10px 12px;border-radius:4px;font-size:14px}",
  "footer{color:var(--text-secondary);font-size:12px;padding-top:20px}",
  "@media(max-width:850px){.compare{grid-template-columns:1fr;padding:0 16px 24px}.intro{padding:24px 16px 16px}.sheet{padding:20px}.roles{gap:10px}}",
].join("\n");
const html =
  '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IroMap · 桜と夕紺の配色案</title><style>' +
  cssThemes +
  css +
  '</style></head><body><div class="intro"><h1>IroMap · 桜と夕紺</h1><p>配色・Noto Sans JP・本文字間0.04emは承認済み。同じデータ色と、文字の見え方を確認します。</p></div><main class="compare">' +
  modes.map(([mode, definition]) => sheet(mode, definition)).join("") +
  "</main></body></html>";
writeFileSync(new URL("preview.html", root), withTypographyPreview(html));
console.log(
  "PASS: " +
    results.length +
    " contrast pairs; palette, report and preview generated.",
);
