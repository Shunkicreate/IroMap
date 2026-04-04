/// <reference lib="webworker" />

import { createPhotoAnalysisHandle } from "@/domain/photo-analysis/base/photo-analysis-base";
import { buildDerivedPhotoAnalysisFromHandle } from "@/domain/photo-analysis/derived/photo-analysis-derived";
import type { PhotoAnalysisHandle } from "@/domain/photo-analysis/shared/photo-analysis-types";
import type {
  AnalysisWorkerRequest,
  AnalysisWorkerResponse,
} from "@/features/photo-analysis/photo-analysis-worker-contract";

let currentAnalysisId: string | null = null;
let currentHandle: PhotoAnalysisHandle | null = null;

const post = (message: AnalysisWorkerResponse): void => {
  self.postMessage(message);
};

self.onmessage = (event: MessageEvent<AnalysisWorkerRequest>) => {
  const message = event.data;

  if (message.kind === "analyze-photo") {
    try {
      const handle = createPhotoAnalysisHandle({ imageData: message.imageData });
      currentAnalysisId = message.analysisId;
      currentHandle = handle;
      post({
        kind: "success",
        requestId: message.requestId,
        analysisId: message.analysisId,
        payload: {
          result: handle.result,
        },
      });
    } catch {
      post({
        kind: "error",
        requestId: message.requestId,
        analysisId: message.analysisId,
        error: "photo-analysis-failed",
      });
    }
    return;
  }

  if (currentAnalysisId !== message.analysisId || !currentHandle) {
    post({
      kind: "error",
      requestId: message.requestId,
      analysisId: message.analysisId,
      error: "analysis-not-found",
    });
    return;
  }

  try {
    const derived = buildDerivedPhotoAnalysisFromHandle({
      handle: currentHandle,
      selectionState: message.selectionState,
    });
    post({
      kind: "success",
      requestId: message.requestId,
      analysisId: message.analysisId,
      payload: {
        derived,
      },
    });
  } catch {
    post({
      kind: "error",
      requestId: message.requestId,
      analysisId: message.analysisId,
      error: "derived-analysis-failed",
    });
  }
};

export {};
