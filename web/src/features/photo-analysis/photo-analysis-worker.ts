/// <reference lib="webworker" />

import {
  buildDerivedPhotoAnalysisFromHandle,
  createPhotoAnalysisHandle,
  type PhotoAnalysisHandle,
} from "@/domain/photo-analysis/photo-analysis";
import type {
  AnalysisWorkerRequest,
  AnalysisWorkerResponse,
} from "@/features/photo-analysis/photo-analysis-worker-contract";

const analyses = new Map<string, PhotoAnalysisHandle>();

const post = (message: AnalysisWorkerResponse): void => {
  self.postMessage(message);
};

self.onmessage = (event: MessageEvent<AnalysisWorkerRequest>) => {
  const message = event.data;

  if (message.kind === "analyze-photo") {
    try {
      const handle = createPhotoAnalysisHandle({ imageData: message.imageData });
      analyses.set(message.analysisId, handle);
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

  const handle = analyses.get(message.analysisId);
  if (!handle) {
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
      handle,
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
