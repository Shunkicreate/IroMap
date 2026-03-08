"use client";

import { useEffect, useRef } from "react";
import type { RgbColor, SliceAxis } from "@/domain/color/color-types";

type Props = {
  axis: SliceAxis;
  value: number;
  onAxisChange: (axis: SliceAxis) => void;
  onValueChange: (value: number) => void;
  onHoverColorChange: (color: RgbColor | null) => void;
  onColorSelect: (color: RgbColor) => void;
};

const buildColorFromPixel = (axis: SliceAxis, value: number, x: number, y: number): RgbColor => {
  if (axis === "r") {
    return {
      r: value,
      g: x,
      b: 255 - y,
    };
  }
  if (axis === "g") {
    return {
      r: x,
      g: value,
      b: 255 - y,
    };
  }
  return {
    r: x,
    g: 255 - y,
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

    const imageData = context.createImageData(256, 256);
    for (let y = 0; y < 256; y += 1) {
      for (let x = 0; x < 256; x += 1) {
        const color = buildColorFromPixel(axis, value, x, y);
        const offset = (y * 256 + x) * 4;
        imageData.data[offset] = color.r;
        imageData.data[offset + 1] = color.g;
        imageData.data[offset + 2] = color.b;
        imageData.data[offset + 3] = 255;
      }
    }

    context.putImageData(imageData, 0, 0);
  }, [axis, value]);

  const mapPointerToColor = (event: React.PointerEvent<HTMLCanvasElement>): RgbColor | null => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.round((event.clientX - bounds.left) * (256 / bounds.width));
    const y = Math.round((event.clientY - bounds.top) * (256 / bounds.height));

    if (x < 0 || x > 255 || y < 0 || y > 255) {
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
        <h2>Slice</h2>
        <p>FR-1 / FR-2 / FR-3</p>
      </div>
      <div className="sliceControls">
        <label>
          Axis
          <select value={axis} onChange={(event) => onAxisChange(event.target.value as SliceAxis)}>
            <option value="r">R fixed</option>
            <option value="g">G fixed</option>
            <option value="b">B fixed</option>
          </select>
        </label>
        <label>
          Value: {value}
          <input
            type="range"
            min={0}
            max={255}
            value={value}
            onChange={(event) => onValueChange(Number(event.target.value))}
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        className="sliceCanvas"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => onHoverColorChange(null)}
        onClick={handleClick}
      />
    </section>
  );
}
