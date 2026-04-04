import { toRgbColor } from "@/domain/color/color-types";
import type { RgbCubePoint } from "@/domain/photo-analysis/shared/photo-analysis-types";
import type {
  CubePointKernelInput,
  CubePointKernelMode,
  CubePointKernelResult,
} from "@/domain/photo-analysis/cube-point-kernel/cube-point-kernel-types";
import { buildCubePointKernelResultWithJs } from "@/domain/photo-analysis/cube-point-kernel/js-cube-point-kernel";

const configuredMode = process.env.NEXT_PUBLIC_IROMAP_CUBE_POINTS_KERNEL;

const resolveCubePointKernelMode = (): CubePointKernelMode =>
  configuredMode === "wasm" ? "wasm" : "js";

const buildCubePointKernelResultWithWasm = (input: CubePointKernelInput): CubePointKernelResult => {
  // WASM implementation will be wired in after the Rust toolchain is introduced.
  return buildCubePointKernelResultWithJs(input);
};

export const buildCubePointKernelResult = (input: CubePointKernelInput): CubePointKernelResult => {
  return resolveCubePointKernelMode() === "wasm"
    ? buildCubePointKernelResultWithWasm(input)
    : buildCubePointKernelResultWithJs(input);
};

export const materializeCubePoints = (result: CubePointKernelResult): RgbCubePoint[] => {
  return Array.from({ length: result.length }, (_, index) => {
    const offset = index * 3;
    return {
      color: toRgbColor(
        result.colors[offset] ?? 0,
        result.colors[offset + 1] ?? 0,
        result.colors[offset + 2] ?? 0
      ),
      count: result.counts[index] ?? 0,
      ratio: result.ratios[index] ?? 0,
    };
  });
};
