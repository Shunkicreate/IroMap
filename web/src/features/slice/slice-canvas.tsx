"use client";

import { useEffect, useMemo, useRef } from "react";
import { PanelHeader } from "@/components/workbench/panel-header";
import {
  toHueDegree,
  toPercentage,
  toRgbColor,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import { hslToRgb, labToRgb, rgbToHsl, rgbToLab } from "@/domain/color/color-conversion";
import {
  colorChannelLevels,
  colorChannelMax,
  colorChannelMin,
} from "@/domain/color/color-constants";
import { t } from "@/i18n/translate";
import { GraphFrame } from "@/components/graph/graph-frame";

type Props = {
  space: ColorSpace3d;
  axis: SliceAxis;
  value: number;
  hoverColor?: RgbColor | null;
  selectedColor?: RgbColor | null;
  onAxisChange: (axis: SliceAxis) => void;
  onValueChange: (value: number) => void;
  onHoverColorChange: (color: RgbColor | null) => void;
  onColorSelect: (color: RgbColor) => void;
};

const rgbaStride = 4;
const redOffset = 0;
const greenOffset = 1;
const blueOffset = 2;
const alphaOffset = 3;

const toScaledValue = (value: number, max: number): number => {
  return Math.round((value / colorChannelMax) * max);
};

const toScaledRangeValue = (value: number, min: number, max: number): number => {
  return min + Math.round((value / colorChannelMax) * (max - min));
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const getAxisRange = (axis: SliceAxis): { min: number; max: number } => {
  if (axis === "h") {
    return { min: 0, max: 360 };
  }
  if (axis === "s" || axis === "l") {
    return { min: 0, max: 100 };
  }
  if (axis === "lab-l") {
    return { min: 0, max: 100 };
  }
  if (axis === "lab-a" || axis === "lab-b") {
    return { min: -128, max: 127 };
  }
  return { min: colorChannelMin, max: colorChannelMax };
};

const buildColorFromPixel = (axis: SliceAxis, value: number, x: number, y: number): RgbColor => {
  if (axis === "r") {
    return toRgbColor(value, x, colorChannelMax - y);
  }
  if (axis === "g") {
    return toRgbColor(x, value, colorChannelMax - y);
  }
  if (axis === "b") {
    return toRgbColor(x, colorChannelMax - y, value);
  }

  if (axis === "h") {
    const safeHue = clamp(value, 0, 360);
    return hslToRgb({
      h: toHueDegree(safeHue),
      s: toPercentage(toScaledValue(x, 100)),
      l: toPercentage(toScaledValue(colorChannelMax - y, 100)),
    });
  }
  if (axis === "s") {
    const safeSaturation = clamp(value, 0, 100);
    return hslToRgb({
      h: toHueDegree(toScaledValue(x, 360)),
      s: toPercentage(safeSaturation),
      l: toPercentage(toScaledValue(colorChannelMax - y, 100)),
    });
  }
  if (axis === "lab-l") {
    return labToRgb({
      l: clamp(value, 0, 100),
      a: toScaledRangeValue(x, -128, 127),
      b: toScaledRangeValue(colorChannelMax - y, -128, 127),
    });
  }
  if (axis === "lab-a") {
    return labToRgb({
      l: toScaledValue(colorChannelMax - y, 100),
      a: clamp(value, -128, 127),
      b: toScaledRangeValue(x, -128, 127),
    });
  }
  if (axis === "lab-b") {
    return labToRgb({
      l: toScaledValue(colorChannelMax - y, 100),
      a: toScaledRangeValue(x, -128, 127),
      b: clamp(value, -128, 127),
    });
  }

  const safeLightness = clamp(value, 0, 100);
  return hslToRgb({
    h: toHueDegree(toScaledValue(x, 360)),
    s: toPercentage(toScaledValue(colorChannelMax - y, 100)),
    l: toPercentage(safeLightness),
  });
};

const getPlaneLabels = (axis: SliceAxis): { x: string; y: string; fixed: string } => {
  if (axis === "r") {
    return { x: "G", y: "B", fixed: "R" };
  }
  if (axis === "g") {
    return { x: "R", y: "B", fixed: "G" };
  }
  if (axis === "b") {
    return { x: "R", y: "G", fixed: "B" };
  }
  if (axis === "h") {
    return { x: "S", y: "L", fixed: "H" };
  }
  if (axis === "s") {
    return { x: "H", y: "L", fixed: "S" };
  }
  if (axis === "lab-l") {
    return { x: "a", y: "b", fixed: "L*" };
  }
  if (axis === "lab-a") {
    return { x: "b", y: "L*", fixed: "a" };
  }
  if (axis === "lab-b") {
    return { x: "a", y: "L*", fixed: "b" };
  }
  return { x: "H", y: "S", fixed: "L" };
};

export function SliceCanvas({
  space,
  axis,
  value,
  hoverColor = null,
  selectedColor = null,
  onAxisChange,
  onValueChange,
  onHoverColorChange,
  onColorSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const labels = getPlaneLabels(axis);
  const axisRange = useMemo(() => getAxisRange(axis), [axis]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const imageData = context.createImageData(colorChannelLevels, colorChannelLevels);
    for (let y = colorChannelMin; y < colorChannelLevels; y += 1) {
      for (let x = colorChannelMin; x < colorChannelLevels; x += 1) {
        const color = buildColorFromPixel(axis, value, x, y);
        const offset = (y * colorChannelLevels + x) * rgbaStride;
        imageData.data[offset + redOffset] = color.r;
        imageData.data[offset + greenOffset] = color.g;
        imageData.data[offset + blueOffset] = color.b;
        imageData.data[offset + alphaOffset] = colorChannelMax;
      }
    }

    context.putImageData(imageData, 0, 0);
  }, [axis, value]);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, colorChannelLevels, colorChannelLevels);

    const drawMarker = (color: RgbColor | null, strokeStyle: string, radius: number): void => {
      if (!color) {
        return;
      }

      let x = 0;
      let y = 0;
      if (axis === "r") {
        x = color.g;
        y = colorChannelMax - color.b;
      } else if (axis === "g") {
        x = color.r;
        y = colorChannelMax - color.b;
      } else if (axis === "b") {
        x = color.r;
        y = colorChannelMax - color.g;
      } else {
        const hsl = rgbToHsl(color);
        const lab = rgbToLab(color);
        if (axis === "h") {
          x = Math.round((hsl.s / 100) * colorChannelMax);
          y = colorChannelMax - Math.round((hsl.l / 100) * colorChannelMax);
        } else if (axis === "s") {
          x = Math.round((hsl.h / 360) * colorChannelMax);
          y = colorChannelMax - Math.round((hsl.l / 100) * colorChannelMax);
        } else if (axis === "l") {
          x = Math.round((hsl.h / 360) * colorChannelMax);
          y = colorChannelMax - Math.round((hsl.s / 100) * colorChannelMax);
        } else if (axis === "lab-l") {
          x = Math.round(((lab.a + 128) / 255) * colorChannelMax);
          y = colorChannelMax - Math.round(((lab.b + 128) / 255) * colorChannelMax);
        } else if (axis === "lab-a") {
          x = Math.round(((lab.b + 128) / 255) * colorChannelMax);
          y = colorChannelMax - Math.round((lab.l / 100) * colorChannelMax);
        } else {
          x = Math.round(((lab.a + 128) / 255) * colorChannelMax);
          y = colorChannelMax - Math.round((lab.l / 100) * colorChannelMax);
        }
      }

      context.strokeStyle = strokeStyle;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.stroke();
    };

    drawMarker(selectedColor, "#f97316", 10);
    drawMarker(hoverColor, "#ffffff", 7);
  }, [axis, hoverColor, selectedColor]);

  const mapPointerToColor = (
    event: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>
  ): RgbColor | null => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - bounds.left) * (colorChannelLevels / bounds.width));
    const y = Math.floor((event.clientY - bounds.top) * (colorChannelLevels / bounds.height));

    if (x < colorChannelMin || x > colorChannelMax || y < colorChannelMin || y > colorChannelMax) {
      return null;
    }

    return buildColorFromPixel(axis, value, x, y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const color = mapPointerToColor(event);
    onHoverColorChange(color);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const color = mapPointerToColor(event);
    if (color) {
      onColorSelect(color);
    }
  };

  return (
    <section className="panel">
      <PanelHeader titleKey="panelSlice" requirementsKey="panelSliceRequirements" />
      <div className="sliceControls">
        <label>
          {t("sliceAxisLabel")}
          <select value={axis} onChange={(event) => onAxisChange(event.target.value as SliceAxis)}>
            {space === "hsl" ? (
              <>
                <option value="h">{t("sliceAxisH")}</option>
                <option value="s">{t("sliceAxisS")}</option>
                <option value="l">{t("sliceAxisL")}</option>
              </>
            ) : space === "lab" ? (
              <>
                <option value="lab-l">{t("sliceAxisLabL")}</option>
                <option value="lab-a">{t("sliceAxisLabA")}</option>
                <option value="lab-b">{t("sliceAxisLabB")}</option>
              </>
            ) : (
              <>
                <option value="r">{t("sliceAxisR")}</option>
                <option value="g">{t("sliceAxisG")}</option>
                <option value="b">{t("sliceAxisB")}</option>
              </>
            )}
          </select>
        </label>
        <label>
          {t("sliceValueLabel", { value })}
          <input
            type="range"
            min={axisRange.min}
            max={axisRange.max}
            value={value}
            onChange={(event) => onValueChange(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="sliceCanvasWrap">
        <div className="sliceAxisBadge">
          {t("sliceFixedAxisLabel", { axis: labels.fixed, value })}
        </div>
        <GraphFrame
          className="sliceGraphFrame"
          xLabel={t("sliceAxisXLabel", { axis: labels.x })}
          yLabel={t("sliceAxisYLabel", { axis: labels.y })}
        >
          <div className="sliceCanvasStack">
            <canvas
              ref={canvasRef}
              width={colorChannelLevels}
              height={colorChannelLevels}
              className="sliceCanvas"
              tabIndex={0}
              aria-label={t("sliceCanvasAriaLabel")}
              onPointerMove={handlePointerMove}
              onPointerLeave={() => onHoverColorChange(null)}
              onClick={handleClick}
            />
            <canvas
              ref={overlayRef}
              width={colorChannelLevels}
              height={colorChannelLevels}
              className="sliceCanvas sliceCanvasOverlay"
              aria-hidden="true"
            />
          </div>
        </GraphFrame>
      </div>
    </section>
  );
}
