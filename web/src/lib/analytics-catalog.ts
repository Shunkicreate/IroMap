// Fixed identifiers are independent of UI copy and never contain user input.
export const analyticsControls = [
  ["theme-toggle", "appearance", "appearance"],
  ["page-scroll-25", "page-scroll", "page"],
  ["page-scroll-50", "page-scroll", "page"],
  ["page-scroll-75", "page-scroll", "page"],
  ["page-scroll-90", "page-scroll", "page"],
  ["photo-choose", "photo-input", "file-picker"],
  ["photo-file", "photo-input", "photo-analysis"],
  ["photo-paste", "photo-input", "photo-analysis"],
  ["photo-analysis", "photo-analysis", "workbench"],
  ["preview-options", "photo-preview", "preview-settings"],
  ["preview-grid", "photo-preview", "photo-preview"],
  ["preview-grid-white", "photo-preview", "photo-preview"],
  ["preview-grid-black", "photo-preview", "photo-preview"],
  ["preview-density", "photo-analysis", "photo-analysis"],
  ["preview-metadata", "photo-preview", "photo-metadata"],
  ["preview-point", "photo-selection", "linked-analysis"],
  ["preview-region", "photo-selection", "linked-analysis"],
  ["cube-rgb", "color-space", "rgb-cube"],
  ["cube-hsl", "color-space", "hsl-cube"],
  ["cube-lab", "color-space", "lab-cube"],
  ["cube-options", "cube", "cube-settings"],
  ["cube-grid", "cube", "cube"],
  ["cube-image", "cube", "cube"],
  ["cube-both", "cube", "cube"],
  ["cube-mapping", "cube", "cube"],
  ["cube-selection", "cube", "cube"],
  ["cube-guides", "cube", "cube"],
  ["cube-info", "cube", "cube"],
  ["cube-size-visible", "cube", "cube-settings"],
  ["cube-size", "cube", "cube"],
  ["cube-rotate", "cube", "cube"],
  ["cube-pick", "color-selection", "linked-analysis"],
  ["slice-axis", "slice", "slice"],
  ["slice-value", "slice", "slice"],
  ["slice-follow-color", "slice", "slice"],
  ["slice-options", "slice", "slice-settings"],
  ["slice-mapping", "slice", "slice"],
  ["slice-selection", "slice", "slice"],
  ["slice-pick", "color-selection", "linked-analysis"],
  ["metrics-format", "export", "metrics"],
  ["metric-help", "metrics", "metric-help"],
  ["metrics-copy", "export", "clipboard"],
  ["histogram-copy", "export", "clipboard"],
  ["inspector-open", "inspector", "inspector"],
  ["color-paste", "inspector", "linked-analysis"],
  ["color-copy-hex", "inspector", "clipboard"],
  ["color-copy-rgb", "inspector", "clipboard"],
  ["color-copy-hsl", "inspector", "clipboard"],
  ["api-file", "api-analysis", "api-input"],
  ["api-submit", "api-analysis", "api-result"],
] as const;

export type AnalyticsControlId = (typeof analyticsControls)[number][0];
export type AnalyticsAction =
  | "scroll"
  | "click"
  | "change"
  | "open"
  | "close"
  | "select"
  | "input"
  | "rotate"
  | "enable"
  | "disable";
export type AnalyticsOutcome = "succeeded" | "failed" | "cancelled";

export function getAnalyticsControl(id: string) {
  return analyticsControls.find(([controlId]) => controlId === id);
}

export function analyticsPagePath(pathname: string): string {
  return ["/", "/analyze", "/docs/agent-api", "/privacy"].includes(pathname) ? pathname : "/other";
}
