"use client";

import { useMemo } from "react";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { PanelHeader } from "@/components/workbench/panel-header";
import { analyzePhoto, type PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { rgbToHex } from "@/domain/color/color-format";
import { colorChannelLevels } from "@/domain/color/color-constants";
import { GraphFrame } from "@/components/graph/graph-frame";
import { t } from "@/i18n/translate";

export type AnalysisState = {
  fileName: string;
  result: PhotoAnalysisResult;
} | null;

const maxScatterRange = colorChannelLevels / 2;
const scatterViewboxSize = 100;
const histogramHeightPercent = 100;
const histogramMinHeightPercent = 2;
const pointRadius = 0.7;
const pointOpacity = 0.8;
const fileSummaryPrecision = 1;
const histogramTooltipPrecision = 2;
const ratioFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

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

const readFileViaImageElement = async (file: File): Promise<ImageData> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("image element decode failed"));
      nextImage.src = objectUrl;
    });

    return drawSourceToImageData(image.naturalWidth, image.naturalHeight, (context) => {
      context.drawImage(image, 0, 0);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const readFileAsImageData = async (file: File): Promise<ImageData> => {
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
    return readFileViaImageElement(file);
  }
};

const toScatterPosition = (value: number): number => {
  return ((value + maxScatterRange) / (maxScatterRange * 2)) * scatterViewboxSize;
};

const analyzePhotoInWorker = (imageData: ImageData): Promise<PhotoAnalysisResult> => {
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

export const analyzePhotoFile = async (file: File): Promise<PhotoAnalysisResult> => {
  const imageData = await readFileAsImageData(file);
  return analyzePhotoInWorker(imageData);
};

const clipboardFileName = "clipboard-image.png";

type PhotoAnalysisPanelProps = {
  analysis: AnalysisState;
  currentFileName: string;
  isAnalyzing: boolean;
  error: string;
  statusMessage: string;
  onImageSelected: (file: File) => Promise<void>;
  onPasteFeedback: (message: string) => void;
};

export function PhotoAnalysisPanel(props: PhotoAnalysisPanelProps) {
  const { analysis, currentFileName, error } = props;

  const maxHueCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.hueHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  const maxSaturationCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.saturationHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  const handlePaste = async (event: React.ClipboardEvent<HTMLElement>): Promise<void> => {
    const items = Array.from(event.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
    const file = imageItem?.getAsFile();

    if (!file) {
      props.onPasteFeedback(t("photoPasteNoImage"));
      return;
    }

    event.preventDefault();

    const pastedFile = new File([file], file.name || clipboardFileName, {
      type: file.type || "image/png",
      lastModified: Date.now(),
    });

    await props.onImageSelected(pastedFile);
    props.onPasteFeedback(t("photoPasteApplied"));
  };

  return (
    <section className="panel">
      <PanelHeader titleKey="panelPhotoAnalysis" requirementsKey="panelPhotoAnalysisRequirements" />

      <button
        type="button"
        className="photoPasteZone"
        onPaste={handlePaste}
        aria-label={t("photoPasteZoneLabel")}
      >
        <strong>{t("photoPasteZoneTitle")}</strong>
        <p>{t("photoPasteZoneHint")}</p>
      </button>

      {props.isAnalyzing ? <p className="muted">{t("photoAnalyzing")}</p> : null}
      {props.statusMessage ? (
        <p className="muted photoPasteStatus" aria-live="polite">
          {props.statusMessage}
        </p>
      ) : null}
      {error ? <p className="errorText">{error}</p> : null}
      {!analysis && currentFileName && !props.isAnalyzing && !error ? (
        <p className="muted">{t("photoUploadSelected", { fileName: currentFileName })}</p>
      ) : null}

      {analysis ? (
        <div className="analysisGrid">
          <article>
            <h3>{t("photoLabScatter")}</h3>
            <GraphFrame
              xLabel={t("graphAxisLabA")}
              yLabel={t("graphAxisLabB")}
              className="analysisGraphFrame"
            >
              <svg
                viewBox={`0 0 ${scatterViewboxSize} ${scatterViewboxSize}`}
                className="scatterPlot"
                role="img"
              >
                <rect
                  x="0"
                  y="0"
                  width={scatterViewboxSize}
                  height={scatterViewboxSize}
                  fill="#0f172a"
                />
                {analysis.result.scatter.map((point, index) => (
                  <circle
                    key={`${index}-${point.x}-${point.y}`}
                    cx={toScatterPosition(point.x)}
                    cy={scatterViewboxSize - toScatterPosition(point.y)}
                    r={pointRadius}
                    fill={rgbToHex(point.color)}
                    opacity={pointOpacity}
                  />
                ))}
              </svg>
            </GraphFrame>
          </article>

          <article>
            <h3>{t("photoHueHistogram")}</h3>
            <GraphFrame
              xLabel={t("graphAxisHue")}
              yLabel={t("graphAxisCount")}
              className="analysisGraphFrame"
            >
              <div className="histogramBars">
                {analysis.result.hueHistogram.map((bin) => {
                  const height = Math.max(
                    histogramMinHeightPercent,
                    (bin.count / maxHueCount) * histogramHeightPercent
                  );
                  return (
                    <span
                      key={`${bin.start}-${bin.end}`}
                      style={{ height: `${height}%` }}
                      title={`${Math.round(bin.start)}-${Math.round(bin.end)}: ${bin.count}`}
                    />
                  );
                })}
              </div>
            </GraphFrame>
          </article>

          <article>
            <h3>{t("photoSaturationHistogram")}</h3>
            <GraphFrame
              xLabel={t("graphAxisSaturation")}
              yLabel={t("graphAxisCount")}
              className="analysisGraphFrame"
            >
              <div className="histogramBars saturationBars">
                {analysis.result.saturationHistogram.map((bin) => {
                  const height = Math.max(
                    histogramMinHeightPercent,
                    (bin.count / maxSaturationCount) * histogramHeightPercent
                  );
                  return (
                    <span
                      key={`${bin.start}-${bin.end}`}
                      style={{ height: `${height}%` }}
                      title={`${bin.start.toFixed(histogramTooltipPrecision)}-${bin.end.toFixed(
                        histogramTooltipPrecision
                      )}: ${bin.count}`}
                    />
                  );
                })}
              </div>
            </GraphFrame>
          </article>

          <article>
            <h3>{t("photoColorAreaRatio")}</h3>
            <ul className="areaList">
              {analysis.result.colorAreas.map((area) => (
                <li key={area.label}>
                  <ColorSwatch color={area.rgb} />
                  <span>{area.label === "others" ? t("photoOthers") : area.label}</span>
                  <strong>{ratioFormatter.format(area.ratio / 100)}</strong>
                </li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}

      {analysis ? (
        <p className="muted">
          {t("photoSummary", {
            fileName: analysis.fileName,
            sampledPixels: analysis.result.sampledPixels,
            elapsedMs: analysis.result.elapsedMs.toFixed(fileSummaryPrecision),
          })}
        </p>
      ) : null}
    </section>
  );
}
