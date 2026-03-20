"use client";

import { ClipboardPaste, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { PanelHeader } from "@/components/workbench/panel-header";
import { PersistedDisclosure } from "@/components/workbench/persisted-disclosure";
import { hslToRgb } from "@/domain/color/color-conversion";
import { formatHsl, formatRgb, rgbToHex } from "@/domain/color/color-format";
import { toHueDegree, toPercentage, toRgbColor, type RgbColor } from "@/domain/color/color-types";
import { t } from "@/i18n/translate";

type Props = {
  hoverColor: RgbColor | null;
  selectedColor: RgbColor | null;
  contentStorageKey: string;
  onColorPasted?: (color: RgbColor) => void;
  onStatusChange?: (message: string) => void;
};

const PLACEHOLDER = "--";
const hexRegex = /^#?([\da-f]{3}|[\da-f]{6})$/i;
const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i;

const parsePastedColor = (raw: string): RgbColor | null => {
  const value = raw.trim();

  const hexMatch = value.match(hexRegex);
  if (hexMatch) {
    const normalized =
      hexMatch[1].length === 3
        ? hexMatch[1]
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : hexMatch[1];
    const parsed = Number.parseInt(normalized, 16);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return toRgbColor((parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255);
  }

  const rgbMatch = value.match(rgbRegex);
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1], 10);
    const g = Number.parseInt(rgbMatch[2], 10);
    const b = Number.parseInt(rgbMatch[3], 10);
    if ([r, g, b].some((channel) => Number.isNaN(channel) || channel < 0 || channel > 255)) {
      return null;
    }
    return toRgbColor(r, g, b);
  }

  const hslMatch = value.match(hslRegex);
  if (hslMatch) {
    const h = Number.parseInt(hslMatch[1], 10);
    const s = Number.parseInt(hslMatch[2], 10);
    const l = Number.parseInt(hslMatch[3], 10);
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
      return null;
    }
    return hslToRgb({
      h: toHueDegree(h),
      s: toPercentage(s),
      l: toPercentage(l),
    });
  }

  return null;
};

const renderSwatch = (color: RgbColor | null) => {
  if (!color) {
    return <span className="swatch swatchEmpty" aria-hidden="true" />;
  }
  return <ColorSwatch color={color} />;
};

export function ColorInspector({
  hoverColor,
  selectedColor,
  contentStorageKey,
  onColorPasted,
  onStatusChange,
}: Props) {
  const [message, setMessage] = useState<string>("");
  const selectedFormats = useMemo(() => {
    if (!selectedColor) {
      return [
        { label: t("copyFormatHex"), value: PLACEHOLDER },
        { label: t("copyFormatRgb"), value: PLACEHOLDER },
        { label: t("copyFormatHsl"), value: PLACEHOLDER },
      ];
    }

    return [
      { label: t("copyFormatHex"), value: rgbToHex(selectedColor) },
      { label: t("copyFormatRgb"), value: formatRgb(selectedColor) },
      { label: t("copyFormatHsl"), value: formatHsl(selectedColor) },
    ];
  }, [selectedColor]);

  const copyValue = async (value: string): Promise<void> => {
    if (!selectedColor) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(value);
      const success = t("copyCopied", { value });
      setMessage(success);
      onStatusChange?.(success);
      toast.success(success);
    } catch {
      const failed = t("copyFailed", { value });
      setMessage(failed);
      onStatusChange?.(failed);
      toast.error(failed);
    }
  };

  const pasteFromClipboard = async (): Promise<void> => {
    if (!navigator.clipboard?.readText) {
      const failed = t("copyPasteFailed");
      setMessage(failed);
      onStatusChange?.(failed);
      toast.error(failed);
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      const parsed = parsePastedColor(text);
      if (!parsed) {
        const unsupported = t("copyPasteUnsupported", { value: text || "(empty)" });
        setMessage(unsupported);
        onStatusChange?.(unsupported);
        toast.error(unsupported);
        return;
      }

      onColorPasted?.(parsed);
      const applied = t("copyPasteApplied", { value: rgbToHex(parsed) });
      setMessage(applied);
      onStatusChange?.(applied);
      toast.success(applied);
    } catch {
      const failed = t("copyPasteFailed");
      setMessage(failed);
      onStatusChange?.(failed);
      toast.error(failed);
    }
  };

  return (
    <section className="panel">
      <PanelHeader titleKey="panelInspector" requirementsKey="panelInspectorRequirements" />
      <PersistedDisclosure
        storageKey={contentStorageKey}
        isdefaultOpen={false}
        summary={t("workbenchInspectorDisclosure")}
      >
        <div className="inspectorCards">
          <div className="inspectorCard">
            <strong>{t("inspectorPreview")}</strong>
            {renderSwatch(hoverColor)}
            <div className="colorRow">
              <span>{t("inspectorHoverLabel")}</span>
              <code>{hoverColor ? rgbToHex(hoverColor) : PLACEHOLDER}</code>
              <code>{hoverColor ? formatRgb(hoverColor) : PLACEHOLDER}</code>
              <code>{hoverColor ? formatHsl(hoverColor) : PLACEHOLDER}</code>
            </div>
          </div>

          <div className="inspectorCard">
            <div className="inspectorCardHeader">
              <strong>{t("inspectorSelected")}</strong>
              <button
                type="button"
                className="inspectorPasteButton"
                onClick={() => void pasteFromClipboard()}
              >
                <ClipboardPaste className="inlineIcon" aria-hidden="true" />
                <span>{t("copyPasteButton")}</span>
              </button>
            </div>
            {renderSwatch(selectedColor)}
            <div className="colorRow colorRowSelected">
              <span>{t("inspectorSelectedLabel")}</span>
              {selectedFormats.map((item) => (
                <div key={item.label} className="copyValueRow">
                  <small>{item.label}</small>
                  <code>{item.value}</code>
                  <button
                    type="button"
                    className="iconButton"
                    onClick={() => void copyValue(item.value)}
                    disabled={!selectedColor}
                    aria-label={`${t("copyButton")}: ${item.label}`}
                    title={`${t("copyButton")}: ${item.label}`}
                  >
                    <Copy className="inlineIcon" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="muted copyStatus" aria-live="polite">
          {message || (!selectedColor ? t("copyNeedSelection") : "")}
        </p>
      </PersistedDisclosure>
    </section>
  );
}
