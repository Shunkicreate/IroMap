"use client";

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
        i
      </button>
      <span id={tooltipId} role="tooltip" className="infoTooltipContent">
        {content}
      </span>
    </span>
  );
}
