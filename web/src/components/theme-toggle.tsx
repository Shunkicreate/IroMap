"use client";

import { useTheme } from "next-themes";
import { t } from "@/i18n/translate";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextThemeLabel = t(isDark ? "workbenchThemeLight" : "workbenchThemeDark");
  const iconName = isDark ? "light_mode" : "dark_mode";

  return (
    <button
      type="button"
      className="themeToggleButton"
      aria-label={`${t("workbenchThemeLabel")}: ${nextThemeLabel}`}
      title={nextThemeLabel}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="materialSymbol" aria-hidden="true">
        {iconName}
      </span>
      <span className="srOnly">{nextThemeLabel}</span>
    </button>
  );
}
