import { GraphFrame } from "@/components/graph/graph-frame";
import { PanelHeader } from "@/components/workbench/panel-header";
import { rgbToHex } from "@/domain/color/color-format";
import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { t } from "@/i18n/translate";

type Props = {
  result: PhotoAnalysisResult | null;
};

const scatterViewboxSize = 100;
const maxScatterRange = 128;
const pointRadius = 0.7;
const pointOpacity = 0.8;

const toScatterPosition = (value: number): number =>
  ((value + maxScatterRange) / (maxScatterRange * 2)) * scatterViewboxSize;

export function WorkbenchScatterPanel({ result }: Props) {
  return (
    <section className="panel">
      <PanelHeader titleKey="panelLabScatter" requirementsKey="panelLabScatterRequirements" />
      {result ? (
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
      ) : (
        <p className="muted">{t("photoPreviewEmpty")}</p>
      )}
    </section>
  );
}
