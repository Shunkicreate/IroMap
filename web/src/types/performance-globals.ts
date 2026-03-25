import type { PerformanceTraceEntry } from "@/features/photo-analysis/photo-analysis-performance";

declare global {
  interface Window {
    ["__IROMAP_PERF__"]?: {
      entries: PerformanceTraceEntry[];
    };
  }
}

export {};
