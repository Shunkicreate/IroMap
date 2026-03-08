import type { CSSProperties } from "react";
import type { RgbColor } from "@/domain/color/color-types";

type Props = {
  color: RgbColor;
  className?: string;
};

const toCssRgb = (color: RgbColor): string => {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
};

export function ColorSwatch({ color, className = "swatch" }: Props) {
  const style: CSSProperties = {
    backgroundColor: toCssRgb(color),
  };

  return <span className={className} style={style} />;
}
