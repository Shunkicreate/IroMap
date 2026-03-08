"use client";

import { useState } from "react";
import { PanelHeader } from "@/components/workbench/panel-header";
import { rgbToHex } from "@/domain/color/color-format";
import {
  toRgbColor,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorCopyPanel } from "@/features/color-copy/color-copy-panel";
import { ColorInspector } from "@/features/inspector/color-inspector";
import { PhotoAnalysisPanel } from "@/features/photo-analysis/photo-analysis-panel";
import { RgbCubeCanvas } from "@/features/rgb-cube/rgb-cube-canvas";
import { SliceCanvas } from "@/features/slice/slice-canvas";
import { t } from "@/i18n/translate";

type Rotation = {
  x: number;
  y: number;
};

const defaultSliceValue = 128;
const defaultRotation: Rotation = { x: -0.7, y: 0.6 };
const defaultCubeSize = 520;
const keyboardPresetColors: RgbColor[] = [
  toRgbColor(255, 99, 71),
  toRgbColor(72, 149, 239),
  toRgbColor(255, 209, 102),
  toRgbColor(6, 214, 160),
  toRgbColor(131, 56, 236),
  toRgbColor(17, 24, 39),
];
const defaultSliceAxisBySpace: Record<ColorSpace3d, SliceAxis> = {
  rgb: "r",
  hsl: "h",
  lab: "lab-l",
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const getAxisRange = (axis: SliceAxis): { min: number; max: number } => {
  if (axis === "h") {
    return { min: 0, max: 360 };
  }
  if (axis === "s" || axis === "l" || axis === "lab-l") {
    return { min: 0, max: 100 };
  }
  if (axis === "lab-a" || axis === "lab-b") {
    return { min: -128, max: 127 };
  }
  return { min: 0, max: 255 };
};

const mapAxisValue = (
  value: number,
  sourceRange: { min: number; max: number },
  targetRange: { min: number; max: number }
): number => {
  const sourceSpan = sourceRange.max - sourceRange.min;
  const targetSpan = targetRange.max - targetRange.min;
  if (sourceSpan === 0) {
    return targetRange.min;
  }
  const ratio = (value - sourceRange.min) / sourceSpan;
  return Math.round(targetRange.min + ratio * targetSpan);
};

export function ColorWorkbench() {
  const [hoverColor, setHoverColor] = useState<RgbColor | null>(null);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(defaultSliceValue);
  const [space, setSpace] = useState<ColorSpace3d>("rgb");
  const [isAxisGuideVisible, setIsAxisGuideVisible] = useState<boolean>(true);
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = useState<boolean>(true);
  const [cubeSize, setCubeSize] = useState<number>(defaultCubeSize);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);

  const normalizeSliceValueForAxis = (nextAxis: SliceAxis, currentValue: number): number => {
    const nextRange = getAxisRange(nextAxis);
    const currentRange = getAxisRange(sliceAxis);

    if (sliceAxis === nextAxis) {
      return clamp(currentValue, nextRange.min, nextRange.max);
    }

    const normalized = mapAxisValue(currentValue, currentRange, nextRange);
    return clamp(normalized, nextRange.min, nextRange.max);
  };

  const handleSliceAxisChange = (nextAxis: SliceAxis): void => {
    setSliceAxis(nextAxis);
    setSliceValue(normalizeSliceValueForAxis(nextAxis, sliceValue));
  };

  const handleSpaceChange = (nextSpace: ColorSpace3d): void => {
    setSpace(nextSpace);
    const nextAxis = defaultSliceAxisBySpace[nextSpace];
    const sourceRange = getAxisRange(sliceAxis);
    const targetRange = getAxisRange(nextAxis);
    setSliceAxis(nextAxis);
    setSliceValue(
      clamp(mapAxisValue(sliceValue, sourceRange, targetRange), targetRange.min, targetRange.max)
    );
  };

  return (
    <main className="workbenchRoot">
      <div className="pageHeader">
        <h1>{t("workbenchTitle")}</h1>
        <p>{t("workbenchSteps")}</p>
      </div>

      <div className="workbenchMainGrid">
        <div className="visualizationGrid">
          <section className="panel">
            <PanelHeader titleKey="panelRgbCube" requirementsKey="panelRgbCubeRequirements" />
            <Tabs
              value={space}
              onValueChange={(value) => handleSpaceChange(value as ColorSpace3d)}
              className="spaceTabs"
            >
              <TabsList className="spaceTabsList">
                <TabsTrigger value="rgb" className="spaceTabTrigger">
                  {t("spaceRgb")}
                </TabsTrigger>
                <TabsTrigger value="hsl" className="spaceTabTrigger">
                  {t("spaceHsl")}
                </TabsTrigger>
                <TabsTrigger value="lab" className="spaceTabTrigger">
                  {t("spaceLab")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="cubeSettings">
              <div className="cubeToggleRow">
                <label className="toggleLabel">
                  <input
                    type="checkbox"
                    checked={isAxisGuideVisible}
                    onChange={(event) => setIsAxisGuideVisible(event.target.checked)}
                  />
                  {t("cubeShowAxisGuide")}
                </label>
                <label className="toggleLabel">
                  <input
                    type="checkbox"
                    checked={isCubeSizeSliderVisible}
                    onChange={(event) => setIsCubeSizeSliderVisible(event.target.checked)}
                  />
                  {t("cubeShowSizeSlider")}
                </label>
              </div>
              {isCubeSizeSliderVisible ? (
                <label>
                  {t("cubeSizeLabel", { size: cubeSize })}
                  <input
                    type="range"
                    min={320}
                    max={900}
                    step={10}
                    value={cubeSize}
                    onChange={(event) => setCubeSize(Number(event.target.value))}
                  />
                </label>
              ) : null}
              <div className="keyboardPicker">
                <p className="keyboardPickerTitle">{t("keyboardPickerTitle")}</p>
                <p className="keyboardPickerDescription">{t("keyboardPickerDescription")}</p>
                <div className="keyboardPresetButtons">
                  {keyboardPresetColors.map((color, index) => {
                    const value = rgbToHex(color);
                    return (
                      <button
                        key={value}
                        type="button"
                        className="keyboardPresetButton"
                        onClick={() => setSelectedColor(color)}
                        aria-label={t("keyboardPresetLabel", { index: index + 1, value })}
                      >
                        <span className="keyboardPresetSwatch" style={{ background: value }} />
                        <span>{value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <RgbCubeCanvas
              space={space}
              rotation={rotation}
              cubeSize={cubeSize}
              axisGuideMode={isAxisGuideVisible ? "visible" : "hidden"}
              sliceAxis={sliceAxis}
              sliceValue={sliceValue}
              onRotationChange={setRotation}
              onHoverColorChange={setHoverColor}
              onColorSelect={setSelectedColor}
            />
          </section>

          <SliceCanvas
            space={space}
            axis={sliceAxis}
            value={sliceValue}
            onAxisChange={handleSliceAxisChange}
            onValueChange={setSliceValue}
            onHoverColorChange={setHoverColor}
            onColorSelect={setSelectedColor}
          />
        </div>

        <aside className="supportPanels">
          <ColorInspector hoverColor={hoverColor} selectedColor={selectedColor} />
          <ColorCopyPanel selectedColor={selectedColor} onColorPasted={setSelectedColor} />
        </aside>
      </div>
      <div className="analysisSection">
        <PhotoAnalysisPanel />
      </div>
    </main>
  );
}
