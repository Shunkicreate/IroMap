"use client";

export type PerformanceTraceEntry = {
  name: string;
  startedAt: number;
  durationMs: number;
  detail?: Record<string, number | string | boolean | null | undefined>;
};

const storeEntry = (entry: PerformanceTraceEntry): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.__IROMAP_PERF__ = window.__IROMAP_PERF__ ?? { entries: [] };
  window.__IROMAP_PERF__.entries.push(entry);
};

export const recordPerformanceEntry = (
  name: string,
  startedAt: number,
  detail?: PerformanceTraceEntry["detail"]
): PerformanceTraceEntry => {
  const durationMs = performance.now() - startedAt;
  const entry = {
    name,
    startedAt,
    durationMs,
    detail,
  };

  try {
    performance.measure(name, {
      start: startedAt,
      duration: durationMs,
    });
  } catch {
    // Ignore browsers/environments that reject custom measure options.
  }

  storeEntry(entry);
  return entry;
};

export const clearPerformanceEntries = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.__IROMAP_PERF__ = { entries: [] };
};
