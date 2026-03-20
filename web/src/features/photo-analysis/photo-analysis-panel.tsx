"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { GraphFrame } from "@/components/graph/graph-frame";
import { PanelHeader } from "@/components/workbench/panel-header";
import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import {
  analyzePhotoInWorker,
  readFileAsImageData,
} from "@/features/photo-analysis/photo-analysis-client";
import { PhotoAnalysisHistogramChart } from "@/features/photo-analysis/photo-analysis-histogram-chart";
import {
  getHueInsightLabel,
  getSaturationInsightLabel,
} from "@/features/photo-analysis/photo-analysis-insights";
import analysisStyles from "@/features/workbench/workbench-analysis-shared.module.css";
import previewStyles from "@/features/workbench/photo-preview-shared.module.css";
import { t } from "@/i18n/translate";

type AnalysisState = {
  fileName: string;
  result: PhotoAnalysisResult;
} | null;

type Props = {
  sourceFile: File | null;
  onStatusChange?: (message: string) => void;
  onAnalysisComplete?: (result: PhotoAnalysisResult | null) => void;
};

const fileSummaryPrecision = 1;
const histogramTooltipPrecision = 2;
const ratioFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function PhotoAnalysisPanel({ sourceFile, onStatusChange, onAnalysisComplete }: Props) {
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
        onAnalysisCompleteRef.current?.(result);

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

      <div className={analysisStyles.topRow}>
        <article className={previewStyles.previewCard}>
          <div className={previewStyles.previewHeader}>
            <h3>{t("photoPreviewTitle")}</h3>
            {sourceFile ? <p className={previewStyles.previewFileName}>{sourceFile.name}</p> : null}
          </div>
          {previewUrl ? (
            <NextImage
              src={previewUrl}
              alt={t("photoPreviewAlt", { fileName: sourceFile?.name ?? t("photoUploadLabel") })}
              className={previewStyles.previewImage}
              width={320}
              height={240}
              unoptimized
            />
          ) : (
            <div className={previewStyles.previewEmpty}>{t("photoPreviewEmpty")}</div>
          )}
        </article>

        <article className={analysisStyles.statusCard}>
          <h3>{t("photoInsightTitle")}</h3>
          {isAnalyzing ? <p className="muted">{t("photoAnalyzing")}</p> : null}
          {statusMessage ? (
            <p className={`muted ${analysisStyles.statusLine}`} aria-live="polite">
              {statusMessage}
            </p>
          ) : null}
          {error ? <p className="errorText">{error}</p> : null}
          {!sourceFile && !analysis ? <p className="muted">{t("photoUploadLabel")}</p> : null}
          <ul className={analysisStyles.insightList}>
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
          </ul>
        </article>
      </div>

      <div className={analysisStyles.analysisGrid}>
        {analysis ? (
          <>
            <article className={analysisStyles.analysisCard}>
              <h3>{t("photoHueHistogram")}</h3>
              <GraphFrame
                xLabel={t("graphAxisHue")}
                yLabel={t("graphAxisCount")}
                className={analysisStyles.analysisGraphFrame}
              >
                <PhotoAnalysisHistogramChart
                  bins={analysis.result.hueHistogram}
                  maxCount={maxHueCount}
                  gradientId="photo-hue-histogram-gradient"
                  gradientStops={[
                    { offset: "0%", color: "#1f9bd1" },
                    { offset: "100%", color: "#60d1ff" },
                  ]}
                  titleFormatter={(bin) =>
                    `${Math.round(bin.start)}-${Math.round(bin.end)}: ${bin.count}`
                  }
                />
              </GraphFrame>
            </article>

            <article className={analysisStyles.analysisCard}>
              <h3>{t("photoSaturationHistogram")}</h3>
              <GraphFrame
                xLabel={t("graphAxisSaturation")}
                yLabel={t("graphAxisCount")}
                className={analysisStyles.analysisGraphFrame}
              >
                <PhotoAnalysisHistogramChart
                  bins={analysis.result.saturationHistogram}
                  maxCount={maxSaturationCount}
                  gradientId="photo-saturation-histogram-gradient"
                  gradientStops={[
                    { offset: "0%", color: "#2bbd79" },
                    { offset: "100%", color: "#7bf0b8" },
                  ]}
                  titleFormatter={(bin) =>
                    `${bin.start.toFixed(histogramTooltipPrecision)}-${bin.end.toFixed(
                      histogramTooltipPrecision
                    )}: ${bin.count}`
                  }
                  variantClassName="saturationBars"
                />
              </GraphFrame>
            </article>

            <article className={analysisStyles.analysisCard}>
              <h3>{t("photoColorAreaRatio")}</h3>
              <ul className={`${analysisStyles.areaList} areaList`}>
                {analysis.result.colorAreas.map((area) => (
                  <li key={area.label}>
                    <ColorSwatch color={area.rgb} />
                    <span>{area.label === "others" ? t("photoOthers") : area.label}</span>
                    <strong>{ratioFormatter.format(area.ratio / 100)}</strong>
                  </li>
                ))}
              </ul>
            </article>
          </>
        ) : (
          <article className={`${analysisStyles.analysisCard} ${analysisStyles.analysisCardEmpty}`}>
            <h3>{t("photoHueHistogram")}</h3>
            <p className="muted">{t("photoPreviewEmpty")}</p>
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
