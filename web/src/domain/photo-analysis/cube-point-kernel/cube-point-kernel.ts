import { labToChroma } from "@/domain/color/color-conversion";
import { toHueDegree, toPercentage, toRgbColor } from "@/domain/color/color-types";
import {
  unscaleHue,
  unscaleLabComponent,
  unscaleLightness,
  unscaleSaturation,
} from "@/domain/photo-analysis/shared/photo-analysis-color";
import type {
  PhotoSample,
  RgbCubePoint,
} from "@/domain/photo-analysis/shared/photo-analysis-types";
import type {
  CubePointKernelDerivedResult,
  CubePointKernelInput,
  CubePointKernelMode,
  CubePointKernelResult,
  CubePointKernelSelectionProjection,
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
  registerStoreExport: (
    xPtr: number,
    yPtr: number,
    rPtr: number,
    gPtr: number,
    bPtr: number,
    labLPtr: number,
    labAPtr: number,
    labBPtr: number,
    huePtr: number,
    saturationPtr: number,
    lightnessPtr: number,
    colorLen: number
  ) => number;
  releaseStoreExport: (storeId: number) => void;
  registerIndexesExport: (indexesPtr: number, indexesLen: number) => number;
  releaseIndexesExport: (indexesId: number) => void;
  buildCubePointsExport: (
    rPtr: number,
    gPtr: number,
    bPtr: number,
    colorLen: number,
    indexesPtr: number,
    indexesLen: number,
    useFullStore: number,
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
    useFullStore: number,
    bucketSize: number,
    maxPoints: number,
    outColorsPtr: number,
    outCountsPtr: number,
    outRatiosPtr: number
  ) => number;
  buildDerivedSelectionExport: (
    storeId: number,
    indexesId: number,
    bucketSize: number,
    maxPoints: number,
    outSelectedCountPtr: number,
    outColorsPtr: number,
    outCountsPtr: number,
    outRatiosPtr: number
  ) => number;
  materializeSelectedSamplesFromStoreExport: (
    storeId: number,
    indexesId: number,
    outXPtr: number,
    outYPtr: number,
    outColorsPtr: number,
    outLabLPtr: number,
    outLabAPtr: number,
    outLabBPtr: number,
    outHuePtr: number,
    outSaturationPtr: number,
    outLightnessPtr: number
  ) => number;
  buildDerivedSelectionProjectionExport: (
    storeId: number,
    indexesId: number,
    bucketSize: number,
    maxPoints: number,
    outSelectedCountPtr: number,
    outXPtr: number,
    outYPtr: number,
    outSampleColorsPtr: number,
    outLabLPtr: number,
    outLabAPtr: number,
    outLabBPtr: number,
    outHuePtr: number,
    outSaturationPtr: number,
    outLightnessPtr: number,
    outCubeColorsPtr: number,
    outCubeCountsPtr: number,
    outCubeRatiosPtr: number
  ) => number;
};

