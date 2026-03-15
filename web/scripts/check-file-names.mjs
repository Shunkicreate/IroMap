import { readdirSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL("../src/", import.meta.url));
const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const FILE_NAME_PATTERN = /^[a-z0-9-]+(\.module)?\.(ts|tsx|js|jsx|css)$/;

const violations = [];

function walk(dirPath) {
  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const name = basename(fullPath);
    const extension = name.slice(name.lastIndexOf("."));
    if (!TARGET_EXTENSIONS.has(extension)) {
      continue;
    }

    if (!FILE_NAME_PATTERN.test(name)) {
      violations.push(relative(ROOT_DIR, fullPath));
    }
  }
}

walk(ROOT_DIR);

if (violations.length > 0) {
  console.error("Found files that are not kebab-case:");
  for (const file of violations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}
