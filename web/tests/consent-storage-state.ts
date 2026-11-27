import {
  analyticsConsentLifetimeMs,
  analyticsConsentStorageKey,
  analyticsConsentVersion,
} from "../src/lib/analytics-consent";

// UI regression tests run with analytics rejected. Consent flows have their own clean-context suite.
export function deniedConsentStorageState(baseUrl: string) {
  const decidedAt = Date.now();
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(baseUrl).origin,
        localStorage: [
          {
            name: analyticsConsentStorageKey,
            value: JSON.stringify({
              schemaVersion: 1,
              policyVersion: analyticsConsentVersion,
              decision: "denied",
              decidedAt,
              expiresAt: decidedAt + analyticsConsentLifetimeMs,
            }),
          },
        ],
      },
    ],
  };
}
