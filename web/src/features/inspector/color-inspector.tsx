import { ColorSwatch } from "@/components/workbench/color-swatch";
import { PanelHeader } from "@/components/workbench/panel-header";
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
      <PanelHeader titleKey="panelInspector" requirementsKey="panelInspectorRequirements" />

      <div className="inspectorCards">
        <div className="inspectorCard">
          <strong>{t("inspectorPreview")}</strong>
          {hoverColor ? (
            <>
              <ColorSwatch color={hoverColor} />
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
              <ColorSwatch color={selectedColor} />
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
