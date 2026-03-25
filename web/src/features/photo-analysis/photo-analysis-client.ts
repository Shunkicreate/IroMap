"use client";

import {
  analyzePhoto,
  buildDerivedPhotoAnalysis,
  normalizeSelectionToRoi,
  type DerivedPhotoAnalysis,
  type PhotoAnalysisResult,
  type SamplingPolicy,
  type SelectionRefinementResult,
  type TargetSelectionState,
} from "@/domain/photo-analysis/photo-analysis";
import type {
  AnalysisWorkerRequest,
  AnalysisWorkerResponse,
} from "@/features/photo-analysis/photo-analysis-worker-contract";

export type ReadFileAsImageDataResult = {
  imageData: ImageData;
  decodeMs: number;
};

export type AnalyzePhotoTaskResult = {
  analysisId: string;
  result: PhotoAnalysisResult;
};

type PendingTask =
  | {
      kind: "analyze-photo";
      resolve: (value: AnalyzePhotoTaskResult) => void;
      reject: (reason?: unknown) => void;
    }
  | {
      kind: "build-derived-analysis";
      resolve: (value: DerivedPhotoAnalysis) => void;
      reject: (reason?: unknown) => void;
    }
  | {
      kind: "refine-roi";
      resolve: (value: SelectionRefinementResult) => void;
      reject: (reason?: unknown) => void;
    };

class PhotoAnalysisWorkerClient {
  private worker: Worker | null = null;

  private requestId = 0;

  private analysisId = 0;

  private pending = new Map<number, PendingTask>();

  private ensureWorker(): Worker | null {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      return null;
    }
    if (this.worker) {
      return this.worker;
    }

    try {
      this.worker = new Worker(new URL("./photo-analysis-worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (event: MessageEvent<AnalysisWorkerResponse>) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = () => {
        this.rejectPending(new Error("photo-analysis-worker-error"));
        this.worker?.terminate();
        this.worker = null;
      };
      return this.worker;
    } catch {
      this.worker = null;
      return null;
    }
  }

  private handleMessage(message: AnalysisWorkerResponse): void {
    const task = this.pending.get(message.requestId);
    if (!task) {
      return;
    }
    this.pending.delete(message.requestId);

    if (message.kind === "error") {
      task.reject(new Error(message.error));
      return;
    }

    if (task.kind === "analyze-photo" && "result" in message.payload) {
      task.resolve({
        analysisId: message.analysisId,
        result: message.payload.result,
      });
      return;
    }

    if (task.kind === "build-derived-analysis" && "derived" in message.payload) {
      task.resolve(message.payload.derived);
      return;
    }

    if (task.kind === "refine-roi" && "refinement" in message.payload) {
      task.resolve(message.payload.refinement);
      return;
    }

    task.reject(new Error("photo-analysis-worker-response-mismatch"));
  }

  private rejectPending(error: Error): void {
    for (const task of this.pending.values()) {
      task.reject(error);
    }
    this.pending.clear();
  }

  private nextRequestId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  nextAnalysisId(): string {
    this.analysisId += 1;
    return `analysis-${this.analysisId}`;
  }

