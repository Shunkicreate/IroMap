"use client";

import { useState } from "react";
import { PanelHeader } from "@/components/workbench/panel-header";
import {
  isHslSliceAxis,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorCopyPanel } from "@/features/color-copy/color-copy-panel";
import { ColorInspector } from "@/features/inspector/color-inspector";
import {
  analyzePhotoFile,
  PhotoAnalysisPanel,
  type AnalysisState,
} from "@/features/photo-analysis/photo-analysis-panel";
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
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(defaultSliceValue);
  const [space, setSpace] = useState<ColorSpace3d>("rgb");
  const [isAxisGuideVisible, setIsAxisGuideVisible] = useState<boolean>(true);
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = useState<boolean>(true);
  const [cubeSize, setCubeSize] = useState<number>(defaultCubeSize);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);
  const [photoAnalysis, setPhotoAnalysis] = useState<AnalysisState>(null);
  const [photoFileName, setPhotoFileName] = useState<string>("");
  const [photoError, setPhotoError] = useState<string>("");
  const [photoStatusMessage, setPhotoStatusMessage] = useState<string>("");
  const [isPhotoAnalyzing, setIsPhotoAnalyzing] = useState<boolean>(false);

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

  const runPhotoAnalysis = async (file: File): Promise<void> => {
    setPhotoFileName(file.name);
    setIsPhotoAnalyzing(true);
    setPhotoError("");
    setPhotoStatusMessage("");
    setPhotoAnalysis(null);

    try {
      const result = await analyzePhotoFile(file);
      setPhotoAnalysis({
        fileName: file.name,
        result,
      });
    } catch {
      setPhotoAnalysis(null);
      setPhotoError(t("photoError"));
    } finally {
      setIsPhotoAnalyzing(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await runPhotoAnalysis(file);
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
            <div className="photoUploadCta">
              <div className="photoUploadCtaCopy">
                <strong>{t("photoUploadCtaTitle")}</strong>
                <p>{t("photoUploadCtaDescription")}</p>
                {photoFileName ? (
                  <p className="photoUploadCtaStatus">
                    {t("photoUploadSelected", { fileName: photoFileName })}
                  </p>
                ) : null}
              </div>
              <label className="photoUploadButton">
                <span>{isPhotoAnalyzing ? t("photoAnalyzing") : t("photoUploadButton")}</span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label={t("photoUploadLabel")}
                  className="srOnly"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
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
        <PhotoAnalysisPanel
          analysis={photoAnalysis}
          currentFileName={photoFileName}
          isAnalyzing={isPhotoAnalyzing}
          error={photoError}
          statusMessage={photoStatusMessage}
          onImageSelected={runPhotoAnalysis}
          onPasteFeedback={setPhotoStatusMessage}
        />
      </div>
    </main>
  );
}
