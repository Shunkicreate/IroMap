"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getAnalyticsConsentSnapshot,
  notifyAnalyticsConsentChange,
  parseAnalyticsConsent,
  subscribeAnalyticsConsent,
} from "@/lib/analytics-consent";

const getServerSnapshot = () => null;

export function useAnalyticsConsent() {
  const snapshot = useSyncExternalStore(
    subscribeAnalyticsConsent,
    getAnalyticsConsentSnapshot,
    getServerSnapshot
  );
  const consent = useMemo(() => parseAnalyticsConsent(snapshot), [snapshot]);
  useEffect(() => {
    if (!consent) return;
    let timer: number;
    const scheduleExpiry = (): void => {
      const remaining = consent.expiresAt - Date.now();
      if (remaining <= 0) {
        notifyAnalyticsConsentChange();
        return;
      }
      timer = window.setTimeout(scheduleExpiry, Math.min(remaining, 2_147_483_647));
    };
    scheduleExpiry();
    return () => window.clearTimeout(timer);
  }, [consent]);
  return consent;
}
