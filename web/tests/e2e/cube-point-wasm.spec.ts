import { expect, test } from "@playwright/test";
import { cubePointKernelWasmBase64 } from "@/domain/photo-analysis/cube-point-kernel/generated/cube-point-kernel-wasm-bytes";

test("WASM生成物: JSフォールバックを使わず色の集約結果を取得できる", async () => {
  const bytes = Buffer.from(cubePointKernelWasmBase64, "base64");
  const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
  const namedExports = instance.exports as Record<string, unknown>;
  const memory = namedExports["memory"] as WebAssembly.Memory;
  const allocate = namedExports["alloc"] as (length: number) => number;
  const deallocate = namedExports["dealloc"] as (pointer: number, length: number) => void;
  const buildCubePoints = namedExports["build_cube_points"] as (...args: number[]) => number;
  const allocations: { pointer: number; length: number }[] = [];
  const reserve = (length: number): number => {
    const pointer = allocate(length);
    allocations.push({ pointer, length });
    return pointer;
  };
  const writeBytes = (values: number[]): number => {
    const pointer = reserve(values.length);
    new Uint8Array(memory.buffer, pointer, values.length).set(values);
    return pointer;
  };

  try {
    const rPointer = writeBytes([32, 32, 0]);
    const gPointer = writeBytes([0, 0, 16]);
    const bPointer = writeBytes([0, 0, 0]);
    const colorsPointer = reserve(6);
    const countsPointer = reserve(2 * Uint32Array.BYTES_PER_ELEMENT);
    const ratiosPointer = reserve(2 * Float32Array.BYTES_PER_ELEMENT);
    const length = buildCubePoints(
      rPointer,
      gPointer,
      bPointer,
      3,
      0,
      0,
      1,
      16,
      2,
      colorsPointer,
      countsPointer,
      ratiosPointer
    );

    expect(length).toBe(2);
    expect([...new Uint8Array(memory.buffer, colorsPointer, 6)]).toEqual([32, 0, 0, 0, 16, 0]);
    expect([...new Uint32Array(memory.buffer, countsPointer, 2)]).toEqual([2, 1]);
    const ratios = new Float32Array(memory.buffer, ratiosPointer, 2);
    expect(ratios[0]).toBeCloseTo(2 / 3, 6);
    expect(ratios[1]).toBeCloseTo(1 / 3, 6);
  } finally {
    for (const { pointer, length } of allocations) {
      deallocate(pointer, length);
    }
  }
});
