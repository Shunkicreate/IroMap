"use client";

import { CircleHelp } from "lucide-react";
import { useId } from "react";

type Props = {
  label: string;
  content: string;
};

export function InfoTooltip({ label, content }: Props) {
  const tooltipId = useId();

  return (
    <span className="infoTooltip">
      <button
        type="button"
        className="infoTooltipTrigger"
        aria-label={label}
        aria-describedby={tooltipId}
      >
        <CircleHelp className="infoTooltipIcon" size={22} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span id={tooltipId} role="tooltip" className="infoTooltipContent">
        {content}
      </span>
    </span>
  );
}