let wasmExports: CubePointKernelWasmExports | null = null;
const selectionLengthRegistry = new Map<number, number>();
const selectionIndexesRegistry = new Map<number, readonly number[]>();

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
  const registerIndexesExport = wasmNamedExports["register_indexes"] as
    | CubePointKernelWasmExports["registerIndexesExport"]
    | undefined;
  const releaseIndexesExport = wasmNamedExports["release_indexes"] as
    | CubePointKernelWasmExports["releaseIndexesExport"]
    | undefined;
  const buildCubePointsExport = wasmNamedExports["build_cube_points"] as
    | CubePointKernelWasmExports["buildCubePointsExport"]
    | undefined;
  const buildCubePointsFromStoreExport = wasmNamedExports["build_cube_points_from_store"] as
    | CubePointKernelWasmExports["buildCubePointsFromStoreExport"]
    | undefined;
  const buildDerivedSelectionExport = wasmNamedExports["build_derived_selection"] as
    | CubePointKernelWasmExports["buildDerivedSelectionExport"]
    | undefined;
  const materializeSelectedSamplesFromStoreExport = wasmNamedExports[
    "materialize_selected_samples_from_store"
  ] as CubePointKernelWasmExports["materializeSelectedSamplesFromStoreExport"] | undefined;
  const buildDerivedSelectionProjectionExport = wasmNamedExports[
    "build_derived_selection_projection"
  ] as CubePointKernelWasmExports["buildDerivedSelectionProjectionExport"] | undefined;
  if (
    !registerStoreExport ||
    !releaseStoreExport ||
    !registerIndexesExport ||
    !releaseIndexesExport ||
    !buildCubePointsExport ||
    !buildCubePointsFromStoreExport ||
    !buildDerivedSelectionExport ||
    !materializeSelectedSamplesFromStoreExport ||
    !buildDerivedSelectionProjectionExport
  ) {
    throw new Error("cube-point-kernel-export-missing");
  }
  wasmExports = {
    ...exports,
    registerStoreExport,
    releaseStoreExport,
    registerIndexesExport,
    releaseIndexesExport,
    buildCubePointsExport,
    buildCubePointsFromStoreExport,
    buildDerivedSelectionExport,
    materializeSelectedSamplesFromStoreExport,
    buildDerivedSelectionProjectionExport,
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

const writeU16 = (exports: CubePointKernelWasmExports, values: Uint16Array): number => {
  const ptr = exports.alloc(values.byteLength);
  const memory = new Uint16Array(exports.memory.buffer, ptr, values.length);
  memory.set(values);
  return ptr;
};

const writeI16 = (exports: CubePointKernelWasmExports, values: Int16Array): number => {
  const ptr = exports.alloc(values.byteLength);
  const memory = new Int16Array(exports.memory.buffer, ptr, values.length);
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

const createIndexes = (
  input: CubePointKernelInput
): { indexes: Uint32Array | null; isFullStore: boolean } => {
  const isFullStore = input.isFullStore ?? input.indexes === undefined;
  if (input.indexes === undefined) {
    return {
      indexes: null,
      isFullStore,
    };
  }
  return {
    indexes: Uint32Array.from(input.indexes),
    isFullStore,
  };
};

const emptyKernelResult = (): CubePointKernelResult => ({
  colors: new Uint8Array(),
  counts: new Uint32Array(),
  ratios: new Float32Array(),
  length: 0,
});

const materializePhotoSamples = ({
  xs,
  ys,
  colors,
  labLValues,
  labAValues,
  labBValues,
  hueValues,
  saturationValues,
  lightnessValues,
  sampleIds,
}: {
  xs: Uint32Array;
  ys: Uint32Array;
  colors: Uint8Array;
  labLValues: Uint16Array;
  labAValues: Int16Array;
  labBValues: Int16Array;
  hueValues: Uint16Array;
  saturationValues: Uint16Array;
  lightnessValues: Uint16Array;
  sampleIds: readonly number[];
}): PhotoSample[] =>
  Array.from({ length: xs.length }, (_, index) => {
    const colorOffset = index * 3;
    const lab = {
      l: unscaleLabComponent(labLValues[index] ?? 0),
      a: unscaleLabComponent(labAValues[index] ?? 0),
      b: unscaleLabComponent(labBValues[index] ?? 0),
    };
    return {
      sampleId: sampleIds[index] ?? index,
      x: xs[index] ?? 0,
      y: ys[index] ?? 0,
      color: toRgbColor(
        colors[colorOffset] ?? 0,
        colors[colorOffset + 1] ?? 0,
        colors[colorOffset + 2] ?? 0
      ),
      hsl: {
        h: toHueDegree(unscaleHue(hueValues[index] ?? 0)),
        s: toPercentage(unscaleSaturation(saturationValues[index] ?? 0)),
        l: toPercentage(unscaleLightness(lightnessValues[index] ?? 0)),
      },
      lab,
      chroma: labToChroma(lab),
    } satisfies PhotoSample;
  });

export const registerCubePointKernelStore = ({
  x,
  y,
  r,
  g,
  b,
  labL,
  labA,
  labB,
  hue,
  saturation,
  lightness,
}: {
  x: Uint16Array | Uint32Array;
  y: Uint16Array | Uint32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  labL: Uint16Array;
  labA: Int16Array;
  labB: Int16Array;
  hue: Uint16Array;
  saturation: Uint16Array;
  lightness: Uint16Array;
}): CubePointKernelStoreRegistration | null => {
  if (resolveCubePointKernelMode() !== "wasm" || !cubePointKernelWasmBase64) {
    return null;
  }

  try {
    const exports = getWasmExports();
    const xValues = Uint32Array.from(x);
    const yValues = Uint32Array.from(y);
    const xPtr = writeU32(exports, xValues);
    const yPtr = writeU32(exports, yValues);
    const rPtr = writeBytes(exports, r);
    const gPtr = writeBytes(exports, g);
    const bPtr = writeBytes(exports, b);
    const labLPtr = writeU16(exports, labL);
    const labAPtr = writeI16(exports, labA);
    const labBPtr = writeI16(exports, labB);
    const huePtr = writeU16(exports, hue);
    const saturationPtr = writeU16(exports, saturation);
    const lightnessPtr = writeU16(exports, lightness);
    const storeId = exports.registerStoreExport(
      xPtr,
      yPtr,
      rPtr,
      gPtr,
      bPtr,
      labLPtr,
      labAPtr,
      labBPtr,
      huePtr,
      saturationPtr,
      lightnessPtr,
      r.length
    );
    exports.dealloc(xPtr, xValues.byteLength);
    exports.dealloc(yPtr, yValues.byteLength);
    exports.dealloc(rPtr, r.byteLength);
    exports.dealloc(gPtr, g.byteLength);
    exports.dealloc(bPtr, b.byteLength);
    exports.dealloc(labLPtr, labL.byteLength);
    exports.dealloc(labAPtr, labA.byteLength);
    exports.dealloc(labBPtr, labB.byteLength);
    exports.dealloc(huePtr, hue.byteLength);
    exports.dealloc(saturationPtr, saturation.byteLength);
    exports.dealloc(lightnessPtr, lightness.byteLength);
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
    // Ignore release failures and keep the worker functional.
  }
};

export const registerCubePointKernelIndexes = (
  indexes: readonly number[]
): CubePointKernelStoreRegistration | null => {
  if (
    indexes.length === 0 ||
    resolveCubePointKernelMode() !== "wasm" ||
    !cubePointKernelWasmBase64
  ) {
    return null;
  }

  try {
    const exports = getWasmExports();
    const typedIndexes = Uint32Array.from(indexes);
    const indexesPtr = writeU32(exports, typedIndexes);
    const storeId = exports.registerIndexesExport(indexesPtr, typedIndexes.length);
    exports.dealloc(indexesPtr, typedIndexes.byteLength);
    if (storeId > 0) {
      selectionLengthRegistry.set(storeId, typedIndexes.length);
      selectionIndexesRegistry.set(storeId, [...indexes]);
    }
    return storeId > 0 ? { storeId } : null;
  } catch {
    return null;
  }
};

export const disposeCubePointKernelIndexes = (storeId: number | null | undefined): void => {
  if (!storeId || resolveCubePointKernelMode() !== "wasm" || !cubePointKernelWasmBase64) {
    return;
  }

  try {
    getWasmExports().releaseIndexesExport(storeId);
    selectionLengthRegistry.delete(storeId);
    selectionIndexesRegistry.delete(storeId);
  } catch {
    // Ignore release failures and keep the worker functional.
  }
};

export const buildDerivedSelectionKernelResult = ({
  registeredStoreId,
  registeredIndexesId,
  bucketSize,
  maxPoints,
}: {
  registeredStoreId: number | null | undefined;
  registeredIndexesId: number | null | undefined;
  bucketSize: number;
  maxPoints: number;
}): CubePointKernelDerivedResult | null => {
  if (
    !registeredStoreId ||
    !registeredIndexesId ||
    resolveCubePointKernelMode() !== "wasm" ||
    !cubePointKernelWasmBase64
  ) {
    return null;
  }

  try {
    const exports = getWasmExports();
    const outSelectedCountPtr = exports.alloc(Uint32Array.BYTES_PER_ELEMENT);
    const outColorsPtr = exports.alloc(maxPoints * 3);
    const outCountsPtr = exports.alloc(maxPoints * Uint32Array.BYTES_PER_ELEMENT);
    const outRatiosPtr = exports.alloc(maxPoints * Float32Array.BYTES_PER_ELEMENT);

    const length = exports.buildDerivedSelectionExport(
      registeredStoreId,
      registeredIndexesId,
      bucketSize,
      maxPoints,
      outSelectedCountPtr,
      outColorsPtr,
      outCountsPtr,
      outRatiosPtr
    );

    const selectedCount = new Uint32Array(exports.memory.buffer, outSelectedCountPtr, 1)[0] ?? 0;
    const result = readResult({
      exports,
      length,
      outColorsPtr,
      outCountsPtr,
      outRatiosPtr,
    });

    exports.dealloc(outSelectedCountPtr, Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outColorsPtr, maxPoints * 3);
    exports.dealloc(outCountsPtr, maxPoints * Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outRatiosPtr, maxPoints * Float32Array.BYTES_PER_ELEMENT);

    return {
      ...result,
      selectedCount,
    };
  } catch {
    return null;
  }
};

export const materializeSelectedSamplesFromKernel = ({
  registeredStoreId,
  registeredIndexesId,
}: {
  registeredStoreId: number | null | undefined;
  registeredIndexesId: number | null | undefined;
}): PhotoSample[] | null => {
  if (
    !registeredStoreId ||
    !registeredIndexesId ||
    resolveCubePointKernelMode() !== "wasm" ||
    !cubePointKernelWasmBase64
  ) {
    return null;
  }

  try {
    const exports = getWasmExports();
    const selectionLength = selectionLengthRegistry.get(registeredIndexesId) ?? 0;
    const selectionIndexes = selectionIndexesRegistry.get(registeredIndexesId) ?? [];
    if (selectionLength === 0) {
      return [];
    }

    const outXPtr = exports.alloc(selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    const outYPtr = exports.alloc(selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    const outColorsPtr = exports.alloc(selectionLength * 3);
    const outLabLPtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    const outLabAPtr = exports.alloc(selectionLength * Int16Array.BYTES_PER_ELEMENT);
    const outLabBPtr = exports.alloc(selectionLength * Int16Array.BYTES_PER_ELEMENT);
    const outHuePtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    const outSaturationPtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    const outLightnessPtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);

    const length = exports.materializeSelectedSamplesFromStoreExport(
      registeredStoreId,
      registeredIndexesId,
      outXPtr,
      outYPtr,
      outColorsPtr,
      outLabLPtr,
      outLabAPtr,
      outLabBPtr,
      outHuePtr,
      outSaturationPtr,
      outLightnessPtr
    );

    const xs = new Uint32Array(exports.memory.buffer, outXPtr, length).slice();
    const ys = new Uint32Array(exports.memory.buffer, outYPtr, length).slice();
    const colors = new Uint8Array(exports.memory.buffer, outColorsPtr, length * 3).slice();
    const labLValues = new Uint16Array(exports.memory.buffer, outLabLPtr, length).slice();
    const labAValues = new Int16Array(exports.memory.buffer, outLabAPtr, length).slice();
    const labBValues = new Int16Array(exports.memory.buffer, outLabBPtr, length).slice();
    const hueValues = new Uint16Array(exports.memory.buffer, outHuePtr, length).slice();
    const saturationValues = new Uint16Array(
      exports.memory.buffer,
      outSaturationPtr,
      length
    ).slice();
    const lightnessValues = new Uint16Array(exports.memory.buffer, outLightnessPtr, length).slice();

    exports.dealloc(outXPtr, selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outYPtr, selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outColorsPtr, selectionLength * 3);
    exports.dealloc(outLabLPtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outLabAPtr, selectionLength * Int16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outLabBPtr, selectionLength * Int16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outHuePtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outSaturationPtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outLightnessPtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);

    return materializePhotoSamples({
      xs,
      ys,
      colors,
      labLValues,
      labAValues,
      labBValues,
      hueValues,
      saturationValues,
      lightnessValues,
      sampleIds: selectionIndexes.slice(0, length),
    });
  } catch {
    return null;
  }
};

export const buildDerivedSelectionProjectionFromKernel = ({
  registeredStoreId,
  registeredIndexesId,
  bucketSize,
  maxPoints,
}: {
  registeredStoreId: number | null | undefined;
  registeredIndexesId: number | null | undefined;
  bucketSize: number;
  maxPoints: number;
}): CubePointKernelSelectionProjection | null => {
  if (
    !registeredStoreId ||
    !registeredIndexesId ||
    resolveCubePointKernelMode() !== "wasm" ||
    !cubePointKernelWasmBase64
  ) {
    return null;
  }

  try {
    const exports = getWasmExports();
    const selectionLength = selectionLengthRegistry.get(registeredIndexesId) ?? 0;
    const selectionIndexes = selectionIndexesRegistry.get(registeredIndexesId) ?? [];
    if (selectionLength === 0) {
      return {
        selectedCount: 0,
        selectedSamples: [],
        selectionCubePoints: [],
      };
    }

    const outSelectedCountPtr = exports.alloc(Uint32Array.BYTES_PER_ELEMENT);
    const outXPtr = exports.alloc(selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    const outYPtr = exports.alloc(selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    const outSampleColorsPtr = exports.alloc(selectionLength * 3);
    const outLabLPtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    const outLabAPtr = exports.alloc(selectionLength * Int16Array.BYTES_PER_ELEMENT);
    const outLabBPtr = exports.alloc(selectionLength * Int16Array.BYTES_PER_ELEMENT);
    const outHuePtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    const outSaturationPtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    const outLightnessPtr = exports.alloc(selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    const outCubeColorsPtr = exports.alloc(maxPoints * 3);
    const outCubeCountsPtr = exports.alloc(maxPoints * Uint32Array.BYTES_PER_ELEMENT);
    const outCubeRatiosPtr = exports.alloc(maxPoints * Float32Array.BYTES_PER_ELEMENT);

    const cubeLength = exports.buildDerivedSelectionProjectionExport(
      registeredStoreId,
      registeredIndexesId,
      bucketSize,
      maxPoints,
      outSelectedCountPtr,
      outXPtr,
      outYPtr,
      outSampleColorsPtr,
      outLabLPtr,
      outLabAPtr,
      outLabBPtr,
      outHuePtr,
      outSaturationPtr,
      outLightnessPtr,
      outCubeColorsPtr,
      outCubeCountsPtr,
      outCubeRatiosPtr
    );

    const selectedCount = new Uint32Array(exports.memory.buffer, outSelectedCountPtr, 1)[0] ?? 0;
    const xs = new Uint32Array(exports.memory.buffer, outXPtr, selectedCount).slice();
    const ys = new Uint32Array(exports.memory.buffer, outYPtr, selectedCount).slice();
    const sampleColors = new Uint8Array(
      exports.memory.buffer,
      outSampleColorsPtr,
      selectedCount * 3
    ).slice();
    const labLValues = new Uint16Array(exports.memory.buffer, outLabLPtr, selectedCount).slice();
    const labAValues = new Int16Array(exports.memory.buffer, outLabAPtr, selectedCount).slice();
    const labBValues = new Int16Array(exports.memory.buffer, outLabBPtr, selectedCount).slice();
    const hueValues = new Uint16Array(exports.memory.buffer, outHuePtr, selectedCount).slice();
    const saturationValues = new Uint16Array(
      exports.memory.buffer,
      outSaturationPtr,
      selectedCount
    ).slice();
    const lightnessValues = new Uint16Array(
      exports.memory.buffer,
      outLightnessPtr,
      selectedCount
    ).slice();
    const cubeResult = readResult({
      exports,
      length: cubeLength,
      outColorsPtr: outCubeColorsPtr,
      outCountsPtr: outCubeCountsPtr,
      outRatiosPtr: outCubeRatiosPtr,
    });

    exports.dealloc(outSelectedCountPtr, Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outXPtr, selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outYPtr, selectionLength * Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outSampleColorsPtr, selectionLength * 3);
    exports.dealloc(outLabLPtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outLabAPtr, selectionLength * Int16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outLabBPtr, selectionLength * Int16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outHuePtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outSaturationPtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outLightnessPtr, selectionLength * Uint16Array.BYTES_PER_ELEMENT);
    exports.dealloc(outCubeColorsPtr, maxPoints * 3);
    exports.dealloc(outCubeCountsPtr, maxPoints * Uint32Array.BYTES_PER_ELEMENT);
    exports.dealloc(outCubeRatiosPtr, maxPoints * Float32Array.BYTES_PER_ELEMENT);

    return {
      selectedCount,
      selectedSamples: materializePhotoSamples({
        xs,
        ys,
        colors: sampleColors,
        labLValues,
        labAValues,
        labBValues,
        hueValues,
        saturationValues,
        lightnessValues,
        sampleIds: selectionIndexes.slice(0, selectedCount),
      }),
      selectionCubePoints: materializeCubePoints(cubeResult),
    };
  } catch {
    return null;
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
    const { indexes, isFullStore } = createIndexes(input);
    const outColorsPtr = exports.alloc(input.maxPoints * 3);
    const outCountsPtr = exports.alloc(input.maxPoints * Uint32Array.BYTES_PER_ELEMENT);
    const outRatiosPtr = exports.alloc(input.maxPoints * Float32Array.BYTES_PER_ELEMENT);

    let length = 0;

    if (input.registeredStoreId) {
      const indexesPtr = indexes && indexes.length > 0 ? writeU32(exports, indexes) : 0;
      length = exports.buildCubePointsFromStoreExport(
        input.registeredStoreId,
        indexesPtr,
        indexes?.length ?? 0,
        isFullStore ? 1 : 0,
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
      const indexesPtr = indexes && indexes.length > 0 ? writeU32(exports, indexes) : 0;

      length = exports.buildCubePointsExport(
        rPtr,
        gPtr,
        bPtr,
        input.r.length,
        indexesPtr,
        indexes?.length ?? 0,
        isFullStore ? 1 : 0,
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
      return emptyKernelResult();
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
    return emptyKernelResult();
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
