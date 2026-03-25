/// <reference lib="webworker" />

import {
  buildDerivedPhotoAnalysisFromHandle,
  createPhotoAnalysisHandle,
  refineSelectionRegionFromHandle,
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

  if (message.kind === "analyze-base") {
    try {
      const handle = createPhotoAnalysisHandle({
        imageData: message.imageData,
        samplingPolicy: message.samplingPolicy,
      });
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

  if (message.kind === "compute-derived") {
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
    return;
  }

  try {
    const refinement = refineSelectionRegionFromHandle({
      handle,
      roiBounds: message.roiBounds,
      samplingPolicy: message.samplingPolicy,
    });
    post({
      kind: "success",
      requestId: message.requestId,
      analysisId: message.analysisId,
      payload: {
        refinement,
      },
    });
  } catch {
    post({
      kind: "error",
      requestId: message.requestId,
      analysisId: message.analysisId,
      error: "roi-refinement-failed",
    });
  }
};

export {};
