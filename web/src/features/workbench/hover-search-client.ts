"use client";

import { type ColorSpace3d, type RgbColor, type SliceAxis } from "@/domain/color/color-types";
import { type PhotoAnalysisResult, type PhotoSample } from "@/domain/photo-analysis/photo-analysis";
import { type Rotation } from "@/features/rgb-cube/rgb-cube-projection";
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

type CachedAnalysis = {
  result: PhotoAnalysisResult;
  buckets: Map<string, PhotoSample[]>;
};

type PendingTask =
  | {
      kind: "preview-hover";
      resolve: (value: PhotoSample | null) => void;
      reject: (reason?: unknown) => void;
    }
  | {
      kind: "resolve-color-sample";
      resolve: (value: PhotoSample | null) => void;
      reject: (reason?: unknown) => void;
    }
  | {
      kind: "slice-hover";
      resolve: (value: RgbColor | null) => void;
      reject: (reason?: unknown) => void;
    }
  | {
      kind: "cube-hover";
      resolve: (value: RgbColor | null) => void;
      reject: (reason?: unknown) => void;
    };

class HoverSearchWorkerClient {
  private worker: Worker | null = null;

  private requestId = 0;

  private pending = new Map<number, PendingTask>();

  private analyses = new Map<string, CachedAnalysis>();

  private ensureWorker(): Worker | null {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      return null;
    }
    if (this.worker) {
      return this.worker;
    }

    try {
      this.worker = new Worker(new URL("./hover-search-worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (event: MessageEvent<HoverSearchWorkerResponse>) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = () => {
        this.rejectPending(new Error("hover-search-worker-error"));
        this.worker?.terminate();
        this.worker = null;
      };
      return this.worker;
    } catch {
      this.worker = null;
      return null;
    }
  }

