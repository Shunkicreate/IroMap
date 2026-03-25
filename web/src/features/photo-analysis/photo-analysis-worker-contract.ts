import type {
  DerivedPhotoAnalysis,
  PhotoAnalysisResult,
  TargetSelectionState,
} from "@/domain/photo-analysis/photo-analysis";

export type AnalyzePhotoWorkerRequest = {
  kind: "analyze-photo";
  requestId: number;
  analysisId: string;
  imageData: ImageData;
};

export type BuildDerivedAnalysisWorkerRequest = {
  kind: "build-derived-analysis";
  requestId: number;
  analysisId: string;
  selectionState: TargetSelectionState | null | undefined;
};

export type AnalysisWorkerRequest = AnalyzePhotoWorkerRequest | BuildDerivedAnalysisWorkerRequest;

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

export type AnalysisWorkerErrorResponse = {
  kind: "error";
  requestId: number;
  analysisId: string;
  error: "photo-analysis-failed" | "derived-analysis-failed" | "analysis-not-found";
};

export type AnalysisWorkerResponse =
  | AnalyzePhotoWorkerSuccessResponse
  | BuildDerivedAnalysisWorkerSuccessResponse
  | AnalysisWorkerErrorResponse;
