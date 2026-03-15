"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { GraphFrame } from "@/components/graph/graph-frame";
import { PanelHeader } from "@/components/workbench/panel-header";
import { colorChannelLevels } from "@/domain/color/color-constants";
import { rgbToHex } from "@/domain/color/color-format";
import type { RgbColor } from "@/domain/color/color-types";
import { analyzePhoto, type PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { t } from "@/i18n/translate";

type AnalysisState = {
  fileName: string;
  result: PhotoAnalysisResult;
} | null;

type Props = {
  sourceFile: File | null;
  onColorInspect?: (color: RgbColor) => void;
  onStatusChange?: (message: string) => void;
  onImageSelected?: (file: File | null) => void;
  onUploadChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const maxScatterRange = colorChannelLevels / 2;
const scatterViewboxSize = 100;
const histogramHeightPercent = 100;
const histogramMinHeightPercent = 2;
const pointRadius = 0.7;
const pointOpacity = 0.8;
const fileSummaryPrecision = 1;
const histogramTooltipPrecision = 2;
const hueDiverseThreshold = 8;
const hueModerateThreshold = 4;
const saturationHighThreshold = 0.55;
const saturationLowThreshold = 0.25;
const spreadWideThreshold = 48;
const spreadMediumThreshold = 24;
const clipboardFileName = "clipboard-image.png";
const topRowStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(13.75rem, 1fr))",
  alignItems: "start",
  marginBottom: "0.75rem",
};
const controlsStyle: CSSProperties = {
  minWidth: 0,
};
const previewCardStyle: CSSProperties = {
  border: "0.0625rem solid #263a57",
  borderRadius: "0.625rem",
  padding: "0.625rem",
  background: "#0a1626",
};
const previewHeaderStyle: CSSProperties = {
  marginBottom: "0.625rem",
};
const previewHeaderTextStyle: CSSProperties = {
  margin: "0.25rem 0 0",
  color: "var(--workbench-muted)",
  fontSize: "0.82rem",
  overflowWrap: "anywhere",
};
const previewSurfaceStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "4 / 3",
  borderRadius: "0.5rem",
  border: "0.0625rem solid #304766",
  background: "#08111d",
};
const previewImageStyle: CSSProperties = {
  ...previewSurfaceStyle,
  objectFit: "cover",
};
const previewEmptyStyle: CSSProperties = {
  ...previewSurfaceStyle,
  display: "grid",
  placeItems: "center",
  padding: "0.75rem",
  textAlign: "center",
  color: "var(--workbench-muted)",
  fontSize: "0.85rem",
};
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

const getHueInsightLabel = (result: PhotoAnalysisResult): string => {
  const activeBins = result.hueHistogram.filter((bin) => bin.count > 0).length;
  if (activeBins >= hueDiverseThreshold) {
    return t("photoInsightHueBalanced");
  }
  if (activeBins >= hueModerateThreshold) {
    return t("photoInsightHueModerate");
  }
  return t("photoInsightHueNarrow");
};

const getSaturationInsightLabel = (result: PhotoAnalysisResult): string => {
  const total = result.saturationHistogram.reduce((sum, bin) => sum + bin.count, 0);
  if (total === 0) {
    return t("photoInsightSatMid");
  }

  const weighted = result.saturationHistogram.reduce((sum, bin) => {
    const mid = (bin.start + bin.end) / 2;
    return sum + mid * bin.count;
  }, 0);

  const mean = weighted / total;
  if (mean >= saturationHighThreshold) {
    return t("photoInsightSatHigh");
  }
  if (mean <= saturationLowThreshold) {
    return t("photoInsightSatLow");
  }
  return t("photoInsightSatMid");
};

const getSpreadInsightLabel = (result: PhotoAnalysisResult): string => {
  if (result.scatter.length === 0) {
    return t("photoInsightSpreadMedium");
  }

  let minA = Number.POSITIVE_INFINITY;
  let maxA = Number.NEGATIVE_INFINITY;
  let minB = Number.POSITIVE_INFINITY;
  let maxB = Number.NEGATIVE_INFINITY;

  for (const point of result.scatter) {
    minA = Math.min(minA, point.x);
    maxA = Math.max(maxA, point.x);
    minB = Math.min(minB, point.y);
    maxB = Math.max(maxB, point.y);
  }

  const spread = (maxA - minA + (maxB - minB)) / 2;
  if (spread >= spreadWideThreshold) {
    return t("photoInsightSpreadWide");
  }
  if (spread >= spreadMediumThreshold) {
    return t("photoInsightSpreadMedium");
  }
  return t("photoInsightSpreadNarrow");
};

