import {
  histogramChartViewboxHeight,
  histogramChartViewboxWidth,
  histogramHeightPercent,
  histogramMinHeightPercent,
} from "@/features/workbench/workbench-shared";

type HistogramBinLike = {
  metric: string;
  binIndex: number;
  start: number;
  end: number;
  count: number;
};

type Props = {
  bins: HistogramBinLike[];
  className?: string;
};

export function WorkbenchHistogramChart({ bins, className = "" }: Props) {
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const barWidth = histogramChartViewboxWidth / Math.max(1, bins.length);

  return (
    <svg
      viewBox={`0 0 ${histogramChartViewboxWidth} ${histogramChartViewboxHeight}`}
      className={`histogramBars${className ? ` ${className}` : ""}`}
      role="img"
      preserveAspectRatio="none"
    >
      {bins.map((bin, index) => {
        const height = Math.max(
          histogramMinHeightPercent,
          (bin.count / maxCount) * histogramHeightPercent
        );

        return (
          <rect
            key={`${bin.metric}-${bin.binIndex}`}
            className="histogramBar"
            x={index * barWidth + barWidth * 0.1}
            y={histogramChartViewboxHeight - height}
            width={Math.max(barWidth * 0.8, 1)}
            height={height}
            fill="#7bf0b8"
            opacity={0.85}
            rx="0.5"
            ry="0.5"
          >
            <title>{`${bin.start.toFixed(2)}-${bin.end.toFixed(2)}: ${bin.count}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
