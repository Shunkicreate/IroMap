"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PanelHeader } from "@/components/workbench/panel-header";
import { PersistedDisclosure } from "@/components/workbench/persisted-disclosure";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { PhotoSample } from "@/domain/photo-analysis/photo-analysis";
import controlStyles from "@/features/workbench/workbench-controls.module.css";
import { findNearestSliceHoverColorInWorker } from "@/features/workbench/hover-search-client";
import { findNearestMappedHoverColor } from "@/features/workbench/hover-search";
import { useSharedHoverState } from "@/features/workbench/shared-hover-store";
import { useLatestHoverPipeline } from "@/features/workbench/use-latest-hover-pipeline";

type Props = {
  analysisId: string | null;
  space: ColorSpace3d;
  axis: SliceAxis;
  value: number;
  displayOptionsStorageKey: string;
  mappedSamples?: PhotoSample[];
  selectedSamples?: PhotoSample[];
  ismappedSamplesVisible?: boolean;
  isselectedSamplesVisible?: boolean;
  onAxisChange: (axis: SliceAxis) => void;
  onValueChange: (value: number) => void;
  onHoverColorChange: (color: RgbColor | null) => void;
  onColorSelect: (color: RgbColor) => void;
  onMappedSamplesVisibilityChange: (ismappedSamplesVisible: boolean) => void;
  onSelectedSamplesVisibilityChange: (isselectedSamplesVisible: boolean) => void;
};

const rgbaStride = 4;
const redOffset = 0;
const greenOffset = 1;
const blueOffset = 2;
const alphaOffset = 3;
const mappedSampleHitRadius = 8;

const areSameColor = (
  left: RgbColor | null | undefined,
  right: RgbColor | null | undefined
): boolean => {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return left.r === right.r && left.g === right.g && left.b === right.b;
};

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

const getHueDistance = (left: number, right: number): number => {
  const distance = Math.abs(left - right);
  return Math.min(distance, 360 - distance);
};

const getSliceTolerance = (axis: SliceAxis): number => {
  if (axis === "h") {
    return 6;
  }
  if (axis === "s" || axis === "l" || axis === "lab-l") {
    return 2;
  }
  if (axis === "lab-a" || axis === "lab-b") {
    return 4;
  }
  return 4;
};

const selectedSphereRadiusByAxis = (axis: SliceAxis): number => {
  if (axis === "h") {
    return 12;
  }
  if (axis === "s" || axis === "l" || axis === "lab-l") {
    return 6;
  }
  if (axis === "lab-a" || axis === "lab-b") {
    return 10;
  }
  return 14;
};

const getSampleAxisValue = (sample: PhotoSample, axis: SliceAxis): number => {
  if (axis === "r") {
    return sample.color.r;
  }
  if (axis === "g") {
    return sample.color.g;
  }
  if (axis === "b") {
    return sample.color.b;
  }
  if (axis === "h") {
    return sample.hsl.h;
  }
  if (axis === "s") {
    return sample.hsl.s;
  }
  if (axis === "l") {
    return sample.hsl.l;
  }
  if (axis === "lab-l") {
    return sample.lab.l;
  }
  if (axis === "lab-a") {
    return sample.lab.a;
  }
  return sample.lab.b;
};

const projectSampleToSlicePlane = (
  sample: PhotoSample,
  axis: SliceAxis
): { x: number; y: number } => {
  if (axis === "r") {
    return { x: sample.color.g, y: colorChannelMax - sample.color.b };
  }
  if (axis === "g") {
    return { x: sample.color.r, y: colorChannelMax - sample.color.b };
  }
  if (axis === "b") {
    return { x: sample.color.r, y: colorChannelMax - sample.color.g };
  }
  if (axis === "h") {
    return {
      x: Math.round((sample.hsl.s / 100) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.l / 100) * colorChannelMax),
    };
  }
  if (axis === "s") {
    return {
      x: Math.round((sample.hsl.h / 360) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.l / 100) * colorChannelMax),
    };
  }
  if (axis === "l") {
    return {
      x: Math.round((sample.hsl.h / 360) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.s / 100) * colorChannelMax),
    };
  }
  if (axis === "lab-l") {
    return {
      x: Math.round(((sample.lab.a + 128) / 255) * colorChannelMax),
      y: colorChannelMax - Math.round(((sample.lab.b + 128) / 255) * colorChannelMax),
    };
  }
  if (axis === "lab-a") {
    return {
      x: Math.round(((sample.lab.b + 128) / 255) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.lab.l / 100) * colorChannelMax),
    };
  }
  return {
    x: Math.round(((sample.lab.a + 128) / 255) * colorChannelMax),
    y: colorChannelMax - Math.round((sample.lab.l / 100) * colorChannelMax),
  };
};