export function PhotoAnalysisPanel({
  sourceFile,
  onColorInspect,
  onStatusChange,
  onImageSelected,
  onUploadChange,
}: Props) {
  const [analysis, setAnalysis] = useState<AnalysisState>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const onStatusChangeRef = useRef(onStatusChange);

  const maxHueCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.hueHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  const maxSaturationCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.saturationHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!sourceFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(sourceFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [sourceFile]);

  useEffect(() => {
    if (!sourceFile) {
      return;
    }

    let isCancelled = false;
    const inProgress = t("photoAnalyzing");

    setIsAnalyzing(true);
    setError("");
    setStatusMessage(inProgress);
    setAnalysis(null);
    onStatusChangeRef.current?.(inProgress);
    toast(inProgress);

    void (async () => {
      try {
        const imageData = await readFileAsImageData(sourceFile);
        const result = await analyzePhotoInWorker(imageData);
        if (isCancelled) {
          return;
        }

        setAnalysis({
          fileName: sourceFile.name,
          result,
        });

        const success = t("photoSummary", {
          fileName: sourceFile.name,
          sampledPixels: result.sampledPixels,
          elapsedMs: result.elapsedMs.toFixed(fileSummaryPrecision),
        });
        setStatusMessage(success);
        onStatusChangeRef.current?.(success);
        toast.success(success);
      } catch {
        if (isCancelled) {
          return;
        }

        const failed = t("photoError");
        setError(failed);
        setAnalysis(null);
        setStatusMessage(failed);
        onStatusChangeRef.current?.(failed);
        toast.error(failed);
      } finally {
        if (!isCancelled) {
          setIsAnalyzing(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [sourceFile]);

  const handlePaste = async (event: React.ClipboardEvent<HTMLButtonElement>): Promise<void> => {
    const items = Array.from(event.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
    const file = imageItem?.getAsFile();

    if (!file) {
      const message = t("photoPasteNoImage");
      setStatusMessage(message);
      onStatusChangeRef.current?.(message);
      toast.error(message);
      return;
    }

    event.preventDefault();

    const pastedFile = new File([file], file.name || clipboardFileName, {
      type: file.type || "image/png",
      lastModified: Date.now(),
    });
    const message = t("photoPasteApplied");
    setStatusMessage(message);
    onStatusChangeRef.current?.(message);
    toast.success(message);
    onImageSelected?.(pastedFile);
  };

  return (
    <section className="panel">
      <PanelHeader titleKey="panelPhotoAnalysis" requirementsKey="panelPhotoAnalysisRequirements" />

      <div style={topRowStyle}>
        <div style={controlsStyle}>
          <div className="photoUploadCta">
            <div className="photoUploadCtaCopy">
              <strong>{t("photoUploadCtaTitle")}</strong>
              <p>{t("photoUploadCtaDescription")}</p>
              {sourceFile ? (
                <p className="photoUploadCtaStatus">
                  {t("photoUploadSelected", { fileName: sourceFile.name })}
                </p>
              ) : null}
            </div>
            <label className="photoUploadButton">
              <span>{t("photoUploadButton")}</span>
              <input
                type="file"
                accept="image/*"
                aria-label={t("photoUploadLabel")}
                className="srOnly"
                onChange={onUploadChange}
              />
            </label>
          </div>

          <button
            type="button"
            className="photoPasteZone"
            onPaste={handlePaste}
            aria-label={t("photoPasteZoneLabel")}
          >
            <strong>{t("photoPasteZoneTitle")}</strong>
            <p>{t("photoPasteZoneHint")}</p>
          </button>

          {isAnalyzing ? <p className="muted">{t("photoAnalyzing")}</p> : null}
          {statusMessage ? (
            <p className="muted photoPasteStatus" aria-live="polite">
              {statusMessage}
            </p>
          ) : null}
          {error ? <p className="errorText">{error}</p> : null}
          {!sourceFile && !analysis ? <p className="muted">{t("photoUploadLabel")}</p> : null}
        </div>

        <article style={previewCardStyle}>
          <div style={previewHeaderStyle}>
            <h3>{t("photoPreviewTitle")}</h3>
            {sourceFile ? <p style={previewHeaderTextStyle}>{sourceFile.name}</p> : null}
          </div>
          {previewUrl ? (
            <NextImage
              src={previewUrl}
              alt={t("photoPreviewAlt", { fileName: sourceFile?.name ?? t("photoUploadLabel") })}
              style={previewImageStyle}
              width={320}
              height={240}
              unoptimized
            />
          ) : (
            <div style={previewEmptyStyle}>{t("photoPreviewEmpty")}</div>
          )}
        </article>
      </div>

      <div className="analysisGrid">
        {analysis ? (
          <>
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
                    {area.label !== "others" ? (
                      <button
                        type="button"
                        onClick={() => onColorInspect?.(area.rgb)}
                        className="areaInspectButton"
                      >
                        {t("photoInspectOnCube")}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3>{t("photoInsightTitle")}</h3>
              <ul className="insightList">
                <li>{t("photoInsightHue", { label: getHueInsightLabel(analysis.result) })}</li>
                <li>
                  {t("photoInsightSaturation", {
                    label: getSaturationInsightLabel(analysis.result),
                  })}
                </li>
                <li>
                  {t("photoInsightSpread", { label: getSpreadInsightLabel(analysis.result) })}
                </li>
              </ul>
            </article>
          </>
        ) : (
          <article>
            <h3>{t("photoInsightTitle")}</h3>
            <ul className="insightList">
              <li>{t("photoInsightHue", { label: t("photoInsightHueModerate") })}</li>
              <li>{t("photoInsightSaturation", { label: t("photoInsightSatMid") })}</li>
              <li>{t("photoInsightSpread", { label: t("photoInsightSpreadMedium") })}</li>
            </ul>
          </article>
        )}
      </div>

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
