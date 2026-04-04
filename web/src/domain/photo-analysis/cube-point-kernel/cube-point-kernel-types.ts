export type CubePointKernelInput = {
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  indexes?: readonly number[];
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