const projectSampleToSlice = (
  sample: PhotoSample,
  axis: SliceAxis,
  value: number
): { x: number; y: number } | null => {
  const tolerance = getSliceTolerance(axis);

  if (axis === "r") {
    if (Math.abs(sample.color.r - value) > tolerance) {
      return null;
    }
    return { x: sample.color.g, y: colorChannelMax - sample.color.b };
  }
  if (axis === "g") {
    if (Math.abs(sample.color.g - value) > tolerance) {
      return null;
    }
    return { x: sample.color.r, y: colorChannelMax - sample.color.b };
  }
  if (axis === "b") {
    if (Math.abs(sample.color.b - value) > tolerance) {
      return null;
    }
    return { x: sample.color.r, y: colorChannelMax - sample.color.g };
  }
  if (axis === "h") {
    if (getHueDistance(sample.hsl.h, value) > tolerance) {
      return null;
    }
    return {
      x: Math.round((sample.hsl.s / 100) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.l / 100) * colorChannelMax),
    };
  }
  if (axis === "s") {
    if (Math.abs(sample.hsl.s - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round((sample.hsl.h / 360) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.l / 100) * colorChannelMax),
    };
  }
  if (axis === "l") {
    if (Math.abs(sample.hsl.l - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round((sample.hsl.h / 360) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.hsl.s / 100) * colorChannelMax),
    };
  }
  if (axis === "lab-l") {
    if (Math.abs(sample.lab.l - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round(((sample.lab.a + 128) / 255) * colorChannelMax),
      y: colorChannelMax - Math.round(((sample.lab.b + 128) / 255) * colorChannelMax),
    };
  }
  if (axis === "lab-a") {
    if (Math.abs(sample.lab.a - value) > tolerance) {
      return null;
    }
    return {
      x: Math.round(((sample.lab.b + 128) / 255) * colorChannelMax),
      y: colorChannelMax - Math.round((sample.lab.l / 100) * colorChannelMax),
    };
  }
  if (Math.abs(sample.lab.b - value) > tolerance) {
    return null;
  }
  return {
    x: Math.round(((sample.lab.a + 128) / 255) * colorChannelMax),
    y: colorChannelMax - Math.round((sample.lab.l / 100) * colorChannelMax),
  };
};

