"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnalyticsControl } from "@/lib/analytics-catalog";
import {
  disableAnalytics,
  initializeAnalytics,
  isAnalyticsEnabled,
  trackFeature,
  trackPageView,
  trackUiAction,
} from "@/lib/analytics";
import { hasCurrentAnalyticsConsent, subscribeAnalyticsConsent } from "@/lib/analytics-consent";
import { useAnalyticsConsent } from "@/components/use-analytics-consent";

export function UsageAnalytics() {
  const pathname = usePathname();
  const consent = useAnalyticsConsent();

  useEffect(() => {
    if (!hasCurrentAnalyticsConsent()) {
      disableAnalytics();
      return;
    }
    initializeAnalytics();
    trackPageView(pathname);
  }, [pathname, consent]);

  useEffect(
    () =>
      subscribeAnalyticsConsent(() => {
        if (!hasCurrentAnalyticsConsent()) disableAnalytics();
      }),
    []
  );

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    const handleClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-analytics-id]");
      if (!target || target.dataset.analyticsMode === "manual") return;
      if (target.matches(":disabled, [aria-disabled='true'], input, select, summary")) return;
      const control = getAnalyticsControl(target.dataset.analyticsId ?? "");
      if (control) {
        const action =
          target.getAttribute("role") === "checkbox"
            ? target.getAttribute("aria-checked") === "true"
              ? "disable"
              : "enable"
            : "click";
        trackUiAction(control[0], action);
      }
    };
    const handleChange = (event: Event): void => {
      if (!(event.target instanceof HTMLElement)) return;
      const target = event.target;
      if (target.dataset.analyticsMode === "manual") return;
      const control = getAnalyticsControl(target.dataset.analyticsId ?? "");
      if (control) trackUiAction(control[0], "change");
    };
    const handleToggle = (event: Event): void => {
      if (!(event.target instanceof HTMLDetailsElement)) return;
      const control = getAnalyticsControl(event.target.dataset.analyticsId ?? "");
      if (control) trackUiAction(control[0], event.target.open ? "open" : "close");
    };
    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleChange, true);
    document.addEventListener("toggle", handleToggle, true);
    const scrollMilestones = [25, 50, 75, 90] as const;
    const scrollProgress = (): number => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      return height > 0 ? Math.max(0, (window.scrollY / height) * 100) : 0;
    };
    const reached = new Set<number>(scrollMilestones.filter((value) => value <= scrollProgress()));
    let scrollTimer: number | undefined;
    const handleScroll = (): void => {
      if (scrollTimer !== undefined) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = undefined;
        for (const milestone of scrollMilestones) {
          if (!reached.has(milestone) && scrollProgress() >= milestone) {
            reached.add(milestone);
            trackFeature(`page-scroll-${milestone}`, "scroll");
          }
        }
      }, 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", handleChange, true);
      document.removeEventListener("toggle", handleToggle, true);
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer !== undefined) window.clearTimeout(scrollTimer);
    };
  }, [pathname, consent]);

  return null;
}