  async analyzePhoto(
    imageData: ImageData,
    samplingPolicy: SamplingPolicy = "balanced"
  ): Promise<AnalyzePhotoTaskResult> {
    const worker = this.ensureWorker();
    const analysisId = this.nextAnalysisId();
    if (!worker) {
      return {
        analysisId,
        result: analyzePhoto(imageData, { samplingPolicy }),
      };
    }

    const requestId = this.nextRequestId();
    return new Promise<AnalyzePhotoTaskResult>((resolve, reject) => {
      this.pending.set(requestId, {
        kind: "analyze-photo",
        resolve,
        reject,
      });

      try {
        const message: AnalysisWorkerRequest = {
          kind: "analyze-base",
          requestId,
          analysisId,
          imageData,
          samplingPolicy,
        };
        worker.postMessage(message);
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    }).catch(() => {
      return {
        analysisId,
        result: analyzePhoto(imageData, { samplingPolicy }),
      };
    });
  }

  async buildDerivedAnalysis({
    analysisId,
    result,
    selectionState,
    samplingPolicy = "balanced",
  }: {
    analysisId: string;
    result: PhotoAnalysisResult;
    selectionState: TargetSelectionState | null | undefined;
    samplingPolicy?: SamplingPolicy;
  }): Promise<DerivedPhotoAnalysis> {
    const worker = this.ensureWorker();
    if (!worker) {
      return buildDerivedPhotoAnalysis({ result, selectionState });
    }

    const requestId = this.nextRequestId();
    return new Promise<DerivedPhotoAnalysis>((resolve, reject) => {
      this.pending.set(requestId, {
        kind: "build-derived-analysis",
        resolve,
        reject,
      });

      try {
        const message: AnalysisWorkerRequest = {
          kind: "compute-derived",
          requestId,
          analysisId,
          selectionState,
          samplingPolicy,
        };
        worker.postMessage(message);
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    }).catch(() => {
      return buildDerivedPhotoAnalysis({ result, selectionState });
    });
  }

  async refineSelectionRegion({
    analysisId,
    result,
    selectionState,
    samplingPolicy = "detail",
  }: {
    analysisId: string;
    result: PhotoAnalysisResult;
    selectionState: TargetSelectionState | null | undefined;
    samplingPolicy?: SamplingPolicy;
  }): Promise<SelectionRefinementResult | null> {
    const roiBounds = normalizeSelectionToRoi({
      width: result.width,
      height: result.height,
      selectionState,
    });
    if (!roiBounds) {
      return null;
    }

    const worker = this.ensureWorker();
    if (!worker) {
      return null;
    }

    const requestId = this.nextRequestId();
    return new Promise<SelectionRefinementResult>((resolve, reject) => {
      this.pending.set(requestId, {
        kind: "refine-roi",
        resolve,
        reject,
      });

      try {
        const message: AnalysisWorkerRequest = {
          kind: "refine-roi",
          requestId,
          analysisId,
          roiBounds,
          samplingPolicy,
        };
        worker.postMessage(message);
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    }).catch(() => null);
  }
}

const client = new PhotoAnalysisWorkerClient();

const drawSourceToImageData = (
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void
): ImageData => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2d context unavailable");
  }

  draw(context);
  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const readFileAsImageData = async (file: File): Promise<ReadFileAsImageDataResult> => {
  const startAt = performance.now();

  try {
    const imageBitmap = await createImageBitmap(file);
    try {
      return {
        imageData: drawSourceToImageData(imageBitmap.width, imageBitmap.height, (context) => {
          context.drawImage(imageBitmap, 0, 0);
        }),
        decodeMs: performance.now() - startAt,
      };
    } finally {
      imageBitmap.close();
    }
  } catch {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const node = new window.Image();
        node.onload = () => resolve(node);
        node.onerror = () => reject(new Error("image-load-failed"));
        node.src = objectUrl;
      });

      return {
        imageData: drawSourceToImageData(image.naturalWidth, image.naturalHeight, (context) => {
          context.drawImage(image, 0, 0);
        }),
        decodeMs: performance.now() - startAt,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
};

export const analyzePhotoInWorker = (
  imageData: ImageData,
  samplingPolicy: SamplingPolicy = "balanced"
): Promise<AnalyzePhotoTaskResult> => {
  return client.analyzePhoto(imageData, samplingPolicy);
};

export const buildDerivedAnalysisInWorker = ({
  analysisId,
  result,
  selectionState,
  samplingPolicy,
}: {
  analysisId: string;
  result: PhotoAnalysisResult;
  selectionState: TargetSelectionState | null | undefined;
  samplingPolicy?: SamplingPolicy;
}): Promise<DerivedPhotoAnalysis> => {
  return client.buildDerivedAnalysis({ analysisId, result, selectionState, samplingPolicy });
};

export const refineSelectionRegionInWorker = ({
  analysisId,
  result,
  selectionState,
  samplingPolicy,
}: {
  analysisId: string;
  result: PhotoAnalysisResult;
  selectionState: TargetSelectionState | null | undefined;
  samplingPolicy?: SamplingPolicy;
}): Promise<SelectionRefinementResult | null> => {
  return client.refineSelectionRegion({ analysisId, result, selectionState, samplingPolicy });
};
