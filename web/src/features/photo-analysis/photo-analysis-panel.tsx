"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { GraphFrame } from "@/components/graph/graph-frame";
import { PanelHeader } from "@/components/workbench/panel-header";
import { colorChannelLevels } from "@/domain/color/color-constants";
import { rgbToHex } from "@/domain/color/color-format";
import type { RgbColor } from "@/domain/color/color-types";
import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import {
  analyzePhotoInWorker,
  readFileAsImageData,
} from "@/features/photo-analysis/photo-analysis-client";
import { recordPerformanceEntry } from "@/features/photo-analysis/photo-analysis-performance";
import { t } from "@/i18n/translate";

type AnalysisState = {
  fileName: string;
  result: PhotoAnalysisResult;
} | null;

type Props = {
  sourceFile: File | null;
  onColorInspect?: (color: RgbColor) => void;
  onStatusChange?: (message: string) => void;
  onAnalysisComplete?: (result: PhotoAnalysisResult | null) => void;
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
const ratioFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const histogramChartViewboxWidth = 100;
const histogramChartViewboxHeight = 100;

const toScatterPosition = (value: number): number => {
  return ((value + maxScatterRange) / (maxScatterRange * 2)) * scatterViewboxSize;
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
  if (result.samples.length === 0) {
    return t("photoInsightSpreadMedium");
  }

  let minA = Number.POSITIVE_INFINITY;
  let maxA = Number.NEGATIVE_INFINITY;
  let minB = Number.POSITIVE_INFINITY;
  let maxB = Number.NEGATIVE_INFINITY;

  for (const sample of result.samples) {
    minA = Math.min(minA, sample.lab.a);
    maxA = Math.max(maxA, sample.lab.a);
    minB = Math.min(minB, sample.lab.b);
    maxB = Math.max(maxB, sample.lab.b);
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

const renderHistogramChart = ({
  bins,
  maxCount,
  gradientId,
  gradientStops,
  titleFormatter,
  variantClassName = "",
}: {
  bins: PhotoAnalysisResult["hueHistogram"] | PhotoAnalysisResult["saturationHistogram"];
  maxCount: number;
  gradientId: string;
  gradientStops: { offset: string; color: string }[];
  titleFormatter: (bin: { start: number; end: number; count: number }) => string;
  variantClassName?: string;
}) => {
  const barWidth = histogramChartViewboxWidth / bins.length;

  return (
    <svg
      viewBox={`0 0 ${histogramChartViewboxWidth} ${histogramChartViewboxHeight}`}
      className={`histogramBars${variantClassName ? ` ${variantClassName}` : ""}`}
      role="img"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          {gradientStops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      {bins.map((bin, index) => {
        const height = Math.max(
          histogramMinHeightPercent,
          (bin.count / maxCount) * histogramHeightPercent
        );

        return (
          <rect
            key={`${bin.start}-${bin.end}`}
            className="histogramBar"
            x={index * barWidth}
            y={histogramChartViewboxHeight - height}
            width={Math.max(barWidth - 0.4, barWidth * 0.72)}
            height={height}
            fill={`url(#${gradientId})`}
            rx="0.5"
            ry="0.5"
          >
            <title>{titleFormatter(bin)}</title>
          </rect>
        );
      })}
    </svg>
  );
};

export function PhotoAnalysisPanel({
  sourceFile,
  onColorInspect,
  onStatusChange,
  onAnalysisComplete,
}: Props) {
  const [analysis, setAnalysis] = useState<AnalysisState>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const onStatusChangeRef = useRef(onStatusChange);
  const onAnalysisCompleteRef = useRef(onAnalysisComplete);

  const maxHueCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.hueHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  const maxSaturationCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.saturationHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onAnalysisCompleteRef.current = onAnalysisComplete;
  }, [onAnalysisComplete, onStatusChange]);

  useEffect(() => {
    if (!sourceFile) {
      setAnalysis(null);
      setError("");
      setStatusMessage("");
      setPreviewUrl("");
      onAnalysisCompleteRef.current?.(null);
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
    onAnalysisCompleteRef.current?.(null);
    onStatusChangeRef.current?.(inProgress);
    toast(inProgress);

    void (async () => {
      const startedAt = performance.now();
      try {
        const { imageData, decodeMs, downscaleMs, width, height, analysisWidth, analysisHeight } =
          await readFileAsImageData(sourceFile);
        const { result } = await analyzePhotoInWorker(imageData);
        if (isCancelled) {
          return;
        }

        setAnalysis({
          fileName: sourceFile.name,
          result,
        });
        onAnalysisCompleteRef.current?.(result);

        const success = t("photoSummary", {
          fileName: sourceFile.name,
          sampledPixels: result.sampledPixels,
          elapsedMs: result.elapsedMs.toFixed(fileSummaryPrecision),
        });
        recordPerformanceEntry("photo-analysis.total", startedAt, {
          fileName: sourceFile.name,
          decodeMs,
          downscaleMs,
          analyzeMs: result.timings.totalMs,
          sampledPixels: result.sampledPixels,
          width,
          height,
          analysisWidth,
          analysisHeight,
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
        onAnalysisCompleteRef.current?.(null);
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

  return (
    <section className="panel">
      <PanelHeader titleKey="panelPhotoAnalysis" requirementsKey="panelPhotoAnalysisRequirements" />

      <div className="photoAnalysisOverviewGrid">
        <article className="photoPreviewCard">
          <div className="photoPreviewHeader">
            <h3>{t("photoPreviewTitle")}</h3>
            {sourceFile ? <p className="photoPreviewFileName">{sourceFile.name}</p> : null}
          </div>
          {previewUrl ? (
            <NextImage
              src={previewUrl}
              alt={t("photoPreviewAlt", { fileName: sourceFile?.name ?? t("photoUploadLabel") })}
              className="photoPreviewImage"
              width={320}
              height={240}
              unoptimized
            />
          ) : (
            <div className="photoPreviewEmpty">{t("photoPreviewEmpty")}</div>
          )}
          <details className="photoMetaDetails">
            <summary>{t("photoMetaSummary")}</summary>
            {sourceFile ? (
              <p className="photoMetaFileName">
                {t("photoUploadSelected", { fileName: sourceFile.name })}
              </p>
            ) : null}
            {statusMessage ? (
              <p className="muted photoPasteStatus" aria-live="polite">
                {statusMessage}
              </p>
            ) : null}
            {isAnalyzing ? <p className="muted">{t("photoAnalyzing")}</p> : null}
            {error ? <p className="errorText">{error}</p> : null}
            {!sourceFile && !analysis ? <p className="muted">{t("photoUploadLabel")}</p> : null}
          </details>
        </article>

        <article className="photoAnalysisStatusCard">
          <h3>{t("photoInsightTitle")}</h3>
          <ul className="insightList">
            <li>
              {t("photoInsightHue", {
                label: analysis
                  ? getHueInsightLabel(analysis.result)
                  : t("photoInsightHueModerate"),
              })}
            </li>
            <li>
              {t("photoInsightSaturation", {
                label: analysis
                  ? getSaturationInsightLabel(analysis.result)
                  : t("photoInsightSatMid"),
              })}
            </li>
            <li>
              {t("photoInsightSpread", {
                label: analysis
                  ? getSpreadInsightLabel(analysis.result)
                  : t("photoInsightSpreadMedium"),
              })}
            </li>
          </ul>
        </article>
        {analysis ? (
          <>
            <article className="analysisCard analysisCardHue">
              <h3>{t("photoHueHistogram")}</h3>
              <GraphFrame
                xLabel={t("graphAxisHue")}
                yLabel={t("graphAxisCount")}
                className="analysisGraphFrame"
              >
                {renderHistogramChart({
                  bins: analysis.result.hueHistogram,
                  maxCount: maxHueCount,
                  gradientId: "photo-hue-histogram-gradient",
                  gradientStops: [
                    { offset: "0%", color: "#1f9bd1" },
                    { offset: "100%", color: "#60d1ff" },
                  ],
                  titleFormatter: (bin) =>
                    `${Math.round(bin.start)}-${Math.round(bin.end)}: ${bin.count}`,
                })}
              </GraphFrame>
            </article>

            <article className="analysisCard analysisCardSaturation">
              <h3>{t("photoSaturationHistogram")}</h3>
              <GraphFrame
                xLabel={t("graphAxisSaturation")}
                yLabel={t("graphAxisCount")}
                className="analysisGraphFrame"
              >
                {renderHistogramChart({
                  bins: analysis.result.saturationHistogram,
                  maxCount: maxSaturationCount,
                  gradientId: "photo-saturation-histogram-gradient",
                  gradientStops: [
                    { offset: "0%", color: "#2bbd79" },
                    { offset: "100%", color: "#7bf0b8" },
                  ],
                  titleFormatter: (bin) =>
                    `${bin.start.toFixed(histogramTooltipPrecision)}-${bin.end.toFixed(
                      histogramTooltipPrecision
                    )}: ${bin.count}`,
                  variantClassName: "saturationBars",
                })}
              </GraphFrame>
            </article>

            <article className="analysisCard analysisCardArea">
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

            <article className="analysisCard analysisCardScatter">
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
                  {analysis.result.samples.map((sample) => (
                    <circle
                      key={sample.sampleId}
                      cx={toScatterPosition(sample.lab.a)}
                      cy={scatterViewboxSize - toScatterPosition(sample.lab.b)}
                      r={pointRadius}
                      fill={rgbToHex(sample.color)}
                      opacity={pointOpacity}
                    />
                  ))}
                </svg>
              </GraphFrame>
            </article>
          </>
        ) : (
          <article className="analysisCard analysisCardEmpty">
            <h3>{t("photoLabScatter")}</h3>
            <p className="muted">{t("photoPreviewEmpty")}</p>
          </article>
        )}
      </div>
    </section>
  );
}
