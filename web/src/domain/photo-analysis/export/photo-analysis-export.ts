import type {
  ExportFormat,
  HistogramBinHeaderLabels,
  SerializeHistogramBinsOptions,
  SerializeMetricRowsOptions,
  MetricRowHeaderLabels,
  WorkbenchHistogramBin,
  WorkbenchHistogramMetric,
  WorkbenchMetricRow,
} from "@/domain/photo-analysis/shared/photo-analysis-types";

// Export layer: serializes metrics and histograms for copy/download.

export const serializeMetricRows = (
  rows: WorkbenchMetricRow[],
  format: ExportFormat,
  options?: SerializeMetricRowsOptions
): string => {
  const separator = format === "tsv" ? "\t" : ",";
  const headerLabels: MetricRowHeaderLabels = options?.headerLabels ?? {
    group: "group",
    key: "key",
    label: "label",
    value: "value",
    unit: "unit",
    description: "description",
  };
  const header = [
    headerLabels.group,
    headerLabels.key,
    headerLabels.label,
    headerLabels.value,
    headerLabels.unit,
    headerLabels.description,
  ];
  const formatValue = (value: number | null, precision: number): string => {
    if (value == null) {
      return "N/A";
    }
    return value.toFixed(precision);
  };
  if (format === "markdown") {
    return [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...rows.map(
        (row) =>
          `| ${[
            row.group,
            row.key,
            row.label,
            formatValue(row.value, row.precision),
            row.unit,
            row.description,
          ].join(" | ")} |`
      ),
    ].join("\n");
  }

  return [header.join(separator)]
    .concat(
      rows.map((row) =>
        [
          row.group,
          row.key,
          row.label,
          formatValue(row.value, row.precision),
          row.unit,
          row.description,
        ].join(separator)
      )
    )
    .join("\n");
};

export const serializeHistogramBins = (
  bins: WorkbenchHistogramBin[],
  format: ExportFormat,
  options?: SerializeHistogramBinsOptions
): string => {
  const separator = format === "tsv" ? "\t" : ",";
  const headerLabels: HistogramBinHeaderLabels = options?.headerLabels ?? {
    metric: "metric",
    binIndex: "binIndex",
    start: "start",
    end: "end",
    count: "count",
    ratio: "ratio",
  };
  const metricLabels: Partial<Record<WorkbenchHistogramMetric, string>> =
    options?.metricLabels ?? {};
  const header = [
    headerLabels.metric,
    headerLabels.binIndex,
    headerLabels.start,
    headerLabels.end,
    headerLabels.count,
    headerLabels.ratio,
  ];
  if (format === "markdown") {
    return [
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...bins.map(
        (bin) =>
          `| ${[
            metricLabels[bin.metric] ?? bin.metric,
            bin.binIndex,
            bin.start.toFixed(2),
            bin.end.toFixed(2),
            bin.count,
            bin.ratio.toFixed(4),
          ].join(" | ")} |`
      ),
    ].join("\n");
  }

  return [header.join(separator)]
    .concat(
      bins.map((bin) =>
        [
          metricLabels[bin.metric] ?? bin.metric,
          bin.binIndex,
          bin.start.toFixed(2),
          bin.end.toFixed(2),
          bin.count,
          bin.ratio.toFixed(4),
        ].join(separator)
      )
    )
    .join("\n");
};
