"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  toHueDegree,
  toPercentage,
  toRgbColor,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import { hslToRgb } from "@/domain/color/color-conversion";
import {
  colorChannelLevels,
  colorChannelMax,
  colorChannelMin,
} from "@/domain/color/color-constants";
import { GraphFrame } from "@/components/graph/graph-frame";
import { t } from "@/i18n/translate";

type Props = {
  space: ColorSpace3d;
  axis: SliceAxis;
  value: number;
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

const getAxisRange = (axis: SliceAxis): { min: number; max: number } => {
  if (axis === "h") {
    return { min: 0, max: 360 };
  }
  if (axis === "s" || axis === "l") {
    return { min: 0, max: 100 };
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
    return hslToRgb({
      h: toHueDegree(value),
      s: toPercentage(toScaledValue(x, 100)),
      l: toPercentage(toScaledValue(colorChannelMax - y, 100)),
    });
  }
  if (axis === "s") {
    return hslToRgb({
      h: toHueDegree(toScaledValue(x, 360)),
      s: toPercentage(value),
      l: toPercentage(toScaledValue(colorChannelMax - y, 100)),
    });
  }
  return hslToRgb({
    h: toHueDegree(toScaledValue(x, 360)),
    s: toPercentage(toScaledValue(colorChannelMax - y, 100)),
    l: toPercentage(value),
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
  return { x: "H", y: "S", fixed: "L" };
};

export function SliceCanvas({
  space,
  axis,
  value,
  onAxisChange,
  onValueChange,
  onHoverColorChange,
  onColorSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  const mapPointerToColor = (event: React.PointerEvent<HTMLCanvasElement>): RgbColor | null => {
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
    const color = mapPointerToColor(event as unknown as React.PointerEvent<HTMLCanvasElement>);
    if (color) {
      onColorSelect(color);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>{t("panelSlice")}</h2>
        <p>FR-1 / FR-2 / FR-3</p>
      </div>
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
          <canvas
            ref={canvasRef}
            width={colorChannelLevels}
            height={colorChannelLevels}
            className="sliceCanvas"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => onHoverColorChange(null)}
            onClick={handleClick}
          />
        </GraphFrame>
      </div>
    </section>
  );
}
