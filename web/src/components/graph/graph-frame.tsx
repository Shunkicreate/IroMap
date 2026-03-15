import type { ReactNode } from "react";

type Props = {
  xLabel: string;
  yLabel: string;
  children: ReactNode;
  className?: string;
};

export function GraphFrame({ xLabel, yLabel, children, className }: Props) {
  return (
    <div className={`graphFrame ${className ?? ""}`.trim()}>
      <div className="graphAxisXLabel">{xLabel}</div>
      <div className="graphAxisYLabel">{yLabel}</div>
      <div className="graphPlot">{children}</div>
    </div>
  );
}
