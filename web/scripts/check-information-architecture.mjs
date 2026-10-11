import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const specName = "workbench-information-architecture";
const elementPattern = /^[A-Z]-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const copyPattern = /^[a-zA-Z][a-zA-Z0-9_.]*$/;
const requiredFields = ["目的", "背景", "重要度", "開示区分", "内容", "根拠区分"];

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
    [
      "information-architecture.md",
      "ui-copy.md",
      "glossary.md",
      "information-audit.md",
      "state-transitions.md",
    ].map((name) => [name, read(root, `${folder}/${name}`, diagnostics)])
  );
  for (const [name, text] of Object.entries(files)) {
    if (name !== "state-transitions.md") checkFormat(name, text, diagnostics);
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
    if (!/^P[123][。.]?$/.test(field(section, "重要度"))) {
      diagnostics.push({ code: "importance", message: `${id}: 重要度はP1/P2/P3で指定する` });
    }
    addUnique(
      elements,
      id,
      {
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
    const isActive = field(section, "区分") === "画面表示の標準案。";
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
    if (en && placeholders(en) !== variables) {
      diagnostics.push({ code: "placeholder", message: `${id}: enと変数定義が一致しない` });
    }
    addUnique(copy, id, { targets, ja, en, isActive }, diagnostics, "duplicate-copy");
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
  const glossary = new Map();
  for (const section of sections(files["glossary.md"])) {
    const id = section.title.split(" ")[0];
    if (!/^T-\d+$/.test(id)) continue;
    const targets = elementIds(field(section, "対応する情報要素"));
    for (const name of ["定義", "目的", "背景"]) {
      if (!field(section, name))
        diagnostics.push({ code: "term-definition", message: `${id}: ${name}がない` });
    }
    for (const target of targets) {
      if (!elements.has(target))
        diagnostics.push({ code: "term-target", message: `${id}: 未定義の要素 ${target}` });
    }
    addUnique(glossary, id, { targets }, diagnostics, "duplicate-term");
  }
  const operations = new Map();
  const covered = new Set();
  for (const section of sections(files["state-transitions.md"])) {
    const id = section.title.split(" ")[0];
    if (!/^OP-[A-Z0-9-]+$/.test(id)) continue;
    const targets = elementIds(field(section, "対象要素"));
    for (const name of ["操作", "前提", "変更", "保持", "結果", "判断区分"]) {
      if (!field(section, name))
        diagnostics.push({ code: "operation-field", message: `${id}: ${name}がない` });
    }
    if (!targets.length)
      diagnostics.push({ code: "operation-target", message: `${id}: 対象要素がない` });
    for (const target of targets) {
      if (!elements.has(target))
        diagnostics.push({ code: "operation-target", message: `${id}: 未定義の要素 ${target}` });
      covered.add(target);
    }
    addUnique(operations, id, { targets }, diagnostics, "duplicate-operation");
  }
  for (const id of elements.keys()) {
    if (!covered.has(id))
      diagnostics.push({
        code: "operation-coverage",
        message: `${id}: 操作または表示のみの分類がない`,
      });
  }
  const indexed = new Set();
  for (const line of files["state-transitions.md"].split(/\r?\n/)) {
    const row = line.split("|").map((cell) => cell.trim());
    if (row.length !== 5 || !elementPattern.test(row[1])) continue;
    const id = row[1];
    const ids = [...row[3].matchAll(/OP-[A-Z0-9-]+/g)].map((match) => match[0]);
    if (indexed.has(id))
      diagnostics.push({ code: "operation-index", message: `${id}: 操作一覧の行が重複` });
    indexed.add(id);
    const expected = [...operations]
      .filter(([, operation]) => operation.targets.includes(id))
      .map(([key]) => key)
      .sort();
    if (!elements.has(id) || ids.sort().join(",") !== expected.join(",")) {
      diagnostics.push({
        code: "operation-index",
        message: `${id}: 操作一覧と操作定義の対象が一致しない`,
      });
    }
  }
  for (const id of elements.keys()) {
    if (!indexed.has(id))
      diagnostics.push({ code: "operation-index", message: `${id}: 操作一覧に行がない` });
  }
  if (!glossary.size || !operations.size)
    diagnostics.push({ code: "empty-definition", message: "用語または操作の定義がない" });
  return { diagnostics, elements, copy, glossary, operations };
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
  const mapping = new Map();
  const mapText = read(root, `docs/specs/${specName}/implementation-map.md`, diagnostics);
  for (const section of sections(mapText)) {
    if (section.level !== 3) continue;
    const id = section.title;
    if (!design.elements.has(id) && !design.copy.has(id)) {
      diagnostics.push({
        code: "mapping-target",
        message: `実装対応が未定義の設計IDを指す: ${id}`,
      });
      continue;
    }
    const sources = codes(field(section, "参照元"));
    if (
      !sources.length ||
      sources.some((path) => isAbsolute(path) || !insideRoot(root, resolve(root, path)))
    ) {
      diagnostics.push({
        code: "source-reference",
        message: `${id}: 実装対応の参照元が未定義または範囲外`,
      });
    }
    addUnique(
      mapping,
      id,
      { sources, keys: codes(field(section, "実装キー")) },
      diagnostics,
      "duplicate-mapping"
    );
  }
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
  for (const id of design.elements.keys()) {
    const binding = mapping.get(id);
    if (!binding)
      diagnostics.push({ code: "missing-mapping", message: `${id}: 情報要素の実装対応がない` });
    else binding.sources.forEach(keys);
  }
  const knownKeys = new Set();
  for (const [key, record] of design.copy) {
    const binding = mapping.get(key);
    if (!binding) {
      diagnostics.push({ code: "missing-mapping", message: `${key}: 文言の実装対応がない` });
      continue;
    }
    const references = binding.sources.flatMap((source) => [...keys(source)]);
    if (!binding.keys.length) {
      if (record.isActive)
        diagnostics.push({
          code: "missing-mapping",
          message: `${key}: 標準文言の実装キーが未対応`,
        });
      continue;
    }
    for (const implementationKey of binding.keys) {
      knownKeys.add(implementationKey);
      if (record.targets.length && !references.includes(implementationKey)) {
        diagnostics.push({
          code: "source-key",
          message: `${key}: 実装キー${implementationKey}が対応先コードにない (${binding.sources.join(", ")})`,
        });
      }
      for (const locale of ["ja", "en"]) {
        const actual = messages.get(locale).get(implementationKey);
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
  }
  for (const [locale, values] of messages) {
    for (const key of values.keys()) {
      if (!knownKeys.has(key)) {
        diagnostics.push({
          code: "unlisted-message",
          message: `${key}: ${locale}辞書のキーに設計に従う実装対応がない`,
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
        glossary: design.glossary.size,
        operations: design.operations.size,
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
