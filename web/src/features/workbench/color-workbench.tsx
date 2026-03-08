"use client";

import { useState } from "react";
import type { RgbColor, SliceAxis } from "@/domain/color/color-types";
import { ColorCopyPanel } from "@/features/color-copy/color-copy-panel";
import { ColorInspector } from "@/features/inspector/color-inspector";
import { PhotoAnalysisPanel } from "@/features/photo-analysis/photo-analysis-panel";
import { RgbCubeCanvas } from "@/features/rgb-cube/rgb-cube-canvas";
import { SliceCanvas } from "@/features/slice/slice-canvas";

type Rotation = {
  x: number;
  y: number;
};

export function ColorWorkbench() {
  const [hoverColor, setHoverColor] = useState<RgbColor | null>(null);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(128);
  const [rotation, setRotation] = useState<Rotation>({ x: -0.7, y: 0.6 });

  return (
    <main className="workbenchRoot">
      <header className="pageHeader">
        <h1>IroMap Workbench</h1>
        <p>Step1 RGB cube, Step2 Inspector, Step3 Copy, Step4 Slice, Step5 Photo Analysis</p>
      </header>

      <section className="panel">
        <div className="panelHeader">
          <h2>RGB Cube</h2>
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

      <ColorInspector hoverColor={hoverColor} selectedColor={selectedColor} />
      <ColorCopyPanel selectedColor={selectedColor} />

      <SliceCanvas
        axis={sliceAxis}
        value={sliceValue}
        onAxisChange={setSliceAxis}
        onValueChange={setSliceValue}
        onHoverColorChange={setHoverColor}
        onColorSelect={setSelectedColor}
      />

      <PhotoAnalysisPanel />
    </main>
  );
}
