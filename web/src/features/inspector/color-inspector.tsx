import { ColorSwatch } from "@/components/workbench/color-swatch";
import { PanelHeader } from "@/components/workbench/panel-header";
import { formatHsl, formatRgb, rgbToHex } from "@/domain/color/color-format";
import type { RgbColor } from "@/domain/color/color-types";
import { t } from "@/i18n/translate";

type Props = {
  hoverColor: RgbColor | null;
  selectedColor: RgbColor | null;
};

const PLACEHOLDER = "--";

const renderColorRow = (label: string, color: RgbColor | null) => {
  return (
    <div className="colorRow">
      <span>{label}</span>
      <code>{color ? rgbToHex(color) : PLACEHOLDER}</code>
      <code>{color ? formatRgb(color) : PLACEHOLDER}</code>
      <code>{color ? formatHsl(color) : PLACEHOLDER}</code>
    </div>
  );
};

const renderSwatch = (color: RgbColor | null) => {
  if (!color) {
    return <span className="swatch swatchEmpty" aria-hidden="true" />;
  }
  return <ColorSwatch color={color} />;
};

export function ColorInspector({ hoverColor, selectedColor }: Props) {
  return (
    <section className="panel">
      <PanelHeader titleKey="panelInspector" requirementsKey="panelInspectorRequirements" />

      <div className="inspectorCards">
        <div className="inspectorCard">
          <strong>{t("inspectorPreview")}</strong>
          {renderSwatch(hoverColor)}
          {renderColorRow(t("inspectorHoverLabel"), hoverColor)}
        </div>

        <div className="inspectorCard">
          <strong>{t("inspectorSelected")}</strong>
          {renderSwatch(selectedColor)}
          {renderColorRow(t("inspectorSelectedLabel"), selectedColor)}
        </div>
      </div>
    </section>
  );
}
