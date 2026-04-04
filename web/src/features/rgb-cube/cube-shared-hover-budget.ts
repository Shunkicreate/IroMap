"use client";

export const cubeSharedHoverMobileMaxWidth = 767;
export const cubeSharedHoverTabletMaxWidth = 1023;

export type CubeSharedHoverViewport = "mobile" | "tablet" | "desktop";

export type CubeSharedHoverBudgetContext = {
  isDragging: boolean;
  viewport: CubeSharedHoverViewport;
};

export type CubeSharedHoverBudget = {
  minFrameGap: number;
  minTimeGapMs: number;
};

export type CubeSharedHoverBudgetEvaluation = {
  frameGap: number;
  minFrameGap: number;
  minTimeGapMs: number;
  shouldPublish: boolean;
  timeGapMs: number;
};

export const getCubeSharedHoverViewport = (width: number): CubeSharedHoverViewport => {
  if (width <= cubeSharedHoverMobileMaxWidth) {
    return "mobile";
  }
  if (width <= cubeSharedHoverTabletMaxWidth) {
    return "tablet";
  }
  return "desktop";
};

export const getCubeSharedHoverBudget = (
  context: CubeSharedHoverBudgetContext
): CubeSharedHoverBudget => {
  if (context.isDragging) {
    if (context.viewport === "mobile") {
      return { minFrameGap: 24, minTimeGapMs: 360 };
    }
    if (context.viewport === "tablet") {
      return { minFrameGap: 14, minTimeGapMs: 220 };
    }
    return { minFrameGap: 10, minTimeGapMs: 160 };
  }

  if (context.viewport === "mobile") {
    return { minFrameGap: 10, minTimeGapMs: 180 };
  }
  if (context.viewport === "tablet") {
    return { minFrameGap: 6, minTimeGapMs: 120 };
  }
  return { minFrameGap: 4, minTimeGapMs: 80 };
};

export const evaluateCubeSharedHoverBudget = ({
  budget,
  currentTick,
  lastPublishedTick,
  lastPublishedTimeMs,
  nowMs,
}: {
  budget: CubeSharedHoverBudget;
  currentTick: number;
  lastPublishedTick: number;
  lastPublishedTimeMs: number;
  nowMs: number;
}): CubeSharedHoverBudgetEvaluation => {
  const frameGap = currentTick - lastPublishedTick;
  const timeGapMs = nowMs - lastPublishedTimeMs;
  return {
    frameGap,
    minFrameGap: budget.minFrameGap,
    minTimeGapMs: budget.minTimeGapMs,
    shouldPublish: frameGap >= budget.minFrameGap && timeGapMs >= budget.minTimeGapMs,
    timeGapMs,
  };
};
