"use client";

import { useMemo, useState } from "react";
import { PanelHeader } from "@/components/workbench/panel-header";
import {
  type CopyFormat,
  formatColor,
  formatHsl,
  formatRgb,
  rgbToHex,
} from "@/domain/color/color-format";
import { hslToRgb } from "@/domain/color/color-conversion";
import { toHueDegree, toPercentage, toRgbColor, type RgbColor } from "@/domain/color/color-types";
import { t } from "@/i18n/translate";

type Props = {
  selectedColor: RgbColor | null;
  onColorPasted?: (color: RgbColor) => void;
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

export function ColorCopyPanel({ selectedColor, onColorPasted }: Props) {
  const [format, setFormat] = useState<CopyFormat>("hex");
  const [message, setMessage] = useState<string>("");

  const formatted = useMemo(() => {
    if (!selectedColor) {
      return PLACEHOLDER;
    }
    return formatColor(selectedColor, format);
  }, [format, selectedColor]);

  const canCopy = selectedColor !== null;

  const copyToClipboard = async (): Promise<void> => {
    if (!selectedColor) {
      return;
    }

    const value = formatColor(selectedColor, format);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setMessage(t("copyCopied", { value }));
    } catch {
      setMessage(t("copyFailed", { value }));
    }
  };

  const pasteFromClipboard = async (): Promise<void> => {
    if (!navigator.clipboard?.readText) {
      setMessage(t("copyPasteFailed"));
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      const parsed = parsePastedColor(text);

      if (!parsed) {
        setMessage(t("copyPasteUnsupported", { value: text || "(empty)" }));
        return;
      }

      onColorPasted?.(parsed);
      setMessage(t("copyPasteApplied", { value: formatColor(parsed, format) }));
    } catch {
      setMessage(t("copyPasteFailed"));
    }
  };

  return (
    <section className="panel">
      <PanelHeader titleKey="panelColorCopy" requirementsKey="panelColorCopyRequirements" />

      <div className="copyFormats copyFormatsCompact">
        <label>
          {t("copyFormatLabel")}
          <select value={format} onChange={(event) => setFormat(event.target.value as CopyFormat)}>
            <option value="hex">{t("copyFormatHex")}</option>
            <option value="rgb">{t("copyFormatRgb")}</option>
            <option value="hsl">{t("copyFormatHsl")}</option>
          </select>
        </label>
        <button type="button" onClick={copyToClipboard} disabled={!canCopy}>
          {t("copyButton")}
        </button>
        <button type="button" onClick={pasteFromClipboard}>
          {t("copyPasteButton")}
        </button>
      </div>

      <code className="copyValue">{formatted}</code>

      <div className="copyAllFormats copyAllFormatsCompact">
        <span>{selectedColor ? rgbToHex(selectedColor) : PLACEHOLDER}</span>
        <span>{selectedColor ? formatRgb(selectedColor) : PLACEHOLDER}</span>
        <span>{selectedColor ? formatHsl(selectedColor) : PLACEHOLDER}</span>
      </div>

      <p className="muted copyStatus" aria-live="polite">
        {message || (!canCopy ? t("copyNeedSelection") : "")}
      </p>
    </section>
  );
}
