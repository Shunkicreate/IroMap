import { formatHsl, formatRgb, rgbToHex } from "@/domain/color/color-format";
import type { RgbColor } from "@/domain/color/color-types";

type Props = {
  hoverColor: RgbColor | null;
  selectedColor: RgbColor | null;
};

const renderColorRow = (label: string, color: RgbColor) => {
  return (
    <div className="colorRow">
      <span>{label}</span>
      <code>{rgbToHex(color)}</code>
      <code>{formatRgb(color)}</code>
      <code>{formatHsl(color)}</code>
    </div>
  );
};

export function ColorInspector({ hoverColor, selectedColor }: Props) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Inspector</h2>
        <p>FR-1 / FR-2 / FR-3</p>
      </div>

      <div className="inspectorCards">
        <div className="inspectorCard">
          <strong>Preview (Hover)</strong>
          {hoverColor ? (
            <>
              <span
                className="swatch"
                style={{
                  backgroundColor: `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})`,
                }}
              />
              {renderColorRow("hover", hoverColor)}
            </>
          ) : (
            <p className="muted">No hover target</p>
          )}
        </div>

        <div className="inspectorCard">
          <strong>Selected (Click)</strong>
          {selectedColor ? (
            <>
              <span
                className="swatch"
                style={{
                  backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`,
                }}
              />
              {renderColorRow("selected", selectedColor)}
            </>
          ) : (
            <p className="muted">No selected color</p>
          )}
        </div>
      </div>
    </section>
  );
}
