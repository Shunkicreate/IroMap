import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const specName = "workbench-information-architecture";
const elementPattern = /^[A-Z]-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const copyPattern = /^[a-zA-Z][a-zA-Z0-9_.]*$/;
const requiredFields = ["目的", "背景", "重要度", "開示区分", "内容", "根拠区分", "参照元"];

const normalize = (text) => text.replace(/\\([*_`])/g, "$1").trim();
const placeholders = (text) =>
  [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
    .map((match) => match[1])
    .sort()
    .join(",");
const codes = (text) => [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
const elementIds = (text) =>
  [...text.matchAll(/\b[A-Z]-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g)].map((match) => match[0]);

function sections(text) {
  const result = [];
  let section;
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,5})\s+(.*)$/);
    if (heading) {
      section = { level: heading[1].length, title: heading[2], lines: [] };
      result.push(section);
    } else if (section) {
      section.lines.push(line);
    }
  }
  return result;
}

function field(section, name) {
  const prefix = `- ${name}: `;
  return normalize(
    section.lines.find((line) => line.startsWith(prefix))?.slice(prefix.length) ?? ""
  );
}

function addUnique(map, key, value, diagnostics, code) {
  if (map.has(key)) {
    diagnostics.push({ code, message: `重複ID: ${key}` });
  } else {
    map.set(key, value);
  }
}

function insideRoot(root, path) {
  const rel = relative(root, path);
  return (
    rel !== ".." && !rel.startsWith(".." + "/") && !rel.startsWith(".." + "\\") && !isAbsolute(rel)
  );
}

function read(root, path, diagnostics) {
  const absolute = resolve(root, path);
  if (!insideRoot(root, absolute)) {
    diagnostics.push({ code: "outside-root", message: `範囲外の参照: ${path}` });
    return "";
  }
  try {
    return readFileSync(absolute, "utf8");
  } catch {
    diagnostics.push({ code: "missing-document", message: `文書がない: ${path}` });
    return "";
  }
}

function checkFormat(name, text, diagnostics) {
  let lastLevel = 0;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    if (!/^(#{1,5}\s|\s*-\s)/.test(line)) {
      diagnostics.push({
        code: "document-format",
        message: `${name}:${index + 1}: 見出し・リスト以外の行`,
      });
    }
    const heading = line.match(/^(#+)\s/);
    if (heading) {
      if (heading[1].length > lastLevel + 1) {
        diagnostics.push({
          code: "heading-level",
          message: `${name}:${index + 1}: 見出し階層が飛んでいる`,
        });
      }
      lastLevel = heading[1].length;
    }
  }
}

export function checkDesign(root = defaultRoot) {
  const diagnostics = [];
  const folder = `docs/specs/${specName}`;
  const files = Object.fromEntries(
    ["information-architecture.md", "ui-copy.md", "glossary.md", "information-audit.md"].map(
      (name) => [name, read(root, `${folder}/${name}`, diagnostics)]
    )
  );
  for (const [name, text] of Object.entries(files)) {
    checkFormat(name, text, diagnostics);
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      const absolute = resolve(root, folder, target);
      if (!insideRoot(root, absolute) || !existsSync(absolute)) {
        diagnostics.push({ code: "document-link", message: `${name}: リンク先がない ${target}` });
      }
    }
  }
  const elements = new Map();
  for (const section of sections(files["information-architecture.md"])) {
    const id = section.title.split(" ")[0];
    if (!elementPattern.test(id)) continue;
    for (const name of requiredFields) {
      if (!field(section, name) && name !== "内容") {
        diagnostics.push({ code: "missing-field", message: `${id}: ${name}がない` });
      }
    }
    if (!section.lines.some((line) => line === "- 内容:")) {
      diagnostics.push({ code: "missing-field", message: `${id}: 内容がない` });
    }
    const sources = codes(field(section, "参照元"));
    if (!/^P[123][。.]?$/.test(field(section, "重要度"))) {
      diagnostics.push({ code: "importance", message: `${id}: 重要度はP1/P2/P3で指定する` });
    }
    if (!sources.length) {
      diagnostics.push({ code: "source-reference", message: `${id}: 参照元がない` });
    }
    for (const source of sources) {
      if (isAbsolute(source) || !insideRoot(root, resolve(root, source))) {
        diagnostics.push({ code: "source-reference", message: `${id}: 不正な参照元 ${source}` });
      }
    }
    addUnique(
      elements,
      id,
      {
        sources,
        keys: codes(field(section, "文言ID")),
        extraKeys: codes(field(section, "補助文言ID")),
      },
      diagnostics,
      "duplicate-element"
    );
  }
  const copy = new Map();
  for (const section of sections(files["ui-copy.md"])) {
    if (section.level !== 3 || !copyPattern.test(section.title)) continue;
    const id = section.title;
    const targets = elementIds(field(section, "対応要素"));
    const ja = field(section, "標準 ja") || field(section, "保管値 ja");
    const en = field(section, "標準 en") || field(section, "保管値 en");
    const isMessage = !id.includes(".");
    const isActive = field(section, "区分") === "画面表示の標準案。";
    const recordedSources = codes(field(section, "参照元"));
    const sources = recordedSources;
    if (
      !sources.length ||
      sources.some((source) => isAbsolute(source) || !insideRoot(root, resolve(root, source)))
    ) {
      diagnostics.push({ code: "source-reference", message: `${id}: 参照元が未定義または範囲外` });
    }
    if (!field(section, "目的") || (!field(section, "背景") && !field(section, "背景・根拠"))) {
      diagnostics.push({ code: "copy-purpose", message: `${id}: 目的または背景がない` });
    }
    for (const target of targets) {
      if (!elements.has(target)) {
        diagnostics.push({ code: "copy-target", message: `${id}: 未定義の要素 ${target}` });
      }
    }
    if (isActive && !targets.length) {
      diagnostics.push({ code: "copy-target", message: `${id}: 表示先がない` });
    }
    const variables = codes(field(section, "変数"))
      .map((name) => name.slice(1, -1))
      .sort()
      .join(",");
    if (placeholders(ja) !== variables) {
      diagnostics.push({ code: "placeholder", message: `${id}: jaと変数定義が一致しない` });
    }
    if (isMessage && placeholders(en) !== variables) {
      diagnostics.push({ code: "placeholder", message: `${id}: enと変数定義が一致しない` });
    }
    addUnique(
      copy,
      id,
      { targets, ja, en, isMessage, isActive, sources },
      diagnostics,
      "duplicate-copy"
    );
  }
  if (!elements.size || !copy.size) {
    diagnostics.push({ code: "empty-definition", message: "要素または文言の定義がない" });
  }
  for (const [id, element] of elements) {
    for (const key of [...element.keys, ...element.extraKeys]) {
      const record = copy.get(key);
      if (!record) {
        diagnostics.push({ code: "missing-copy", message: `${id}: 未定義の文言ID ${key}` });
      } else if (!record.targets.includes(id)) {
        diagnostics.push({ code: "reverse-reference", message: `${id}と${key}の対応が片方向` });
      }
    }
  }
  for (const [key, record] of copy) {
    for (const id of record.targets) {
      const element = elements.get(id);
      if (element && ![...element.keys, ...element.extraKeys].includes(key)) {
        diagnostics.push({ code: "reverse-reference", message: `${key}と${id}の対応が片方向` });
      }
    }
  }
  for (const entry of readdirSync(resolve(root, "docs/specs"), { withFileTypes: true })) {
    if (entry.isDirectory() && /^\d{4}-\d{2}-/.test(entry.name)) {
      diagnostics.push({ code: "dated-spec", message: `日付付きspecディレクトリ: ${entry.name}` });
    }
  }
  return { diagnostics, elements, copy };
}

function loadTypescript() {
  try {
    return createRequire(import.meta.url)("typescript");
  } catch {
    throw new Error(
      "実装照合にはwebの依存関係が必要です。pnpm --dir web installを実行してください。"
    );
  }
}

export function sourceKeys(text, typescript = loadTypescript()) {
  const result = new Set();
  const source = typescript.createSourceFile(
    "source.tsx",
    text,
    typescript.ScriptTarget.Latest,
    true,
    typescript.ScriptKind.TSX
  );
  function visit(node) {
    if (typescript.isStringLiteral(node) || typescript.isNoSubstitutionTemplateLiteral(node)) {
      result.add(node.text);
    }
    typescript.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

export function readMessages(text, typescript = loadTypescript()) {
  const result = new Map();
  const source = typescript.createSourceFile(
    "messages.ts",
    text,
    typescript.ScriptTarget.Latest,
    true
  );
  function unwrap(node) {
    while (typescript.isAsExpression(node) || typescript.isParenthesizedExpression(node)) {
      node = node.expression;
    }
    return node;
  }
  function visit(node) {
    if (typescript.isVariableDeclaration(node) && node.name.getText(source) === "i18nMessages") {
      const object = unwrap(node.initializer);
      if (!typescript.isObjectLiteralExpression(object))
        throw new Error("i18nMessagesの形式を読み取れません。");
      for (const locale of object.properties) {
        if (!typescript.isPropertyAssignment(locale)) continue;
        const name = locale.name.getText(source).replace(/['"]/g, "");
        if (!["ja", "en"].includes(name)) continue;
        const messages = unwrap(locale.initializer);
        if (!typescript.isObjectLiteralExpression(messages))
          throw new Error(`${name}の辞書を読み取れません。`);
        const values = new Map();
        for (const item of messages.properties) {
          if (
            !typescript.isPropertyAssignment(item) ||
            !typescript.isStringLiteral(item.initializer)
          )
            throw new Error(`${name}に未対応の辞書定義があります。`);
          const key = item.name.getText(source).replace(/['"]/g, "");
          if (values.has(key)) throw new Error(`${name}辞書のキーが重複: ${key}`);
          values.set(key, item.initializer.text);
        }
        result.set(name, values);
      }
    }
    typescript.forEachChild(node, visit);
  }
  visit(source);
  if (!result.has("ja") || !result.has("en")) throw new Error("ja/en辞書がありません。");
  return result;
}

export function checkImplementation(root = defaultRoot, design = checkDesign(root)) {
  const diagnostics = [];
  const typescript = loadTypescript();
  const messages = readMessages(
    readFileSync(resolve(root, "web/src/i18n/messages.ts"), "utf8"),
    typescript
  );
  const cache = new Map();
  function keys(path) {
    if (!cache.has(path)) {
      const absolute = resolve(root, path);
      if (!insideRoot(root, absolute) || !existsSync(absolute)) {
        diagnostics.push({ code: "missing-source", message: `参照元がない: ${path}` });
        cache.set(path, new Set());
      } else {
        cache.set(path, sourceKeys(readFileSync(absolute, "utf8"), typescript));
      }
    }
    return cache.get(path);
  }
  for (const [id, element] of design.elements) {
    const references = element.sources.flatMap((source) => [...keys(source)]);
    for (const key of element.keys) {
      if (!references.includes(key)) {
        diagnostics.push({
          code: "source-key",
          message: `${id}: ${key}が参照元の実行コードにない (${element.sources.join(", ")})`,
        });
      }
    }
  }
  for (const [key, record] of design.copy) {
    const references = record.sources.flatMap((source) => [...keys(source)]);
    if (!record.isMessage) continue;
    if (record.targets.length && !references.includes(key)) {
      diagnostics.push({
        code: "source-key",
        message: `${key}: 文言定義の参照元にキーがない (${record.sources.join(", ")})`,
      });
    }
    for (const locale of ["ja", "en"]) {
      const actual = messages.get(locale).get(key);
      if (actual === undefined) {
        diagnostics.push({ code: "missing-message", message: `${key}: ${locale}辞書にない` });
      } else if (record.isActive && actual !== record[locale]) {
        diagnostics.push({
          code: "copy-drift",
          message: `${key}: ${locale}の表示文言が設計と異なる`,
        });
      }
    }
  }
  for (const [locale, values] of messages) {
    for (const key of values.keys()) {
      if (!design.copy.has(key)) {
        diagnostics.push({
          code: "unlisted-message",
          message: `${key}: ${locale}辞書のキーが文言定義にない`,
        });
      }
    }
  }
  return diagnostics;
}

export function run(args = process.argv.slice(2)) {
  if (args.some((arg) => arg !== "--implementation")) {
    console.error("Usage: node web/scripts/check-information-architecture.mjs [--implementation]");
    return 1;
  }
  const design = checkDesign();
  let diagnostics = design.diagnostics;
  let exitCode = diagnostics.length ? 1 : 0;
  if (!exitCode && args.includes("--implementation")) {
    diagnostics = checkImplementation(defaultRoot, design);
    if (diagnostics.length) exitCode = 2;
  }
  const counts = Object.fromEntries(
    [...new Set(diagnostics.map((item) => item.code))].map((code) => [
      code,
      diagnostics.filter((item) => item.code === code).length,
    ])
  );
  console.log(
    JSON.stringify(
      {
        mode: args.includes("--implementation") ? "implementation" : "design",
        elements: design.elements.size,
        copy: design.copy.size,
        differences: diagnostics.length,
        counts,
        diagnostics,
      },
      null,
      2
    )
  );
  return exitCode;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
