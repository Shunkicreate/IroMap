import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";

const histogramHeightPercent = 100;
const histogramMinHeightPercent = 2;
const histogramChartViewboxWidth = 100;
const histogramChartViewboxHeight = 100;

type Props = {
  bins: PhotoAnalysisResult["hueHistogram"] | PhotoAnalysisResult["saturationHistogram"];
  maxCount: number;
  gradientId: string;
  gradientStops: { offset: string; color: string }[];
  titleFormatter: (bin: { start: number; end: number; count: number }) => string;
  variantClassName?: string;
};

export function PhotoAnalysisHistogramChart({
  bins,
  maxCount,
  gradientId,
  gradientStops,
  titleFormatter,
  variantClassName = "",
}: Props) {
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
}
