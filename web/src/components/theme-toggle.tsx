"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { t } from "@/i18n/translate";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextThemeLabel = t(isDark ? "workbenchThemeLight" : "workbenchThemeDark");
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      className="themeToggleButton"
      aria-label={`${t("workbenchThemeLabel")}: ${nextThemeLabel}`}
      title={nextThemeLabel}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <ThemeIcon className="inlineIcon inlineIconLg" aria-hidden="true" />
      <span className="srOnly">{nextThemeLabel}</span>
    </button>
  );
}
