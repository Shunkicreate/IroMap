"use client";

import { useMemo, useState } from "react";
import { analyzePhoto, type PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { rgbToHex } from "@/domain/color/color-format";
import { colorChannelLevels } from "@/domain/color/color-constants";

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
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2d context unavailable");
  }

  context.drawImage(imageBitmap, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
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
      setError("Failed to decode image or compute analysis");
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Photo Analysis MVP</h2>
        <p>FR-1 / FR-2 / FR-3 / FR-4</p>
      </div>

      <label className="fileInput">
        Upload image
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      {isAnalyzing ? <p className="muted">Analyzing...</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      {analysis ? (
        <div className="analysisGrid">
          <article>
            <h3>Lab a-b scatter</h3>
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
            <h3>Hue histogram</h3>
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
            <h3>Saturation histogram</h3>
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
            <h3>Color area ratio</h3>
            <ul className="areaList">
              {analysis.result.colorAreas.map((area) => (
                <li key={area.label}>
                  <span
                    className="swatch"
                    style={{
                      backgroundColor: `rgb(${area.rgb.r}, ${area.rgb.g}, ${area.rgb.b})`,
                    }}
                  />
                  <span>{area.label}</span>
                  <strong>{area.ratio.toFixed(1)}%</strong>
                </li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}

      {analysis ? (
        <p className="muted">
          file={analysis.fileName} | sampled={analysis.result.sampledPixels} | elapsed=
          {analysis.result.elapsedMs.toFixed(fileSummaryPrecision)}ms
        </p>
      ) : null}
    </section>
  );
}
