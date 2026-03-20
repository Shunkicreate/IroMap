import { GraphFrame } from "@/components/graph/graph-frame";
import { InfoTooltip } from "@/components/workbench/info-tooltip";
import { PanelHeader } from "@/components/workbench/panel-header";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { t } from "@/i18n/translate";
import type {
  ExportFormat,
  PhotoAnalysisResult,
  WorkbenchMetricRow,
} from "@/domain/photo-analysis/photo-analysis";
import { WorkbenchHistogramChart } from "@/features/workbench/workbench-histogram-chart";
import analysisStyles from "@/features/workbench/workbench-analysis-shared.module.css";
import controlStyles from "@/features/workbench/workbench-controls.module.css";
import panelStyles from "@/features/workbench/workbench-analysis-panel.module.css";
import {
  formatMetricValue,
  getHueInsightLabel,
  getSaturationInsightLabel,
  isVisibleMetricRow,
  ratioFormatter,
} from "@/features/workbench/workbench-shared";

type Props = {
  result: PhotoAnalysisResult | null;
  copyFormat: ExportFormat;
  metricRows: WorkbenchMetricRow[];
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
  onCopyFormatChange: (format: ExportFormat) => void;
  onCopyMetricTable: () => Promise<void>;
  onCopyHistogram: () => Promise<void>;
};

export function WorkbenchAnalysisPanel({
  result,
  copyFormat,
  metricRows,
  luminanceHistogram,
  hueHistogram,
  saturationHistogram,
  onCopyFormatChange,
  onCopyMetricTable,
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
        <label>
          {t("workbenchCopyFormatWorkbenchLabel")}
          <select
            value={copyFormat}
            onChange={(event) => onCopyFormatChange(event.target.value as ExportFormat)}
          >
            <option value="markdown">{t("workbenchExportMarkdown")}</option>
            <option value="csv">{t("workbenchExportCsv")}</option>
            <option value="tsv">{t("workbenchExportTsv")}</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void onCopyMetricTable()}
          disabled={metricRows.length === 0}
        >
          {t("workbenchTableCopy")}
        </button>
        <button
          type="button"
          onClick={() => void onCopyHistogram()}
          disabled={luminanceHistogram.length === 0}
        >
          {t("workbenchHistogramCopy")}
        </button>
      </div>

      <div className={panelStyles.grid}>
        <article className={analysisStyles.analysisCard}>
          <h3>{t("workbenchMetricsTableTitle")}</h3>
          <div className={panelStyles.metricsTableWrap}>
            <table className={panelStyles.metricsTable}>
              <thead>
                <tr>
                  <th>{t("workbenchTableGroup")}</th>
                  <th>{t("workbenchTableMetric")}</th>
                  <th>{t("workbenchTableValue")}</th>
                  <th>{t("workbenchTableDescription")}</th>
                </tr>
              </thead>
              <tbody>
                {metricRows.filter(isVisibleMetricRow).map((row) => (
                  <tr key={row.key}>
                    <td>{row.group}</td>
                    <td>
                      <span className={controlStyles.metricLabelWithInfo}>
                        <span>{row.label}</span>
                        <InfoTooltip
                          label={t("workbenchMetricHelpLabel", { metric: row.label })}
                          content={row.tooltip ?? row.description}
                        />
                      </span>
                    </td>
                    <td>{formatMetricValue(row, row.value)}</td>
                    <td>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={analysisStyles.analysisCard}>
          <h3>{t("photoColorAreaRatio")}</h3>
          {result ? (
            <ul className={analysisStyles.areaList}>
              {result.colorAreas.map((area) => (
                <li key={area.label}>
                  <ColorSwatch color={area.rgb} />
                  <span>{area.label === "others" ? t("photoOthers") : area.label}</span>
                  <strong>{ratioFormatter.format(area.ratio / 100)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t("photoPreviewEmpty")}</p>
          )}
        </article>
      </div>

      <div className={analysisStyles.analysisGrid}>
        {result ? (
          <>
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
          </>
        ) : (
          <article className={`${analysisStyles.analysisCard} ${analysisStyles.analysisCardEmpty}`}>
            <h3>{t("workbenchHistogramAllTitle")}</h3>
            <p className="muted">{t("photoPreviewEmpty")}</p>
          </article>
        )}
      </div>
    </section>
  );
}
