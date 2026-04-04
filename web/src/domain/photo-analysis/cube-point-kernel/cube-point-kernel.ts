import { toRgbColor } from "@/domain/color/color-types";
import type { RgbCubePoint } from "@/domain/photo-analysis/shared/photo-analysis-types";
import type {
  CubePointKernelInput,
  CubePointKernelMode,
  CubePointKernelResult,
  CubePointKernelStoreRegistration,
} from "@/domain/photo-analysis/cube-point-kernel/cube-point-kernel-types";
import { cubePointKernelWasmBase64 } from "@/domain/photo-analysis/cube-point-kernel/generated/cube-point-kernel-wasm-bytes";
import { buildCubePointKernelResultWithJs } from "@/domain/photo-analysis/cube-point-kernel/js-cube-point-kernel";

const configuredMode = process.env.NEXT_PUBLIC_IROMAP_CUBE_POINTS_KERNEL;

const resolveCubePointKernelMode = (): CubePointKernelMode =>
  configuredMode === "wasm" ? "wasm" : "js";

type CubePointKernelWasmExports = WebAssembly.Exports & {
  memory: WebAssembly.Memory;
  alloc: (len: number) => number;
  dealloc: (ptr: number, len: number) => void;
  registerStoreExport: (rPtr: number, gPtr: number, bPtr: number, colorLen: number) => number;
  releaseStoreExport: (storeId: number) => void;
  buildCubePointsExport: (
    rPtr: number,
    gPtr: number,
    bPtr: number,
    colorLen: number,
    indexesPtr: number,
    indexesLen: number,
    bucketSize: number,
    maxPoints: number,
    outColorsPtr: number,
    outCountsPtr: number,
    outRatiosPtr: number
  ) => number;
  buildCubePointsFromStoreExport: (
    storeId: number,
    indexesPtr: number,
    indexesLen: number,
    bucketSize: number,
    maxPoints: number,
    outColorsPtr: number,
    outCountsPtr: number,
    outRatiosPtr: number
  ) => number;
};

let wasmExports: CubePointKernelWasmExports | null = null;

const getWasmExports = (): CubePointKernelWasmExports => {
  if (wasmExports) {
    return wasmExports;
  }

  const bytes =
    typeof Buffer !== "undefined"
      ? Buffer.from(cubePointKernelWasmBase64, "base64")
      : Uint8Array.from(atob(cubePointKernelWasmBase64), (char) => char.charCodeAt(0));
  const wasmModule = new WebAssembly.Module(bytes);
  const instance = new WebAssembly.Instance(wasmModule, {});
  const exports = instance.exports as WebAssembly.Exports & {
    memory: WebAssembly.Memory;
    alloc: (len: number) => number;
    dealloc: (ptr: number, len: number) => void;
  };
  const wasmNamedExports = exports as unknown as Record<string, unknown>;
  const registerStoreExport = wasmNamedExports["register_store"] as
    | CubePointKernelWasmExports["registerStoreExport"]
    | undefined;
  const releaseStoreExport = wasmNamedExports["release_store"] as
    | CubePointKernelWasmExports["releaseStoreExport"]
    | undefined;
  const buildCubePointsExport = wasmNamedExports["build_cube_points"] as
    | CubePointKernelWasmExports["buildCubePointsExport"]
    | undefined;
  const buildCubePointsFromStoreExport = wasmNamedExports["build_cube_points_from_store"] as
    | CubePointKernelWasmExports["buildCubePointsFromStoreExport"]
    | undefined;
  if (
    !registerStoreExport ||
    !releaseStoreExport ||
    !buildCubePointsExport ||
    !buildCubePointsFromStoreExport
  ) {
    throw new Error("cube-point-kernel-export-missing");
  }
  wasmExports = {
    ...exports,
    registerStoreExport,
    releaseStoreExport,
    buildCubePointsExport,
    buildCubePointsFromStoreExport,
  };
  return wasmExports;
};

const writeBytes = (exports: CubePointKernelWasmExports, bytes: Uint8Array): number => {
  const ptr = exports.alloc(bytes.byteLength);
  const memory = new Uint8Array(exports.memory.buffer);
  memory.set(bytes, ptr);
  return ptr;
};

const writeU32 = (exports: CubePointKernelWasmExports, values: Uint32Array): number => {
  const ptr = exports.alloc(values.byteLength);
  const memory = new Uint32Array(exports.memory.buffer, ptr, values.length);
  memory.set(values);
  return ptr;
};

const readResult = ({
  exports,
  length,
  outColorsPtr,
  outCountsPtr,
  outRatiosPtr,
}: {
  exports: CubePointKernelWasmExports;
  length: number;
  outColorsPtr: number;
  outCountsPtr: number;
  outRatiosPtr: number;
}): CubePointKernelResult => ({
  colors: new Uint8Array(exports.memory.buffer, outColorsPtr, length * 3).slice(),
  counts: new Uint32Array(exports.memory.buffer, outCountsPtr, length).slice(),
  ratios: new Float32Array(exports.memory.buffer, outRatiosPtr, length).slice(),
  length,
});

