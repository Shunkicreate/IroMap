"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PanelHeader } from "@/components/workbench/panel-header";
import {
  toRgbColor,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import {
  type PhotoAnalysisResult,
  type RgbCubePoint,
} from "@/domain/photo-analysis/photo-analysis";
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

type RgbCubeOverlayMode = "grid" | "image" | "both";

const defaultSliceValue = 128;
const defaultRotation: Rotation = { x: -0.7, y: 0.6 };
const defaultCubeSize = 520;
const manualChannelLabels = {
  r: "R",
  g: "G",
  b: "B",
} as const;
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
  const [analysisSourceFile, setAnalysisSourceFile] = useState<File | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(defaultSliceValue);
  const [space, setSpace] = useState<ColorSpace3d>("rgb");
  const [isAxisGuideVisible, setIsAxisGuideVisible] = useState<boolean>(true);
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = useState<boolean>(true);
  const [cubeSize, setCubeSize] = useState<number>(defaultCubeSize);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);
  const [cubeOverlayMode, setCubeOverlayMode] = useState<RgbCubeOverlayMode>("both");
  const [photoCubePoints, setPhotoCubePoints] = useState<RgbCubePoint[]>([]);
  const [manualR, setManualR] = useState<number>(128);
  const [manualG, setManualG] = useState<number>(128);
  const [manualB, setManualB] = useState<number>(128);

  const normalizeSliceValueForAxis = (nextAxis: SliceAxis, currentValue: number): number => {
    const nextRange = getAxisRange(nextAxis);
    const currentRange = getAxisRange(sliceAxis);

    if (sliceAxis === nextAxis) {
      return clamp(currentValue, nextRange.min, nextRange.max);
    }

    return clamp(mapAxisValue(currentValue, currentRange, nextRange), nextRange.min, nextRange.max);
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

  const handleSourceFileSelected = (file: File | null): void => {
    setAnalysisSourceFile(file);
    if (file) {
      setLiveMessage(t("photoUploadSelected", { fileName: file.name }));
      return;
    }
    setPhotoCubePoints([]);
    setLiveMessage(t("photoUploadCleared"));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    handleSourceFileSelected(file);
  };

  const handleAnalysisComplete = (result: PhotoAnalysisResult | null): void => {
    setPhotoCubePoints(result?.cubePoints ?? []);
  };

  return (
    <section className="workbenchRoot">
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
              <div className="cubeOverlayMode">
                <span className="cubeControlLabel">{t("cubeOverlayModeLabel")}</span>
                <Tabs
                  value={cubeOverlayMode}
                  onValueChange={(value) => setCubeOverlayMode(value as RgbCubeOverlayMode)}
                  className="spaceTabs"
                >
                  <TabsList className="spaceTabsList">
                    <TabsTrigger value="grid" className="spaceTabTrigger">
                      {t("cubeOverlayModeGrid")}
                    </TabsTrigger>
                    <TabsTrigger value="image" className="spaceTabTrigger">
                      {t("cubeOverlayModeImage")}
                    </TabsTrigger>
                    <TabsTrigger value="both" className="spaceTabTrigger">
                      {t("cubeOverlayModeBoth")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
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
              imageCubePoints={photoCubePoints}
              overlayMode={cubeOverlayMode}
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
            onImageSelected={handleSourceFileSelected}
            onAnalysisComplete={handleAnalysisComplete}
            onUploadChange={handlePhotoUpload}
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
