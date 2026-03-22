"use client";

import { analyzePhoto, type PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";

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

export const readFileAsImageData = async (file: File): Promise<ImageData> => {
  try {
    const imageBitmap = await createImageBitmap(file);
    try {
      return drawSourceToImageData(imageBitmap.width, imageBitmap.height, (context) => {
        context.drawImage(imageBitmap, 0, 0);
      });
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

      return drawSourceToImageData(image.naturalWidth, image.naturalHeight, (context) => {
        context.drawImage(image, 0, 0);
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
};

export const analyzePhotoInWorker = (imageData: ImageData): Promise<PhotoAnalysisResult> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      resolve(analyzePhoto(imageData));
      return;
    }

    let worker: Worker;

    try {
      worker = new Worker(new URL("./photo-analysis-worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      resolve(analyzePhoto(imageData));
      return;
    }

    worker.onmessage = (event: MessageEvent<{ result?: PhotoAnalysisResult; error?: string }>) => {
      const { result, error } = event.data;
      worker.terminate();

      if (error || !result) {
        resolve(analyzePhoto(imageData));
        return;
      }
      resolve(result);
    };

    worker.onerror = () => {
      worker.terminate();
      resolve(analyzePhoto(imageData));
    };

    try {
      worker.postMessage({ imageData });
    } catch {
      worker.terminate();
      resolve(analyzePhoto(imageData));
    }
  });
};
