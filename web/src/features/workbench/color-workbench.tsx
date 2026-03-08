"use client";

import { useState } from "react";
import type { RgbColor, SliceAxis } from "@/domain/color/color-types";
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

export function ColorWorkbench() {
  const [hoverColor, setHoverColor] = useState<RgbColor | null>(null);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(defaultSliceValue);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);

  return (
    <main className="workbenchRoot">
      <div className="pageHeader">
        <h1>{t("workbenchTitle")}</h1>
        <p>{t("workbenchSteps")}</p>
      </div>

      <section className="explorationLayout">
        <section className="panel">
          <div className="panelHeader">
            <h2>{t("panelRgbCube")}</h2>
            <p>FR-1 / FR-2 / FR-3</p>
          </div>
          <RgbCubeCanvas
            rotation={rotation}
            sliceAxis={sliceAxis}
            sliceValue={sliceValue}
            onRotationChange={setRotation}
            onHoverColorChange={setHoverColor}
            onColorSelect={setSelectedColor}
          />
        </section>

        <div className="explorationSide">
          <SliceCanvas
            axis={sliceAxis}
            value={sliceValue}
            onAxisChange={setSliceAxis}
            onValueChange={setSliceValue}
            onHoverColorChange={setHoverColor}
            onColorSelect={setSelectedColor}
          />
          <PhotoAnalysisPanel />
        </div>
      </section>

      <ColorInspector hoverColor={hoverColor} selectedColor={selectedColor} />
      <ColorCopyPanel selectedColor={selectedColor} />
    </main>
  );
}
