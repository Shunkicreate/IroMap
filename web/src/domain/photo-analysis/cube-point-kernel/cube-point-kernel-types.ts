import type {
  PhotoSample,
  RgbCubePoint,
} from "@/domain/photo-analysis/shared/photo-analysis-types";

export type CubePointKernelInput = {
  r?: Uint8Array;
  g?: Uint8Array;
  b?: Uint8Array;
  registeredStoreId?: number | null;
  indexes?: readonly number[];
  isFullStore?: boolean;
  bucketSize: number;
  maxPoints: number;
};

export type CubePointKernelResult = {
  colors: Uint8Array;
  counts: Uint32Array;
  ratios: Float32Array;
  length: number;
};

export type CubePointKernelMode = "js" | "wasm";

export type CubePointKernelStoreRegistration = {
  storeId: number;
};

export type CubePointKernelDerivedResult = CubePointKernelResult & {
  selectedCount: number;
};

export type CubePointKernelSelectionProjection = {
  selectedCount: number;
  selectedSamples: PhotoSample[];
  selectionCubePoints: RgbCubePoint[];
};
