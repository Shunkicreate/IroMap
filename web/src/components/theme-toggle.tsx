"use client";

import { useTheme } from "next-themes";
import { t } from "@/i18n/translate";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const safeTheme = resolvedTheme ?? "system";
  const isDark = safeTheme === "dark";

  return (
    <button
      type="button"
      className="themeToggleButton"
      aria-label={t("themeToggleAriaLabel")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {t("themeToggleButtonLabel")}
    </button>
  );
}