const createIndexes = (input: CubePointKernelInput): Uint32Array | null => {
  if (!input.indexes || input.indexes.length === 0) {
    return null;
  }
  return Uint32Array.from(input.indexes);
};

export const registerCubePointKernelStore = ({
  r,
  g,
  b,
}: {
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
}): CubePointKernelStoreRegistration | null => {
  if (resolveCubePointKernelMode() !== "wasm" || !cubePointKernelWasmBase64) {
    return null;
  }

  try {
    const exports = getWasmExports();
    const rPtr = writeBytes(exports, r);
    const gPtr = writeBytes(exports, g);
    const bPtr = writeBytes(exports, b);
    const storeId = exports.registerStoreExport(rPtr, gPtr, bPtr, r.length);
    exports.dealloc(rPtr, r.byteLength);
    exports.dealloc(gPtr, g.byteLength);
    exports.dealloc(bPtr, b.byteLength);
    return storeId > 0 ? { storeId } : null;
  } catch {
    return null;
  }
};

export const disposeCubePointKernelStore = (storeId: number | null | undefined): void => {
  if (!storeId || resolveCubePointKernelMode() !== "wasm" || !cubePointKernelWasmBase64) {
    return;
  }

  try {
    getWasmExports().releaseStoreExport(storeId);
  } catch {
    // Fallback keeps the worker functional even if release fails.
  }
};

const buildCubePointKernelResultWithWasm = (input: CubePointKernelInput): CubePointKernelResult => {
  if (!cubePointKernelWasmBase64) {
    return buildCubePointKernelResultWithJs({
      ...input,
      r: input.r ?? new Uint8Array(),
      g: input.g ?? new Uint8Array(),
      b: input.b ?? new Uint8Array(),
    });
  }

  try {
    const exports = getWasmExports();
    const indexes = createIndexes(input);
    const outColorsPtr = exports.alloc(input.maxPoints * 3);
    const outCountsPtr = exports.alloc(input.maxPoints * Uint32Array.BYTES_PER_ELEMENT);
    const outRatiosPtr = exports.alloc(input.maxPoints * Float32Array.BYTES_PER_ELEMENT);

    let length = 0;

    if (input.registeredStoreId) {
      const indexesPtr = indexes ? writeU32(exports, indexes) : 0;
      length = exports.buildCubePointsFromStoreExport(
        input.registeredStoreId,
        indexesPtr,
        indexes?.length ?? 0,
        input.bucketSize,
        input.maxPoints,
        outColorsPtr,
        outCountsPtr,
        outRatiosPtr
      );
      if (indexesPtr) {
        exports.dealloc(indexesPtr, indexes!.byteLength);
      }
    } else {
      if (!input.r || !input.g || !input.b) {
        throw new Error("cube-point-kernel-missing-input");
      }
      const rPtr = writeBytes(exports, input.r);
      const gPtr = writeBytes(exports, input.g);
      const bPtr = writeBytes(exports, input.b);
      const indexesPtr = indexes ? writeU32(exports, indexes) : 0;

      length = exports.buildCubePointsExport(
        rPtr,
        gPtr,
        bPtr,
        input.r.length,
        indexesPtr,
        indexes?.length ?? 0,
        input.bucketSize,
        input.maxPoints,
        outColorsPtr,
        outCountsPtr,
        outRatiosPtr
      );

      exports.dealloc(rPtr, input.r.byteLength);
      exports.dealloc(gPtr, input.g.byteLength);
      exports.dealloc(bPtr, input.b.byteLength);
      if (indexesPtr) {
        exports.dealloc(indexesPtr, indexes!.byteLength);
      }
    }

    const result = readResult({
      exports,
      length,
      outColorsPtr,
      outCountsPtr,
      outRatiosPtr,
    });

    exports.dealloc(outColorsPtr, input.maxPoints * 3);
    exports.dealloc(outCountsPtr, input.maxPoints * Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outRatiosPtr, input.maxPoints * Float32Array.BYTES_PER_ELEMENT);

    return result;
  } catch {
    if (!input.r || !input.g || !input.b) {
      return {
        colors: new Uint8Array(),
        counts: new Uint32Array(),
        ratios: new Float32Array(),
        length: 0,
      };
    }
    return buildCubePointKernelResultWithJs({
      ...input,
      r: input.r,
      g: input.g,
      b: input.b,
    });
  }
};

export const buildCubePointKernelResult = (input: CubePointKernelInput): CubePointKernelResult => {
  if (resolveCubePointKernelMode() === "wasm") {
    return buildCubePointKernelResultWithWasm(input);
  }
  if (!input.r || !input.g || !input.b) {
    return {
      colors: new Uint8Array(),
      counts: new Uint32Array(),
      ratios: new Float32Array(),
      length: 0,
    };
  }
  return buildCubePointKernelResultWithJs({
    ...input,
    r: input.r,
    g: input.g,
    b: input.b,
  });
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
