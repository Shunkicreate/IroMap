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
import type { RgbColor } from "@/domain/color/color-types";
import { t } from "@/i18n/translate";

type Props = {
  selectedColor: RgbColor | null;
};

const PLACEHOLDER = "--";

export function ColorCopyPanel({ selectedColor }: Props) {
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

  return (
    <section className="panel">
      <PanelHeader titleKey="panelColorCopy" requirementsKey="panelColorCopyRequirements" />

      <div className="copyFormats copyFormatsCompact">
        <label>
          {t("copyFormatLabel")}
          <select value={format} onChange={(event) => setFormat(event.target.value as CopyFormat)}>
            <option value="hex">HEX</option>
            <option value="rgb">rgb()</option>
            <option value="hsl">hsl()</option>
          </select>
        </label>
        <button type="button" onClick={copyToClipboard} disabled={!canCopy}>
          {t("copyButton")}
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
