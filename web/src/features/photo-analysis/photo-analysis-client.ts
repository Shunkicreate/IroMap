"use client";

import {
  analyzePhoto,
  buildDerivedPhotoAnalysis,
  type DerivedPhotoAnalysis,
  type PhotoAnalysisResult,
  type TargetSelectionState,
} from "@/domain/photo-analysis/photo-analysis";
import type {
  AnalysisWorkerRequest,
  AnalysisWorkerResponse,
} from "@/features/photo-analysis/photo-analysis-worker-contract";

export type ReadFileAsImageDataResult = {
  imageData: ImageData;
  decodeMs: number;
  downscaleMs: number;
  width: number;
  height: number;
  analysisWidth: number;
  analysisHeight: number;
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
    samplingDensityPercent?: number
  ): Promise<AnalyzePhotoTaskResult> {
    const worker = this.ensureWorker();
    const analysisId = this.nextAnalysisId();
    if (!worker) {
      return {
        analysisId,
        result: analyzePhoto(imageData, samplingDensityPercent),
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
          kind: "analyze-photo",
          requestId,
          analysisId,
          imageData,
          samplingDensityPercent,
        };
        worker.postMessage(message);
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    }).catch(() => {
      return {
        analysisId,
        result: analyzePhoto(imageData, samplingDensityPercent),
      };
    });
  }

  async buildDerivedAnalysis({
    analysisId,
    result,
    selectionState,
  }: {
    analysisId: string;
    result: PhotoAnalysisResult;
    selectionState: TargetSelectionState | null | undefined;
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
          kind: "build-derived-analysis",
          requestId,
          analysisId,
          selectionState,
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
}

const client = new PhotoAnalysisWorkerClient();
const maxAnalysisEdge = 2048;

const getAnalysisDimensions = (
  width: number,
  height: number
): { width: number; height: number } => {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxAnalysisEdge) {
    return { width, height };
  }

  const scale = maxAnalysisEdge / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

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
  try {
    const decodeStartedAt = performance.now();
    const sourceBitmap = await createImageBitmap(file);
    const decodeMs = performance.now() - decodeStartedAt;
    try {
      const { width, height } = sourceBitmap;
      const analysisSize = getAnalysisDimensions(width, height);
      const downscaleStartedAt = performance.now();
      const analysisBitmap =
        analysisSize.width === width && analysisSize.height === height
          ? sourceBitmap
          : await createImageBitmap(sourceBitmap, {
              resizeWidth: analysisSize.width,
              resizeHeight: analysisSize.height,
              resizeQuality: "high",
            });

      const imageData = drawSourceToImageData(
        analysisSize.width,
        analysisSize.height,
        (context) => {
          context.drawImage(analysisBitmap, 0, 0);
        }
      );
      const downscaleMs = performance.now() - downscaleStartedAt;

      if (analysisBitmap !== sourceBitmap) {
        analysisBitmap.close();
      }

      return {
        imageData,
        decodeMs,
        downscaleMs,
        width,
        height,
        analysisWidth: analysisSize.width,
        analysisHeight: analysisSize.height,
      };
    } finally {
      sourceBitmap.close();
    }
  } catch {
    const objectUrl = URL.createObjectURL(file);
    try {
      const decodeStartedAt = performance.now();
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const node = new window.Image();
        node.onload = () => resolve(node);
        node.onerror = () => reject(new Error("image-load-failed"));
        node.src = objectUrl;
      });
      const decodeMs = performance.now() - decodeStartedAt;
      const analysisSize = getAnalysisDimensions(image.naturalWidth, image.naturalHeight);
      const downscaleStartedAt = performance.now();
      const imageData = drawSourceToImageData(
        analysisSize.width,
        analysisSize.height,
        (context) => {
          context.drawImage(image, 0, 0, analysisSize.width, analysisSize.height);
        }
      );

      return {
        imageData,
        decodeMs,
        downscaleMs: performance.now() - downscaleStartedAt,
        width: image.naturalWidth,
        height: image.naturalHeight,
        analysisWidth: analysisSize.width,
        analysisHeight: analysisSize.height,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
};

export const analyzePhotoInWorker = (
  imageData: ImageData,
  samplingDensityPercent?: number
): Promise<AnalyzePhotoTaskResult> => {
  return client.analyzePhoto(imageData, samplingDensityPercent);
};

export const buildDerivedAnalysisInWorker = ({
  analysisId,
  result,
  selectionState,
}: {
  analysisId: string;
  result: PhotoAnalysisResult;
  selectionState: TargetSelectionState | null | undefined;
}): Promise<DerivedPhotoAnalysis> => {
  return client.buildDerivedAnalysis({ analysisId, result, selectionState });
};
