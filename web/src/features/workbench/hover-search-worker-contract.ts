import type { RgbColor, SliceAxis } from "@/domain/color/color-types";
import type { PhotoAnalysisResult, PhotoSample } from "@/domain/photo-analysis/photo-analysis";

export type RegisterHoverAnalysisRequest = {
  kind: "register-analysis";
  analysisId: string;
  result: PhotoAnalysisResult;
};

export type UnregisterHoverAnalysisRequest = {
  kind: "unregister-analysis";
  analysisId: string;
};

export type PreviewHoverRequest = {
  kind: "preview-hover";
  requestId: number;
  analysisId: string;
  x: number;
  y: number;
};

export type ResolveColorSampleRequest = {
  kind: "resolve-color-sample";
  requestId: number;
  analysisId: string;
  color: RgbColor | null;
};

export type SliceHoverRequest = {
  kind: "slice-hover";
  requestId: number;
  analysisId: string;
  axis: SliceAxis;
  value: number;
  x: number;
  y: number;
  maxDistanceSquared: number;
};

export type HoverSearchWorkerRequest =
  | RegisterHoverAnalysisRequest
  | UnregisterHoverAnalysisRequest
  | PreviewHoverRequest
  | ResolveColorSampleRequest
  | SliceHoverRequest;

export type PreviewHoverResponse = {
  kind: "preview-hover-result";
  requestId: number;
  analysisId: string;
  sample: PhotoSample | null;
};

export type ResolveColorSampleResponse = {
  kind: "resolve-color-sample-result";
  requestId: number;
  analysisId: string;
  sample: PhotoSample | null;
};

export type SliceHoverResponse = {
  kind: "slice-hover-result";
  requestId: number;
  analysisId: string;
  color: RgbColor | null;
};

export type HoverSearchWorkerErrorResponse = {
  kind: "error";
  requestId: number;
  analysisId: string;
  error: "analysis-not-found" | "hover-search-failed";
};

export type HoverSearchWorkerResponse =
  | PreviewHoverResponse
  | ResolveColorSampleResponse
  | SliceHoverResponse
  | HoverSearchWorkerErrorResponse;
