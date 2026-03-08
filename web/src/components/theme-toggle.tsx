"use client";

import { useTheme } from "next-themes";
import { t } from "@/i18n/translate";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="themeToggleButton"
      aria-label={t("workbenchThemeLabel")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? t("workbenchThemeLight") : t("workbenchThemeDark")}
    </button>
  );
}
