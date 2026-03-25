/// <reference lib="webworker" />

import {
  analyzePhoto,
  buildDerivedPhotoAnalysis,
  type PhotoAnalysisResult,
} from "@/domain/photo-analysis/photo-analysis";
import type {
  AnalysisWorkerRequest,
  AnalysisWorkerResponse,
} from "@/features/photo-analysis/photo-analysis-worker-contract";

const analyses = new Map<string, PhotoAnalysisResult>();

const post = (message: AnalysisWorkerResponse): void => {
  self.postMessage(message);
};

self.onmessage = (event: MessageEvent<AnalysisWorkerRequest>) => {
  const message = event.data;

  if (message.kind === "analyze-photo") {
    try {
      const result = analyzePhoto(message.imageData);
      analyses.set(message.analysisId, result);
      post({
        kind: "success",
        requestId: message.requestId,
        analysisId: message.analysisId,
        payload: {
          result,
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

  const result = analyses.get(message.analysisId);
  if (!result) {
    post({
      kind: "error",
      requestId: message.requestId,
      analysisId: message.analysisId,
      error: "analysis-not-found",
    });
    return;
  }

  try {
    const derived = buildDerivedPhotoAnalysis({
      result,
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
