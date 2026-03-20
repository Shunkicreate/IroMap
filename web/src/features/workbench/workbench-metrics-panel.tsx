import { InfoTooltip } from "@/components/workbench/info-tooltip";
import { PanelHeader } from "@/components/workbench/panel-header";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import type {
  ExportFormat,
  PhotoAnalysisResult,
  WorkbenchMetricRow,
} from "@/domain/photo-analysis/photo-analysis";
import controlStyles from "@/features/workbench/workbench-controls.module.css";
import analysisStyles from "@/features/workbench/workbench-analysis-shared.module.css";
import panelStyles from "@/features/workbench/workbench-analysis-panel.module.css";
import {
  formatMetricValue,
  isVisibleMetricRow,
  ratioFormatter,
} from "@/features/workbench/workbench-shared";
import { t } from "@/i18n/translate";

type Props = {
  result: PhotoAnalysisResult | null;
  copyFormat: ExportFormat;
  metricRows: WorkbenchMetricRow[];
  onCopyFormatChange: (format: ExportFormat) => void;
  onCopyMetricTable: () => Promise<void>;
};

export function WorkbenchMetricsPanel({
  result,
  copyFormat,
  metricRows,
  onCopyFormatChange,
  onCopyMetricTable,
}: Props) {
  return (
    <section className={`panel ${panelStyles.panel}`}>
      <PanelHeader titleKey="panelMetrics" requirementsKey="panelMetricsRequirements" />

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
      </div>

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

      <article className={analysisStyles.analysisCard}>
        <h3>{t("photoColorAreaRatio")}</h3>
        {result ? (
          <ul className={`${analysisStyles.areaList} areaList`}>
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
    </section>
  );
}
