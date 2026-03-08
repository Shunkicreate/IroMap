declare const rangeBrandSymbol: unique symbol;

type NumberRangeBrand<Min extends number, Max extends number> = number & {
  readonly [rangeBrandSymbol]: `${Min}-${Max}`;
};

export type RgbChannel = NumberRangeBrand<0, 255>;
export type HueDegree = NumberRangeBrand<0, 360>;
export type Percentage = NumberRangeBrand<0, 100>;

const ensureInRange = (value: number, min: number, max: number, label: string): void => {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be in range ${min}..${max}`);
  }
};

export const toRgbChannel = (value: number): RgbChannel => {
  const normalized = Math.round(value);
  ensureInRange(normalized, 0, 255, "RgbChannel");
  return normalized as RgbChannel;
};

export const toHueDegree = (value: number): HueDegree => {
  const normalized = Math.round(value);
  ensureInRange(normalized, 0, 360, "HueDegree");
  return normalized as HueDegree;
};

export const toPercentage = (value: number): Percentage => {
  const normalized = Math.round(value);
  ensureInRange(normalized, 0, 100, "Percentage");
  return normalized as Percentage;
};

export type RgbColor = {
  r: RgbChannel;
  g: RgbChannel;
  b: RgbChannel;
};

export const toRgbColor = (r: number, g: number, b: number): RgbColor => {
  return {
    r: toRgbChannel(r),
    g: toRgbChannel(g),
    b: toRgbChannel(b),
  };
};

export type HslColor = {
  h: HueDegree;
  s: Percentage;
  l: Percentage;
};

export type LabColor = {
  l: number;
  a: number;
  b: number;
};

export type ColorSpace3d = "rgb" | "hsl" | "lab";

export type RgbSliceAxis = "r" | "g" | "b";
export type HslSliceAxis = "h" | "s" | "l";
export type SliceAxis = RgbSliceAxis | HslSliceAxis;

export const isRgbSliceAxis = (axis: SliceAxis): axis is RgbSliceAxis => {
  return axis === "r" || axis === "g" || axis === "b";
};

export const isHslSliceAxis = (axis: SliceAxis): axis is HslSliceAxis => {
  return axis === "h" || axis === "s" || axis === "l";
};