  private handleMessage(message: HoverSearchWorkerResponse): void {
    const task = this.pending.get(message.requestId);
    if (!task) {
      return;
    }
    this.pending.delete(message.requestId);

    if (message.kind === "error") {
      task.reject(new Error(message.error));
      return;
    }

    if (task.kind === "preview-hover" && message.kind === "preview-hover-result") {
      task.resolve(message.sample);
      return;
    }
    if (task.kind === "resolve-color-sample" && message.kind === "resolve-color-sample-result") {
      task.resolve(message.sample);
      return;
    }
    if (task.kind === "slice-hover" && message.kind === "slice-hover-result") {
      task.resolve(message.color);
      return;
    }
    if (task.kind === "cube-hover" && message.kind === "cube-hover-result") {
      task.resolve(message.color);
      return;
    }

    task.reject(new Error("hover-search-worker-response-mismatch"));
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

  private getCachedAnalysis(analysisId: string): CachedAnalysis | null {
    return this.analyses.get(analysisId) ?? null;
  }

  private request<TResult>({
    kind,
    createMessage,
    fallback,
  }: {
    kind: PendingTask["kind"];
    createMessage: (requestId: number) => HoverSearchWorkerRequest;
    fallback: () => TResult;
  }): Promise<TResult> {
    const worker = this.ensureWorker();
    if (!worker) {
      return Promise.resolve(fallback());
    }

    const requestId = this.nextRequestId();
    return new Promise<TResult>((resolve, reject) => {
      this.pending.set(requestId, { kind, resolve, reject } as PendingTask);
      try {
        worker.postMessage(createMessage(requestId));
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    }).catch(() => {
      return fallback();
    });
  }

  registerAnalysis(analysisId: string, result: PhotoAnalysisResult): void {
    this.analyses.set(analysisId, {
      result,
      buckets: buildSampleBuckets(result),
    });

    const worker = this.ensureWorker();
    if (!worker) {
      return;
    }

    const message: HoverSearchWorkerRequest = {
      kind: "register-analysis",
      analysisId,
      result,
    };
    worker.postMessage(message);
  }

  unregisterAnalysis(analysisId: string): void {
    this.analyses.delete(analysisId);
    if (!this.worker) {
      return;
    }
    const message: HoverSearchWorkerRequest = {
      kind: "unregister-analysis",
      analysisId,
    };
    this.worker.postMessage(message);
  }

  findNearestPreviewSample({
    analysisId,
    x,
    y,
  }: {
    analysisId: string;
    x: number;
    y: number;
  }): Promise<PhotoSample | null> {
    return this.request({
      kind: "preview-hover",
      createMessage: (requestId) => ({
        kind: "preview-hover",
        requestId,
        analysisId,
        x,
        y,
      }),
      fallback: () => {
        const analysis = this.getCachedAnalysis(analysisId);
        return findNearestSampleByCoordinate(analysis?.result ?? null, x, y);
      },
    });
  }

  resolveColorToSample({
    analysisId,
    color,
  }: {
    analysisId: string;
    color: RgbColor | null;
  }): Promise<PhotoSample | null> {
    return this.request({
      kind: "resolve-color-sample",
      createMessage: (requestId) => ({
        kind: "resolve-color-sample",
        requestId,
        analysisId,
        color,
      }),
      fallback: () => {
        const analysis = this.getCachedAnalysis(analysisId);
        if (!analysis) {
          return null;
        }
        return findNearestSampleByColor(analysis.result, analysis.buckets, color);
      },
    });
  }

  findNearestSliceHoverColor({
    analysisId,
    axis,
    value,
    x,
    y,
    maxDistanceSquared,
  }: {
    analysisId: string;
    axis: SliceAxis;
    value: number;
    x: number;
    y: number;
    maxDistanceSquared: number;
  }): Promise<RgbColor | null> {
    return this.request({
      kind: "slice-hover",
      createMessage: (requestId) => ({
        kind: "slice-hover",
        requestId,
        analysisId,
        axis,
        value,
        x,
        y,
        maxDistanceSquared,
      }),
      fallback: () => {
        const analysis = this.getCachedAnalysis(analysisId);
        return findNearestSliceHoverColor(
          analysis?.result.samples ?? [],
          axis,
          value,
          x,
          y,
          maxDistanceSquared
        );
      },
    });
  }

  findNearestCubeHoverColor({
    analysisId,
    space,
    rotation,
    width,
    height,
    objectScale,
    x,
    y,
    maxDistanceSquared,
  }: {
    analysisId: string;
    space: ColorSpace3d;
    rotation: Rotation;
    width: number;
    height: number;
    objectScale: number;
    x: number;
    y: number;
    maxDistanceSquared: number;
  }): Promise<RgbColor | null> {
    return this.request({
      kind: "cube-hover",
      createMessage: (requestId) => ({
        kind: "cube-hover",
        requestId,
        analysisId,
        space,
        rotation,
        width,
        height,
        objectScale,
        x,
        y,
        maxDistanceSquared,
      }),
      fallback: () => {
        const analysis = this.getCachedAnalysis(analysisId);
        if (!analysis) {
          return null;
        }
        return findNearestCubeHoverColor({
          cubePoints: analysis.result.cubePoints,
          space,
          rotation,
          width,
          height,
          objectScale,
          x,
          y,
          maxDistanceSquared,
        });
      },
    });
  }
}

const client = new HoverSearchWorkerClient();

export const registerHoverSearchAnalysis = (
  analysisId: string,
  result: PhotoAnalysisResult
): void => {
  client.registerAnalysis(analysisId, result);
};

export const unregisterHoverSearchAnalysis = (analysisId: string): void => {
  client.unregisterAnalysis(analysisId);
};

export const findNearestPreviewSampleInWorker = (params: {
  analysisId: string;
  x: number;
  y: number;
}): Promise<PhotoSample | null> => {
  return client.findNearestPreviewSample(params);
};

export const resolveHoverColorToSampleInWorker = (params: {
  analysisId: string;
  color: RgbColor | null;
}): Promise<PhotoSample | null> => {
  return client.resolveColorToSample(params);
};

export const findNearestSliceHoverColorInWorker = (params: {
  analysisId: string;
  axis: SliceAxis;
  value: number;
  x: number;
  y: number;
  maxDistanceSquared: number;
}): Promise<RgbColor | null> => {
  return client.findNearestSliceHoverColor(params);
};

export const findNearestCubeHoverColorInWorker = (params: {
  analysisId: string;
  space: ColorSpace3d;
  rotation: Rotation;
  width: number;
  height: number;
  objectScale: number;
  x: number;
  y: number;
  maxDistanceSquared: number;
}): Promise<RgbColor | null> => {
  return client.findNearestCubeHoverColor(params);
};
