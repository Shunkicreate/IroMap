import { formatHsl, formatRgb, rgbToHex } from "@/domain/color/color-format";
import type { RgbColor } from "@/domain/color/color-types";
import { t } from "@/i18n/translate";

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
        <h2>{t("panelInspector")}</h2>
        <p>FR-1 / FR-2 / FR-3</p>
      </div>

      <div className="inspectorCards">
        <div className="inspectorCard">
          <strong>{t("inspectorPreview")}</strong>
          {hoverColor ? (
            <>
              <span
                className="swatch"
                style={{
                  backgroundColor: `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})`,
                }}
              />
              {renderColorRow(t("inspectorHoverLabel"), hoverColor)}
            </>
          ) : (
            <p className="muted">{t("inspectorNoHover")}</p>
          )}
        </div>

        <div className="inspectorCard">
          <strong>{t("inspectorSelected")}</strong>
          {selectedColor ? (
            <>
              <span
                className="swatch"
                style={{
                  backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`,
                }}
              />
              {renderColorRow(t("inspectorSelectedLabel"), selectedColor)}
            </>
          ) : (
            <p className="muted">{t("inspectorNoSelected")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
