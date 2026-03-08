"use client";

import { useState } from "react";
import {
  isHslSliceAxis,
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
const defaultCubeSize = 400;

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

  const handleSpaceChange = (nextSpace: ColorSpace3d): void => {
    setSpace(nextSpace);

    if (nextSpace === "hsl" && !isHslSliceAxis(sliceAxis)) {
      setSliceAxis("h");
      setSliceValue(Math.round((sliceValue / 255) * 360));
      return;
    }

    if (nextSpace !== "hsl" && isHslSliceAxis(sliceAxis)) {
      setSliceAxis("r");
      if (sliceAxis === "h") {
        setSliceValue(Math.round((sliceValue / 360) * 255));
      } else {
        setSliceValue(Math.round((sliceValue / 100) * 255));
      }
    }
  };

  return (
    <main className="workbenchRoot">
      <div className="pageHeader">
        <h1>{t("workbenchTitle")}</h1>
        <p>{t("workbenchSteps")}</p>
      </div>

      <div className="visualizationGrid">
        <section className="panel">
          <div className="panelHeader">
            <h2>{t("panelRgbCube")}</h2>
            <p>FR-1 / FR-2 / FR-3 / FR-4</p>
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
            {isCubeSizeSliderVisible ? (
              <label>
                {t("cubeSizeLabel", { size: cubeSize })}
                <input
                  type="range"
                  min={320}
                  max={640}
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
          onAxisChange={setSliceAxis}
          onValueChange={setSliceValue}
          onHoverColorChange={setHoverColor}
          onColorSelect={setSelectedColor}
        />
      </div>

      <ColorInspector hoverColor={hoverColor} selectedColor={selectedColor} />
      <ColorCopyPanel selectedColor={selectedColor} onColorPasted={setSelectedColor} />

      <PhotoAnalysisPanel />
    </main>
  );
}
