import { GraphFrame } from "@/components/graph/graph-frame";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { PanelHeader } from "@/components/workbench/panel-header";
import { rgbToHex } from "@/domain/color/color-format";
import { t } from "@/i18n/translate";
import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { WorkbenchHistogramChart } from "@/features/workbench/workbench-histogram-chart";
import analysisStyles from "@/features/workbench/workbench-analysis-shared.module.css";
import panelStyles from "@/features/workbench/workbench-analysis-panel.module.css";
import {
  getHueInsightLabel,
  getSaturationInsightLabel,
  ratioFormatter,
} from "@/features/workbench/workbench-shared";

const scatterViewboxSize = 100;
const maxScatterRange = 128;
const pointRadius = 0.7;
const pointOpacity = 0.8;

const toScatterPosition = (value: number): number =>
  ((value + maxScatterRange) / (maxScatterRange * 2)) * scatterViewboxSize;

type Props = {
  result: PhotoAnalysisResult | null;
  luminanceHistogram: Array<{
    metric: string;
    binIndex: number;
    start: number;
    end: number;
    count: number;
  }>;
  hueHistogram: Array<{
    metric: string;
    binIndex: number;
    start: number;
    end: number;
    count: number;
  }>;
  saturationHistogram: Array<{
    metric: string;
    binIndex: number;
    start: number;
    end: number;
    count: number;
  }>;
  onCopyHistogram: () => Promise<void>;
};

export function WorkbenchAnalysisPanel({
  result,
  luminanceHistogram,
  hueHistogram,
  saturationHistogram,
  onCopyHistogram,
}: Props) {
  return (
    <section className={`panel ${panelStyles.panel}`}>
      <PanelHeader titleKey="panelPhotoAnalysis" requirementsKey="panelPhotoAnalysisRequirements" />

      <div className={analysisStyles.topRow}>
        <article className={analysisStyles.statusCard}>
          <h3>{t("photoInsightTitle")}</h3>
          {result ? (
            <ul className={analysisStyles.insightList}>
              <li>{t("photoInsightHue", { label: getHueInsightLabel(result) })}</li>
              <li>
                {t("photoInsightSaturation", {
                  label: getSaturationInsightLabel(result),
                })}
              </li>
            </ul>
          ) : (
            <p className="muted">{t("photoPreviewEmpty")}</p>
          )}
        </article>
      </div>

      <div className={panelStyles.controls}>
        <button
          type="button"
          onClick={() => void onCopyHistogram()}
          disabled={luminanceHistogram.length === 0}
        >
          {t("workbenchHistogramCopy")}
        </button>
      </div>

      <div className={analysisStyles.analysisGrid}>
        {result ? (
          <>
            <article className={analysisStyles.analysisCard}>
              <h3>{t("photoColorAreaRatio")}</h3>
              <ul className={analysisStyles.areaList}>
                {result.colorAreas.map((area) => (
                  <li key={area.label}>
                    <ColorSwatch color={area.rgb} />
                    <span>{area.label === "others" ? t("photoOthers") : area.label}</span>
                    <strong>{ratioFormatter.format(area.ratio / 100)}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className={analysisStyles.analysisCard}>
              <h3>{t("workbenchHistogramCardTitle")}</h3>
              <GraphFrame
                xLabel={t("graphAxisLuminance")}
                yLabel={t("graphAxisCount")}
                className={analysisStyles.analysisGraphFrame}
              >
                <WorkbenchHistogramChart bins={luminanceHistogram} />
              </GraphFrame>
            </article>

            <article className={analysisStyles.analysisCard}>
              <h3>{t("photoHueHistogram")}</h3>
              <GraphFrame
                xLabel={t("graphAxisHue")}
                yLabel={t("graphAxisCount")}
                className={analysisStyles.analysisGraphFrame}
              >
                <WorkbenchHistogramChart bins={hueHistogram} />
              </GraphFrame>
            </article>

            <article className={analysisStyles.analysisCard}>
              <h3>{t("photoSaturationHistogram")}</h3>
              <GraphFrame
                xLabel={t("graphAxisSaturation")}
                yLabel={t("graphAxisCount")}
                className={analysisStyles.analysisGraphFrame}
              >
                <WorkbenchHistogramChart bins={saturationHistogram} />
              </GraphFrame>
            </article>

            <article className={analysisStyles.analysisCard}>
              <h3>{t("photoLabScatter")}</h3>
              <GraphFrame
                xLabel={t("graphAxisLabA")}
                yLabel={t("graphAxisLabB")}
                className={analysisStyles.analysisGraphFrame}
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
                  {result.samples.map((sample) => (
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
          <article className={`${analysisStyles.analysisCard} ${analysisStyles.analysisCardEmpty}`}>
            <h3>{t("photoLabScatter")}</h3>
            <p className="muted">{t("photoPreviewEmpty")}</p>
          </article>
        )}
      </div>
    </section>
  );
}
