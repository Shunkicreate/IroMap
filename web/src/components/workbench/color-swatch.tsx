import type { RgbColor } from "@/domain/color/color-types";

type Props = {
  color: RgbColor;
  className?: string;
};

const toCssRgb = (color: RgbColor): string => {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
};

export function ColorSwatch({ color, className = "swatch" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 14"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <rect x="0" y="0" width="28" height="14" rx="4" fill={toCssRgb(color)} />
    </svg>
  );
}
