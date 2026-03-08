/// <reference lib="webworker" />

import { analyzePhoto } from "@/domain/photo-analysis/photo-analysis";

self.onmessage = (event: MessageEvent<{ imageData: ImageData }>) => {
  try {
    const result = analyzePhoto(event.data.imageData);
    self.postMessage({ result });
  } catch {
    self.postMessage({ error: "photo-analysis-failed" });
  }
};

export {};
