"use client";

import { useTheme } from "next-themes";
import { observationColors } from "@/lib/observation-colors";

export function useObservationColors() {
  const { resolvedTheme } = useTheme();
  return observationColors[resolvedTheme === "dark" ? "dark" : "light"];
}
