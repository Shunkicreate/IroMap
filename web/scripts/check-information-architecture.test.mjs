import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  checkDesign,
  checkImplementation,
  sourceKeys,
  readMessages,
} from "./check-information-architecture.mjs";

const folder = "docs/specs/workbench-information-architecture";
const sourcePath = "web/src/example.tsx";
const element = `# Information

## W-01 Example

- 目的: Identify the selected color.
- 背景: Prevent confusion.
- 重要度: P1。
- 開示区分: Always.
- 内容:
  - Selected color.
- 根拠区分: Existing.
- 参照元: \`web/src/example.tsx\`。
- 文言ID: \`selected\`。
`;
const copy = `# Copy

## Visible copy

### selected

- 区分: 画面表示の標準案。
- 対応要素: W-01。
- 参照元: \`web/src/example.tsx\`。
- 標準 ja: 選択色
- 標準 en: Selected color
- 目的: Identify the selected color.
- 背景: Prevent confusion.
`;
const messages = `export const i18nMessages = {
  ja: { selected: "選択色" },
  en: { selected: "Selected color" },
} as const;`;

function fixture(t, changes = {}) {
  const root = mkdtempSync(join(tmpdir(), "iromap-information-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = {
    [`${folder}/information-architecture.md`]: element,
    [`${folder}/ui-copy.md`]: copy,
    [`${folder}/glossary.md`]: "# Glossary\n",
    [`${folder}/information-audit.md`]: "# Audit\n",
    [sourcePath]: 'const label = t("selected");',
    "web/src/i18n/messages.ts": messages,
    ...changes,
  };
  for (const [path, content] of Object.entries(files)) {
    const absolute = join(root, path);
    mkdirSync(join(absolute, ".."), { recursive: true });
    writeFileSync(absolute, content);
  }
  return root;
}

test("valid design and implementation agree", (t) => {
  const root = fixture(t);
  assert.deepEqual(checkDesign(root).diagnostics, []);
  assert.deepEqual(checkImplementation(root), []);
});

test("one-sided and undefined copy references are rejected", (t) => {
  const root = fixture(t, {
    [`${folder}/information-architecture.md`]: element.replace(
      "- 文言ID: \`selected\`。",
      "- 文言ID: \`missing\`。"
    ),
  });
  const codes = checkDesign(root).diagnostics.map((item) => item.code);
  assert.ok(codes.includes("missing-copy"));
  assert.ok(codes.includes("reverse-reference"));
});

test("duplicate IDs and unknown target elements are rejected", (t) => {
  const root = fixture(t, {
    [`${folder}/information-architecture.md`]: element + element,
    [`${folder}/ui-copy.md`]: (copy + copy).replaceAll("W-01", "W-99"),
  });
  const codes = checkDesign(root).diagnostics.map((item) => item.code);
  assert.ok(codes.includes("duplicate-element"));
  assert.ok(codes.includes("duplicate-copy"));
  assert.ok(codes.includes("copy-target"));
});

test("missing purpose, source, importance and invalid format are rejected", (t) => {
  const root = fixture(t, {
    [`${folder}/information-architecture.md`]:
      element.replace("- 目的: Identify the selected color.\n", "").replace("P1。", "P9。") +
      "\nUnstructured paragraph\n",
    [`${folder}/ui-copy.md`]: copy.replace(
      "- 参照元: \`web/src/example.tsx\`。",
      "- 参照元: \`../../outside.tsx\`。"
    ),
  });
  const codes = checkDesign(root).diagnostics.map((item) => item.code);
  for (const code of ["missing-field", "importance", "source-reference", "document-format"]) {
    assert.ok(codes.includes(code), code);
  }
});

test("empty definitions, skipped headings, broken links and dated specs are rejected", (t) => {
  const root = fixture(t, {
    [`${folder}/information-architecture.md`]: "# Empty\n### Skipped\n- [Broken](absent.md)\n",
    [`${folder}/ui-copy.md`]: "# Empty\n",
  });
  mkdirSync(join(root, "docs/specs/2026-10-example"));
  const codes = checkDesign(root).diagnostics.map((item) => item.code);
  for (const code of ["empty-definition", "heading-level", "document-link", "dated-spec"]) {
    assert.ok(codes.includes(code), code);
  }
});

test("placeholder mismatch is rejected", (t) => {
  const root = fixture(t, {
    [`${folder}/ui-copy.md`]: copy.replace("標準 ja: 選択色", "標準 ja: 選択色 {count}"),
  });
  assert.ok(checkDesign(root).diagnostics.some((item) => item.code === "placeholder"));
});

test("design-first copy changes pass design and report implementation drift", (t) => {
  const root = fixture(t, {
    [`${folder}/ui-copy.md`]: copy.replace("標準 ja: 選択色", "標準 ja: 現在の色"),
  });
  assert.deepEqual(checkDesign(root).diagnostics, []);
  assert.deepEqual(
    checkImplementation(root).map((item) => item.code),
    ["copy-drift"]
  );
});

test("comments cannot satisfy source-key checks", (t) => {
  const root = fixture(t, { [sourcePath]: '// t("selected")\nconst label = t("different");' });
  assert.ok(checkImplementation(root).some((item) => item.code === "source-key"));
  assert.deepEqual([...sourceKeys('/* "fake" */ const label = `real`;')], ["real"]);
});

test("missing source and untranslated dictionary keys are reported", (t) => {
  const root = fixture(t, {
    [`${folder}/information-architecture.md`]: element.replace(sourcePath, "web/src/missing.tsx"),
    "web/src/i18n/messages.ts": messages.replace(
      'en: { selected: "Selected color" }',
      'en: { other: "Other" }'
    ),
  });
  const codes = checkImplementation(root).map((item) => item.code);
  for (const code of ["missing-source", "missing-message", "unlisted-message"]) {
    assert.ok(codes.includes(code), code);
  }
});

test("dictionary is parsed without executing code and duplicate keys are rejected", () => {
  assert.equal(readMessages(messages).get("ja").get("selected"), "選択色");
  assert.throws(
    () =>
      readMessages(
        messages.replace('ja: { selected: "選択色" }', 'ja: { selected: "A", selected: "B" }')
      ),
    /重複/
  );
  assert.throws(
    () => readMessages(messages.replace('selected: "選択色"', "selected: dangerous()")),
    /未対応/
  );
});
