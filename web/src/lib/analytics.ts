import {
  analyticsPagePath,
  getAnalyticsControl,
  type AnalyticsAction,
  type AnalyticsControlId,
  type AnalyticsOutcome,
} from "@/lib/analytics-catalog";
import {
  analyticsCookieLifetimeSeconds,
  analyticsConsentVersion,
  hasCurrentAnalyticsConsent,
} from "@/lib/analytics-consent";

type Journey = {
  id: string;
  startedAt: number;
  lastAt: number;
  sequence: number;
  previousEvent: string;
  previousControl: string;
};

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

const storageKey = "iromap.analytics.journey.v1";
const inactivityMs = 30 * 60 * 1000;
let journey: Journey | null = null;
let lastPagePath: string | null = null;
let isInitialized = false;
let consentGeneration = 0;
const scriptId = "iromap-google-analytics";

export function isAnalyticsConfigured(): boolean {
  return (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" &&
    /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "")
  );
}

export function isAnalyticsEnabled(): boolean {
  return isAnalyticsConfigured() && hasCurrentAnalyticsConsent() && isInitialized;
}

function googleCommand(...args: unknown[]): void {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.gtag ??= function () {
    // eslint-disable-next-line prefer-rest-params -- Match Google's dataLayer command format.
    analyticsWindow.dataLayer!.push(arguments);
  };
  analyticsWindow.gtag(...args);
}

export function initializeAnalytics(): void {
  if (!isAnalyticsConfigured() || !hasCurrentAnalyticsConsent() || isInitialized) return;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;
  try {
    Reflect.set(window, `ga-disable-${measurementId}`, false);
    const denied = Object.fromEntries(
      ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"].map((key) => [
        key,
        "denied",
      ])
    );
    googleCommand("consent", "default", denied);
    googleCommand("consent", "update", { ...denied, ["analytics_storage"]: "granted" });
    googleCommand("js", new Date());
    const pagePath = analyticsPagePath(window.location.pathname);
    googleCommand(
      "config",
      measurementId,
      Object.fromEntries([
        ["send_page_view", false],
        ["allow_google_signals", false],
        ["allow_ad_personalization_signals", false],
        ["cookie_domain", "none"],
        ["cookie_expires", analyticsCookieLifetimeSeconds],
        ["cookie_update", false],
        ["page_location", window.location.origin + pagePath],
        ["page_referrer", document.referrer ? new URL(document.referrer).origin : ""],
      ])
    );
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
    isInitialized = true;
  } catch {
    disableAnalytics();
  }
}

export function disableAnalytics(): void {
  if (typeof window === "undefined") return;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (measurementId) Reflect.set(window, `ga-disable-${measurementId}`, true);
  isInitialized = false;
  consentGeneration += 1;
  journey = null;
  lastPagePath = null;
  const analyticsWindow = window as AnalyticsWindow;
  if (analyticsWindow.dataLayer) analyticsWindow.dataLayer.length = 0;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    /* Storage can be blocked. */
  }
  // Delete only GA cookies, including cookies set by an earlier parent-domain setup.
  try {
    const domains = window.location.hostname.split(".");
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      for (let index = 0; index < domains.length - 1; index += 1) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${domains.slice(index).join(".")}; SameSite=Lax`;
      }
    }
  } catch {
    // Collection remains disabled even when the browser blocks cookie access.
  }
}

function readJourney(now: number): Journey {
  if (!journey) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as Journey | null;
      if (
        stored &&
        /^[a-f0-9-]{36}$/.test(stored.id) &&
        Number.isFinite(stored.startedAt) &&
        Number.isFinite(stored.lastAt) &&
        Number.isSafeInteger(stored.sequence) &&
        stored.sequence >= 0 &&
        ["ui_action", "feature_use", "operation_result", "page_view"].includes(
          stored.previousEvent
        ) &&
        (stored.previousControl === "page" || getAnalyticsControl(stored.previousControl))
      ) {
        journey = stored;
      }
    } catch {
      // Storage can be blocked. The current document still gets a timeline.
    }
  }
  if (!journey || now - journey.lastAt >= inactivityMs || now < journey.lastAt) {
    journey = {
      id: crypto.randomUUID(),
      startedAt: now,
      lastAt: now,
      sequence: 0,
      previousEvent: "none",
      previousControl: "none",
    };
  }
  return journey;
}

function emit(
  eventName: "ui_action" | "feature_use" | "operation_result" | "page_view",
  controlId: AnalyticsControlId | "page",
  action: AnalyticsAction | AnalyticsOutcome | "started" | "view",
  operationId?: string,
  durationMs?: number
): void {
  if (!isAnalyticsEnabled()) return;
  try {
    const control =
      controlId === "page" ? ["page", "navigation", "page"] : getAnalyticsControl(controlId);
    if (!control) return;
    const now = Date.now();
    const current = readJourney(now);
    const pagePath = analyticsPagePath(window.location.pathname);
    // Build only known parameters; DOM text, input values and raw URLs never enter here.
    const params = Object.fromEntries([
      ["feature", control[1]],
      ["control_id", control[0]],
      ["destination", controlId === "page" ? pagePath : control[2]],
      ["action", action],
      ["consent_version", analyticsConsentVersion],
      ["page_path", pagePath],
      ["page_location", window.location.origin + pagePath],
      ["page_referrer", document.referrer ? new URL(document.referrer).origin : ""],
      ["journey_id", current.id],
      ["event_sequence", current.sequence + 1],
      ["occurred_at_ms", now],
      ["journey_elapsed_ms", Math.max(0, now - current.startedAt)],
      ["since_previous_ms", Math.max(0, now - current.lastAt)],
      ["previous_event", current.previousEvent],
      ["previous_control", current.previousControl],
      ...(operationId ? [["operation_id", operationId]] : []),
      ...(durationMs === undefined ? [] : [["duration_ms", Math.max(0, Math.round(durationMs))]]),
    ]);
    current.sequence += 1;
    current.lastAt = now;
    current.previousEvent = eventName;
    current.previousControl = controlId;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(current));
    } catch {
      // Continue in memory when sessionStorage is unavailable or full.
    }
    googleCommand("event", eventName, params);
  } catch {
    // Analytics is best effort and must never interrupt a user operation.
  }
}

export function trackUiAction(id: AnalyticsControlId, action: AnalyticsAction): void {
  emit("ui_action", id, action);
}

export function trackFeature(id: AnalyticsControlId, action: AnalyticsAction = "select"): void {
  emit("feature_use", id, action);
}

export function startAnalyticsOperation(
  id: AnalyticsControlId
): (outcome: AnalyticsOutcome) => void {
  if (!isAnalyticsEnabled()) return () => {};
  const startedAt = performance.now();
  const generation = consentGeneration;
  let operationId: string;
  try {
    operationId = crypto.randomUUID();
  } catch {
    return () => {};
  }
  let isFinished = false;
  emit("operation_result", id, "started", operationId);
  return (outcome) => {
    if (isFinished || generation !== consentGeneration) return;
    isFinished = true;
    emit("operation_result", id, outcome, operationId, performance.now() - startedAt);
  };
}

export function trackPageView(pathname: string): void {
  const pagePath = analyticsPagePath(pathname);
  if (lastPagePath === pagePath || !isAnalyticsEnabled()) return;
  lastPagePath = pagePath;
  emit("page_view", "page", "view");
}
