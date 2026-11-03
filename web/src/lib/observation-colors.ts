// Generated from docs/specs/theme-color-system/tokens.json. Do not edit.
export const observationColors = {
  light: {
    surface: "#E6E6E6",
    text: "#303030",
    secondary: "#595959",
    guide: "#808080",
    selection: "#915363",
  },
  dark: {
    surface: "#242424",
    text: "#F0F0F0",
    secondary: "#B8B8B8",
    guide: "#858585",
    selection: "#A6C8F0",
  },
} as const;
export const selectionMarker = { inner: "#FFFFFF", outer: "#171717" } as const;
export type ObservationColors = { [Key in keyof typeof observationColors.light]: string };
