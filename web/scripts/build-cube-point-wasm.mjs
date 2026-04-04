import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");
const repoRoot = resolve(webRoot, "..");
const wasmCrateDir = resolve(repoRoot, "wasm", "cube-point-kernel");
const cargoEnv = resolve(process.env.HOME ?? "", ".cargo", "env");
const targetDir = join(wasmCrateDir, "target", "wasm32-unknown-unknown", "release");
const wasmFile = join(targetDir, "cube_point_kernel.wasm");
const generatedFile = resolve(
  webRoot,
  "src",
  "domain",
  "photo-analysis",
  "cube-point-kernel",
  "generated",
  "cube-point-kernel-wasm-bytes.ts"
);

const cargoCommand = `. "${cargoEnv}" && cargo build --manifest-path "${join(
  wasmCrateDir,
  "Cargo.toml"
)}" --target wasm32-unknown-unknown --release`;
const build = spawnSync("/bin/zsh", ["-lc", cargoCommand], {
  cwd: repoRoot,
  stdio: "inherit",
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const bytes = await readFile(wasmFile);
const base64 = bytes.toString("base64");
await mkdir(dirname(generatedFile), { recursive: true });
await writeFile(generatedFile, `export const cubePointKernelWasmBase64 = "${base64}";\n`, "utf8");
console.log(`generated ${generatedFile}`);
