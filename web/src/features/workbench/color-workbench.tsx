"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { PanelHeader } from "@/components/workbench/panel-header";
import {
  isHslSliceAxis,
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
const manualChannelLabels = {
  r: "R",
  g: "G",
  b: "B",
} as const;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const toRange = (value: number, sourceMax: number, targetMax: number): number => {
  return Math.round((value / sourceMax) * targetMax);
};

const getAxisMax = (axis: SliceAxis): number => {
  if (axis === "h") {
    return 360;
  }
  if (axis === "s" || axis === "l") {
    return 100;
  }
  return 255;
};

export function ColorWorkbench() {
  const [hoverColor, setHoverColor] = useState<RgbColor | null>(null);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [analysisSourceFile, setAnalysisSourceFile] = useState<File | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(defaultSliceValue);
  const [space, setSpace] = useState<ColorSpace3d>("rgb");
  const [isAxisGuideVisible, setIsAxisGuideVisible] = useState<boolean>(true);
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = useState<boolean>(true);
  const [cubeSize, setCubeSize] = useState<number>(defaultCubeSize);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);
  const [manualR, setManualR] = useState<number>(128);
  const [manualG, setManualG] = useState<number>(128);
  const [manualB, setManualB] = useState<number>(128);

  const normalizeSliceValueForAxis = (nextAxis: SliceAxis, currentValue: number): number => {
    const nextMax = getAxisMax(nextAxis);
    const currentMax = getAxisMax(sliceAxis);

    if (sliceAxis === nextAxis) {
      return clamp(currentValue, 0, nextMax);
    }

    return clamp(toRange(currentValue, currentMax, nextMax), 0, nextMax);
  };

  const handleSliceAxisChange = (nextAxis: SliceAxis): void => {
    setSliceAxis(nextAxis);
    setSliceValue(normalizeSliceValueForAxis(nextAxis, sliceValue));
  };

  const handleSpaceChange = (nextSpace: ColorSpace3d): void => {
    setSpace(nextSpace);

    if (nextSpace === "hsl" && !isHslSliceAxis(sliceAxis)) {
      setSliceAxis("h");
      setSliceValue(clamp(toRange(sliceValue, 255, 360), 0, 360));
      return;
    }

    if (nextSpace !== "hsl" && isHslSliceAxis(sliceAxis)) {
      setSliceAxis("r");
      const sourceMax = sliceAxis === "h" ? 360 : 100;
      setSliceValue(clamp(toRange(sliceValue, sourceMax, 255), 0, 255));
    }
  };

  const applyManualColor = (): void => {
    const nextColor = toRgbColor(
      clamp(manualR, 0, 255),
      clamp(manualG, 0, 255),
      clamp(manualB, 0, 255)
    );
    setSelectedColor(nextColor);
    setLiveMessage(t("workbenchManualApplied"));
    toast.success(t("workbenchManualApplied"));
  };

  const handleStatusChange = (message: string): void => {
    setLiveMessage(message);
  };

  return (
    <section className="workbenchRoot">
      <div className="workbenchTopBar">
        <div>
          <h1>{t("workbenchTitle")}</h1>
          <p>{t("workbenchSteps")}</p>
        </div>
        <ThemeToggle />
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
              <label className="fileInputInline">
                {t("workbenchUploadLabel")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAnalysisSourceFile(event.target.files?.[0] ?? null)}
                />
                <span>{t("workbenchUploadHint")}</span>
              </label>
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
              <div className="manualColorPicker" aria-label={t("workbenchManualPickerTitle")}>
                <strong>{t("workbenchManualPickerTitle")}</strong>
                <div className="manualColorInputs">
                  <label>
                    {manualChannelLabels.r}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={manualR}
                      onChange={(event) => setManualR(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    {manualChannelLabels.g}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={manualG}
                      onChange={(event) => setManualG(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    {manualChannelLabels.b}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={manualB}
                      onChange={(event) => setManualB(Number(event.target.value))}
                    />
                  </label>
                  <button type="button" onClick={applyManualColor}>
                    {t("workbenchManualApply")}
                  </button>
                </div>
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
          <PhotoAnalysisPanel
            sourceFile={analysisSourceFile}
            onColorInspect={setSelectedColor}
            onStatusChange={handleStatusChange}
          />
          <ColorCopyPanel
            selectedColor={selectedColor}
            onColorPasted={setSelectedColor}
            onStatusChange={handleStatusChange}
          />
        </aside>
      </div>

      <p className="srOnly" aria-live="polite">
        {liveMessage}
      </p>
    </section>
  );
}
