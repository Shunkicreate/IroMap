import analyticsConsentScope from "@/lib/analytics-consent-scope.json";

export const analyticsConsentVersion = analyticsConsentScope.version;
export const analyticsConsentStorageKey = "iromap.privacy.analytics-consent";
export const analyticsConsentLifetimeMs =
  analyticsConsentScope.consentRetentionDays * 24 * 60 * 60 * 1000;
export const analyticsCookieLifetimeSeconds =
  analyticsConsentScope.cookieRetentionDays * 24 * 60 * 60;
const consentChangeEvent = "iromap:analytics-consent-change";
let isLocallyBlocked = false;

export type AnalyticsConsent = {
  schemaVersion: 1;
  policyVersion: string;
  decision: "granted" | "denied";
  decidedAt: number;
  expiresAt: number;
};

export function parseAnalyticsConsent(raw: string | null): AnalyticsConsent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<AnalyticsConsent> | null;
    const now = Date.now();
    if (
      value?.schemaVersion !== 1 ||
      value.policyVersion !== analyticsConsentVersion ||
      (value.decision !== "granted" && value.decision !== "denied") ||
      typeof value.decidedAt !== "number" ||
      !Number.isFinite(value.decidedAt) ||
      value.decidedAt > now ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt !== value.decidedAt + analyticsConsentLifetimeMs ||
      value.expiresAt <= now
    )
      return null;
    return value as AnalyticsConsent;
  } catch {
    return null;
  }
}

export function getAnalyticsConsentSnapshot(): string | null {
  if (typeof window === "undefined" || isLocallyBlocked) return null;
  try {
    const raw = window.localStorage.getItem(analyticsConsentStorageKey);
    return parseAnalyticsConsent(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function hasCurrentAnalyticsConsent(): boolean {
  return parseAnalyticsConsent(getAnalyticsConsentSnapshot())?.decision === "granted";
}

export function notifyAnalyticsConsentChange(): void {
  window.dispatchEvent(new Event(consentChangeEvent));
}

export function saveAnalyticsConsent(decision: AnalyticsConsent["decision"]): boolean {
  const decidedAt = Date.now();
  const value: AnalyticsConsent = {
    schemaVersion: 1,
    policyVersion: analyticsConsentVersion,
    decision,
    decidedAt,
    expiresAt: decidedAt + analyticsConsentLifetimeMs,
  };
  try {
    window.localStorage.setItem(analyticsConsentStorageKey, JSON.stringify(value));
    isLocallyBlocked = false;
    notifyAnalyticsConsentChange();
    return true;
  } catch {
    // A failed write must never reuse an earlier grant in this document.
    isLocallyBlocked = true;
    try {
      window.localStorage.removeItem(analyticsConsentStorageKey);
    } catch {
      /* Storage is unavailable. */
    }
    notifyAnalyticsConsentChange();
    return false;
  }
}

export function subscribeAnalyticsConsent(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === analyticsConsentStorageKey || event.key === null) onChange();
  };
  window.addEventListener(consentChangeEvent, onChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(consentChangeEvent, onChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", onChange);
  };
}
