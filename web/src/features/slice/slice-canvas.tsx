"use client";

import { useEffect, useRef } from "react";
import type { RgbColor, SliceAxis } from "@/domain/color/color-types";
import {
  colorChannelLevels,
  colorChannelMax,
  colorChannelMin,
} from "@/domain/color/color-constants";
import { t } from "@/i18n/translate";

type Props = {
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

const buildColorFromPixel = (axis: SliceAxis, value: number, x: number, y: number): RgbColor => {
  if (axis === "r") {
    return {
      r: value,
      g: x,
      b: colorChannelMax - y,
    };
  }
  if (axis === "g") {
    return {
      r: x,
      g: value,
      b: colorChannelMax - y,
    };
  }
  return {
    r: x,
    g: colorChannelMax - y,
    b: value,
  };
};

export function SliceCanvas({
  axis,
  value,
  onAxisChange,
  onValueChange,
  onHoverColorChange,
  onColorSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    const x = Math.round(
      (event.clientX - bounds.left) * (colorChannelLevels / bounds.width)
    );
    const y = Math.round(
      (event.clientY - bounds.top) * (colorChannelLevels / bounds.height)
    );

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
            <option value="r">{t("sliceAxisR")}</option>
            <option value="g">{t("sliceAxisG")}</option>
            <option value="b">{t("sliceAxisB")}</option>
          </select>
        </label>
        <label>
          {t("sliceValueLabel", { value })}
          <input
            type="range"
            min={colorChannelMin}
            max={colorChannelMax}
            value={value}
            onChange={(event) => onValueChange(Number(event.target.value))}
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={colorChannelLevels}
        height={colorChannelLevels}
        className="sliceCanvas"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => onHoverColorChange(null)}
        onClick={handleClick}
      />
    </section>
  );
}
