import type {
  CubePointKernelInput,
  CubePointKernelResult,
} from "@/domain/photo-analysis/cube-point-kernel/cube-point-kernel-types";

type JsCubePointKernelInput = CubePointKernelInput & {
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
};

const normalizeComponent = (value: number, bucketSize: number): number =>
  Math.floor(value / bucketSize) * bucketSize;

export const buildCubePointKernelResultWithJs = ({
  r,
  g,
  b,
  indexes,
  bucketSize,
  maxPoints,
}: JsCubePointKernelInput): CubePointKernelResult => {
  const bucketCounts = new Map<string, number>();
  const targetIndexes = indexes ?? Array.from({ length: r.length }, (_, index) => index);
  const total = targetIndexes.length;

  for (const index of targetIndexes) {
    const bucketR = normalizeComponent(r[index] ?? 0, bucketSize);
    const bucketG = normalizeComponent(g[index] ?? 0, bucketSize);
    const bucketB = normalizeComponent(b[index] ?? 0, bucketSize);
    const key = `${bucketR}-${bucketG}-${bucketB}`;
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  }

  const sorted = [...bucketCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, maxPoints);
  const colors = new Uint8Array(sorted.length * 3);
  const counts = new Uint32Array(sorted.length);
  const ratios = new Float32Array(sorted.length);

  sorted.forEach(([key, count], index) => {
    const [rText, gText, bText] = key.split("-");
    const offset = index * 3;
    colors[offset] = Number(rText);
    colors[offset + 1] = Number(gText);
    colors[offset + 2] = Number(bText);
    counts[index] = count;
    ratios[index] = total === 0 ? 0 : count / total;
  });

  return {
    colors,
    counts,
    ratios,
    length: sorted.length,
  };
};
