#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
WEB_DIR="${ROOT_DIR}/web"
GENERATED_FILE="${WEB_DIR}/src/domain/photo-analysis/cube-point-kernel/generated/cube-point-kernel-wasm-bytes.ts"

if ! git -C "${ROOT_DIR}" diff --quiet -- wasm/cube-point-kernel; then
  :
elif ! git -C "${ROOT_DIR}" diff --cached --quiet -- wasm/cube-point-kernel; then
  :
else
  exit 0
fi

echo "WASM source changes detected. Rebuilding cube-point artifact..."
pnpm --dir "${WEB_DIR}" run build:wasm:cube-points

if ! git -C "${ROOT_DIR}" diff --quiet -- "${GENERATED_FILE}"; then
  echo "ERROR: Generated WASM artifact is out of date: ${GENERATED_FILE}" >&2
  echo "Stage the regenerated file and push again." >&2
  exit 1
fi