export function SliceCanvas({
  analysisId,
  space,
  axis,
  value,
  displayOptionsStorageKey,
  mappedSamples = [],
  selectedSamples = [],
  ismappedSamplesVisible = true,
  isselectedSamplesVisible = true,
  onAxisChange,
  onValueChange,
  onHoverColorChange,
  onColorSelect,
  onMappedSamplesVisibilityChange,
  onSelectedSamplesVisibilityChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mappingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [localHoverColor, setLocalHoverColor] = useState<RgbColor | null>(null);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const sharedHoverColor = useSharedHoverState((state) => state.sample?.color ?? null);
  const labels = getPlaneLabels(axis);
  const axisRange = useMemo(() => getAxisRange(axis), [axis]);
  const projectedMappedSamples = useMemo(
    () =>
      mappedSamples.flatMap((sample) => {
        const point = projectSampleToSlice(sample, axis, value);
        return point ? [{ sample, point }] : [];
      }),
    [axis, mappedSamples, value]
  );
  const displayHoverColor = isPointerInside ? localHoverColor : sharedHoverColor;
  const sharedHoverPipeline = useLatestHoverPipeline<RgbColor | null, RgbColor | null>({
    debugLabel: "slice-shared-hover",
    isEqual: areSameColor,
    onResolved: (nextHoverColor) => {
      onHoverColorChange(nextHoverColor);
    },
    resolve: (color) => color,
  });
  const hoverPipeline = useLatestHoverPipeline<{ x: number; y: number } | null, RgbColor | null>({
    debugLabel: "slice-local-hover",
    isEqual: areSameColor,
    onResolved: (nextHoverColor) => {
      setLocalHoverColor(nextHoverColor);
      sharedHoverPipeline.schedule(nextHoverColor);
    },
    resolve: (point) => {
      if (!point) {
        return null;
      }
      if (analysisId) {
        return findNearestSliceHoverColorInWorker({
          analysisId,
          axis,
          value,
          x: point.x,
          y: point.y,
          maxDistanceSquared: mappedSampleHitRadius ** 2,
        });
      }
      return findNearestMappedHoverColor(
        projectedMappedSamples,
        point.x,
        point.y,
        mappedSampleHitRadius ** 2
      );
    },
  });

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
    const canvas = mappingCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, colorChannelLevels, colorChannelLevels);

    if (ismappedSamplesVisible) {
      context.fillStyle = "rgba(248, 250, 252, 0.42)";
      for (const projected of projectedMappedSamples) {
        context.beginPath();
        context.arc(projected.point.x, projected.point.y, 1.8, 0, Math.PI * 2);
        context.fill();
      }
    }

    if (isselectedSamplesVisible) {
      const sphereRadius = selectedSphereRadiusByAxis(axis);
      for (const sample of selectedSamples) {
        const axisDistance =
          axis === "h"
            ? getHueDistance(getSampleAxisValue(sample, axis), value)
            : Math.abs(getSampleAxisValue(sample, axis) - value);
        if (axisDistance > sphereRadius) {
          continue;
        }

        const planePoint = projectSampleToSlicePlane(sample, axis);
        const crossSectionRadius = Math.sqrt(sphereRadius ** 2 - axisDistance ** 2);
        const opacity = Math.max(0, 1 - axisDistance / sphereRadius);
        context.beginPath();
        context.arc(planePoint.x, planePoint.y, Math.max(crossSectionRadius, 1.2), 0, Math.PI * 2);
        context.strokeStyle = `rgba(249, 115, 22, ${opacity})`;
        context.lineWidth = 1.2;
        context.stroke();
      }
    }
  }, [
    axis,
    ismappedSamplesVisible,
    isselectedSamplesVisible,
    projectedMappedSamples,
    selectedSamples,
    value,
  ]);

  useEffect(() => {
    const canvas = cursorCanvasRef.current;
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
    drawMarker(displayHoverColor, "#ffffff", 7);
  }, [axis, displayHoverColor]);

  const mapPointerToCanvasPoint = (
    event: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - bounds.left) * (colorChannelLevels / bounds.width));
    const y = Math.floor((event.clientY - bounds.top) * (colorChannelLevels / bounds.height));

    if (x < colorChannelMin || x > colorChannelMax || y < colorChannelMin || y > colorChannelMax) {
      return null;
    }

    return { x, y };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    setIsPointerInside(true);
    hoverPipeline.schedule(mapPointerToCanvasPoint(event));
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const point = mapPointerToCanvasPoint(event);
    const color = point
      ? findNearestMappedHoverColor(
          projectedMappedSamples,
          point.x,
          point.y,
          mappedSampleHitRadius ** 2
        )
      : null;
    if (color) {
      onColorSelect(color);
    }
  };

  return (
    <section className="panel">
      <PanelHeader titleKey="panelSlice" requirementsKey="panelSliceRequirements" />
      <div className="sliceControls">
        <label className={controlStyles.stackedLabel}>
          {t("sliceAxisLabel")}
          <select
            className={controlStyles.fieldControl}
            value={axis}
            onChange={(event) => onAxisChange(event.target.value as SliceAxis)}
          >
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
        <label className={controlStyles.stackedLabel}>
          {t("sliceValueLabel", { value })}
          <input
            className={controlStyles.rangeControl}
            type="range"
            min={axisRange.min}
            max={axisRange.max}
            value={value}
            onInput={(event) => onValueChange(Number(event.currentTarget.value))}
            onChange={(event) => onValueChange(Number(event.target.value))}
          />
        </label>
      </div>
      <PersistedDisclosure
        storageKey={displayOptionsStorageKey}
        defaultOpen={false}
        summary={t("workbenchDisplayOptionsDisclosure")}
        className={controlStyles.inlineDisclosure}
        contentClassName={controlStyles.inlineDisclosureContent}
      >
        <div className={controlStyles.toggleRow}>
          <label className={controlStyles.toggleLabel}>
            <Checkbox
              checked={ismappedSamplesVisible}
              onCheckedChange={(checked) => onMappedSamplesVisibilityChange(checked === true)}
              aria-label={t("workbenchShowWhiteMappingSlice")}
            />
            <span>{t("workbenchShowWhiteMappingSlice")}</span>
          </label>
          <label className={controlStyles.toggleLabel}>
            <Checkbox
              checked={isselectedSamplesVisible}
              onCheckedChange={(checked) => onSelectedSamplesVisibilityChange(checked === true)}
              aria-label={t("workbenchShowSelectedMappingSlice")}
            />
            <span>{t("workbenchShowSelectedMappingSlice")}</span>
          </label>
        </div>
      </PersistedDisclosure>
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
              onPointerLeave={() => {
                setIsPointerInside(false);
                hoverPipeline.clearNow(null);
                sharedHoverPipeline.clearNow(null);
              }}
              onClick={handleClick}
            />
            <canvas
              ref={mappingCanvasRef}
              width={colorChannelLevels}
              height={colorChannelLevels}
              className="sliceCanvas sliceCanvasOverlay"
              aria-hidden="true"
            />
            <canvas
              ref={cursorCanvasRef}
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
