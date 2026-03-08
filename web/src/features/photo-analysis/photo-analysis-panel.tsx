"use client";

import { useMemo, useState } from "react";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { PanelHeader } from "@/components/workbench/panel-header";
import { analyzePhoto, type PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { rgbToHex } from "@/domain/color/color-format";
import { colorChannelLevels } from "@/domain/color/color-constants";
import { t } from "@/i18n/translate";

type AnalysisState = {
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

const readFileAsImageData = async (file: File): Promise<ImageData> => {
  const imageBitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2d context unavailable");
    }

    context.drawImage(imageBitmap, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    imageBitmap.close();
  }
};

const toScatterPosition = (value: number): number => {
  return ((value + maxScatterRange) / (maxScatterRange * 2)) * scatterViewboxSize;
};

export function PhotoAnalysisPanel() {
  const [analysis, setAnalysis] = useState<AnalysisState>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const maxHueCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.hueHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  const maxSaturationCount = useMemo(() => {
    return Math.max(1, ...(analysis?.result.saturationHistogram.map((bin) => bin.count) ?? [1]));
  }, [analysis]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const imageData = await readFileAsImageData(file);
      const result = analyzePhoto(imageData);
      setAnalysis({
        fileName: file.name,
        result,
      });
    } catch {
      setError(t("photoError"));
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="panel">
      <PanelHeader titleKey="panelPhotoAnalysis" requirementsKey="panelPhotoAnalysisRequirements" />

      <label className="fileInput">
        {t("photoUploadLabel")}
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      {isAnalyzing ? <p className="muted">{t("photoAnalyzing")}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      {analysis ? (
        <div className="analysisGrid">
          <article>
            <h3>{t("photoLabScatter")}</h3>
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
          </article>

          <article>
            <h3>{t("photoHueHistogram")}</h3>
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
          </article>

          <article>
            <h3>{t("photoSaturationHistogram")}</h3>
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
          </article>

          <article>
            <h3>{t("photoColorAreaRatio")}</h3>
            <ul className="areaList">
              {analysis.result.colorAreas.map((area) => (
                <li key={area.label}>
                  <ColorSwatch color={area.rgb} />
                  <span>{area.label === "others" ? t("photoOthers") : area.label}</span>
                  <strong>{area.ratio.toFixed(1)}%</strong>
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
