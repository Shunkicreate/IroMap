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

const cargoManifestPath = join(wasmCrateDir, "Cargo.toml");

const buildWithCargoOnPath = () =>
  spawnSync(
    "cargo",
    [
      "build",
      "--manifest-path",
      cargoManifestPath,
      "--target",
      "wasm32-unknown-unknown",
      "--release",
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    }
  );

const buildWithCargoEnv = () => {
  const cargoCommand = `. "${cargoEnv}" && cargo build --manifest-path "${cargoManifestPath}" --target wasm32-unknown-unknown --release`;
  return spawnSync("/bin/zsh", ["-lc", cargoCommand], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};

let build = buildWithCargoOnPath();
if (build.error?.code === "ENOENT" && process.env.HOME) {
  build = buildWithCargoEnv();
}
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const bytes = await readFile(wasmFile);
const base64 = bytes.toString("base64");
await mkdir(dirname(generatedFile), { recursive: true });
await writeFile(generatedFile, `export const cubePointKernelWasmBase64 = "${base64}";\n`, "utf8");
console.log(`generated ${generatedFile}`);
