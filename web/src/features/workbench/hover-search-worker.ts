/// <reference lib="webworker" />

import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import {
  findNearestCubeHoverColor,
  findNearestSliceHoverColor,
} from "@/features/workbench/hover-search";
import type {
  HoverSearchWorkerRequest,
  HoverSearchWorkerResponse,
} from "@/features/workbench/hover-search-worker-contract";
import {
  buildSampleBuckets,
  findNearestSampleByColor,
  findNearestSampleByCoordinate,
} from "@/features/workbench/workbench-shared";

type RegisteredAnalysis = {
  result: PhotoAnalysisResult;
  buckets: Map<string, PhotoAnalysisResult["samples"]>;
};

const analyses = new Map<string, RegisteredAnalysis>();

const post = (message: HoverSearchWorkerResponse): void => {
  self.postMessage(message);
};

self.onmessage = (event: MessageEvent<HoverSearchWorkerRequest>) => {
  const message = event.data;

  if (message.kind === "register-analysis") {
    analyses.set(message.analysisId, {
      result: message.result,
      buckets: buildSampleBuckets(message.result),
    });
    return;
  }

  if (message.kind === "unregister-analysis") {
    analyses.delete(message.analysisId);
    return;
  }

  const analysis = analyses.get(message.analysisId);
  if (!analysis) {
    post({
      kind: "error",
      requestId: message.requestId,
      analysisId: message.analysisId,
      error: "analysis-not-found",
    });
    return;
  }

  try {
    if (message.kind === "preview-hover") {
      post({
        kind: "preview-hover-result",
        requestId: message.requestId,
        analysisId: message.analysisId,
        sample: findNearestSampleByCoordinate(analysis.result, message.x, message.y),
      });
      return;
    }

    if (message.kind === "resolve-color-sample") {
      post({
        kind: "resolve-color-sample-result",
        requestId: message.requestId,
        analysisId: message.analysisId,
        sample: findNearestSampleByColor(analysis.result, analysis.buckets, message.color),
      });
      return;
    }

    if (message.kind === "slice-hover") {
      post({
        kind: "slice-hover-result",
        requestId: message.requestId,
        analysisId: message.analysisId,
        color: findNearestSliceHoverColor(
          analysis.result.samples,
          message.axis,
          message.value,
          message.x,
          message.y,
          message.maxDistanceSquared
        ),
      });
      return;
    }

    post({
      kind: "cube-hover-result",
      requestId: message.requestId,
      analysisId: message.analysisId,
      color: findNearestCubeHoverColor({
        cubePoints: analysis.result.cubePoints,
        space: message.space,
        rotation: message.rotation,
        width: message.width,
        height: message.height,
        objectScale: message.objectScale,
        x: message.x,
        y: message.y,
        maxDistanceSquared: message.maxDistanceSquared,
      }),
    });
  } catch {
    post({
      kind: "error",
      requestId: message.requestId,
      analysisId: message.analysisId,
      error: "hover-search-failed",
    });
  }
};

export {};
