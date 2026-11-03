import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { format, resolveConfig } from "prettier";

const root = new URL("../../", import.meta.url);
const palette = JSON.parse(
  await readFile(new URL("docs/specs/theme-color-system/tokens.json", root), "utf8")
);
const marker = palette.selectionMarker;
const css = ["/* Generated from docs/specs/theme-color-system/tokens.json. Do not edit. */"];
const observation = {};
for (const [mode, definition] of Object.entries(palette.modes)) {
  css.push(mode === "light" ? ":root {" : ".dark {");
  for (const [key, value] of Object.entries(definition.tokens)) {
    css.push(
      "  --" +
        key.replaceAll(".", "-").replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase()) +
        ": " +
        value +
        ";"
    );
  }
  for (const [key, value] of Object.entries(marker))
    css.push("  --selection-marker-" + key + ": " + value + ";");
  css.push("}", "");
  observation[mode] = Object.fromEntries(
    Object.entries(definition.tokens)
      .filter(([key]) => key.startsWith("observation."))
      .map(([key, value]) => [key.slice("observation.".length), value])
  );
}
const outputs = [
  ["web/src/styles/theme-colors.css", css.join("\n") + "\n"],
  [
    "web/src/lib/observation-colors.ts",
    "// Generated from docs/specs/theme-color-system/tokens.json. Do not edit.\n" +
      "export const observationColors = " +
      JSON.stringify(observation) +
      " as const;\n" +
      "export const selectionMarker = " +
      JSON.stringify(marker) +
      " as const;\n" +
      "export type ObservationColors = { [Key in keyof typeof observationColors.light]: string };\n",
  ],
];
for (const [path, contents] of outputs) {
  const url = new URL(path, root);
  const source = path.endsWith(".css")
    ? contents.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, "#$1$2$3")
    : contents;
  const formatted = await format(source, {
    ...(await resolveConfig(fileURLToPath(url))),
    filepath: fileURLToPath(url),
  });
  if (process.argv.includes("--check")) {
    const actual = (await readFile(url, "utf8")).replaceAll("\r\n", "\n");
    if (actual !== formatted)
      throw new Error(path + " differs from the approved design. Run generate:theme.");
  } else {
    await mkdir(dirname(fileURLToPath(url)), { recursive: true });
    await writeFile(url, formatted);
  }
}
console.log("Theme colors: both modes match the design source.");
