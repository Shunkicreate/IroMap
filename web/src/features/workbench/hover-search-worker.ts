/// <reference lib="webworker" />

import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { findNearestSliceHoverColor } from "@/features/workbench/hover-search";
import type {
  HoverSearchWorkerRequest,
  HoverSearchWorkerResponse,
} from "@/features/workbench/hover-search-worker-contract";
import {
  buildSampleBuckets,
  findNearestSampleByColor,
  findNearestSampleByCoordinate,
} from "@/features/workbench/workbench-shared";

type ActiveHoverSearchWorkerRequest = Exclude<
  HoverSearchWorkerRequest,
  { kind: "register-analysis" } | { kind: "unregister-analysis" }
>;

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

  const activeRequest: ActiveHoverSearchWorkerRequest = message;
  const analysis = analyses.get(activeRequest.analysisId);
  if (!analysis) {
    post({
      kind: "error",
      requestId: activeRequest.requestId,
      analysisId: activeRequest.analysisId,
      error: "analysis-not-found",
    });
    return;
  }

  try {
    if (activeRequest.kind === "preview-hover") {
      post({
        kind: "preview-hover-result",
        requestId: activeRequest.requestId,
        analysisId: activeRequest.analysisId,
        sample: findNearestSampleByCoordinate(analysis.result, activeRequest.x, activeRequest.y),
      });
      return;
    }

    if (activeRequest.kind === "resolve-color-sample") {
      post({
        kind: "resolve-color-sample-result",
        requestId: activeRequest.requestId,
        analysisId: activeRequest.analysisId,
        sample: findNearestSampleByColor(analysis.result, analysis.buckets, activeRequest.color),
      });
      return;
    }

    if (activeRequest.kind === "slice-hover") {
      post({
        kind: "slice-hover-result",
        requestId: activeRequest.requestId,
        analysisId: activeRequest.analysisId,
        color: findNearestSliceHoverColor(
          analysis.result.samples,
          activeRequest.axis,
          activeRequest.value,
          activeRequest.x,
          activeRequest.y,
          activeRequest.maxDistanceSquared
        ),
      });
      return;
    }
  } catch {
    post({
      kind: "error",
      requestId: activeRequest.requestId,
      analysisId: activeRequest.analysisId,
      error: "hover-search-failed",
    });
  }
};

export {};
