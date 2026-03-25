import type {
  DerivedPhotoAnalysis,
  NormalizedRoiBounds,
  PhotoAnalysisResult,
  SamplingPolicy,
  SelectionRefinementResult,
  TargetSelectionState,
} from "@/domain/photo-analysis/photo-analysis";

export type AnalyzePhotoWorkerRequest = {
  kind: "analyze-base";
  requestId: number;
  analysisId: string;
  imageData: ImageData;
  samplingPolicy?: SamplingPolicy;
};

export type BuildDerivedAnalysisWorkerRequest = {
  kind: "compute-derived";
  requestId: number;
  analysisId: string;
  selectionState: TargetSelectionState | null | undefined;
  samplingPolicy?: SamplingPolicy;
};

export type RefineRoiWorkerRequest = {
  kind: "refine-roi";
  requestId: number;
  analysisId: string;
  roiBounds: NormalizedRoiBounds;
  samplingPolicy?: SamplingPolicy;
};

export type AnalysisWorkerRequest =
  | AnalyzePhotoWorkerRequest
  | BuildDerivedAnalysisWorkerRequest
  | RefineRoiWorkerRequest;

export type AnalyzePhotoWorkerSuccessResponse = {
  kind: "success";
  requestId: number;
  analysisId: string;
  payload: {
    result: PhotoAnalysisResult;
  };
};

export type BuildDerivedAnalysisWorkerSuccessResponse = {
  kind: "success";
  requestId: number;
  analysisId: string;
  payload: {
    derived: DerivedPhotoAnalysis;
  };
};

export type RefineRoiWorkerSuccessResponse = {
  kind: "success";
  requestId: number;
  analysisId: string;
  payload: {
    refinement: SelectionRefinementResult;
  };
};

export type AnalysisWorkerErrorResponse = {
  kind: "error";
  requestId: number;
  analysisId: string;
  error:
    | "photo-analysis-failed"
    | "derived-analysis-failed"
    | "analysis-not-found"
    | "roi-refinement-failed";
};

export type AnalysisWorkerResponse =
  | AnalyzePhotoWorkerSuccessResponse
  | BuildDerivedAnalysisWorkerSuccessResponse
  | RefineRoiWorkerSuccessResponse
  | AnalysisWorkerErrorResponse;
