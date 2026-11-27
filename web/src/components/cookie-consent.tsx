"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useAnalyticsConsent } from "@/components/use-analytics-consent";
import { disableAnalytics } from "@/lib/analytics";
import { analyticsConsentVersion, saveAnalyticsConsent } from "@/lib/analytics-consent";
import { t } from "@/i18n/translate";
import styles from "./cookie-consent.module.css";

export function CookieConsent() {
  const consent = useAnalyticsConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasStorageError, setHasStorageError] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const isVisible = !consent || isSettingsOpen;

  const choose = (decision: "granted" | "denied"): void => {
    // Disable synchronously before storage notifications or React effects.
    if (decision === "denied") disableAnalytics();
    const hasSaved = saveAnalyticsConsent(decision);
    setHasStorageError(!hasSaved);
    if (!hasSaved) {
      disableAnalytics();
      return;
    }
    setIsSettingsOpen(false);
    settingsButtonRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <footer className={styles.footer}>
        <button
          ref={settingsButtonRef}
          type="button"
          data-analytics-mode="consent"
          className={styles.settingsButton}
          aria-expanded={isVisible}
          aria-controls="analytics-consent"
          onClick={() => setIsSettingsOpen(true)}
        >
          {t("consentSettings")}
        </button>
        <Link href="/privacy">{t("consentDetails")}</Link>
      </footer>
      {isVisible ? (
        <section
          id="analytics-consent"
          className={styles.banner}
          aria-labelledby="analytics-consent-title"
        >
          <div className={styles.content}>
            <h2 id="analytics-consent-title">{t("consentTitle")}</h2>
            <p>{t("consentPurpose")}</p>
            <p>{t("consentData")}</p>
            <p>{t("consentChoice")}</p>
            <p>{t("consentSource")}</p>
            <div className={styles.meta}>
              <Link href="/privacy">{t("consentDetails")}</Link>
              <a href="https://github.com/Shunkicreate/IroMap">{t("consentSourceLink")}</a>
              <span>{t("consentVersion", { version: analyticsConsentVersion })}</span>
            </div>
            {hasStorageError ? <p role="alert">{t("consentStorageError")}</p> : null}
          </div>
          <div className={styles.actions}>
            <button type="button" data-analytics-mode="consent" onClick={() => choose("granted")}>
              {t("consentAccept")}
            </button>
            <button type="button" data-analytics-mode="consent" onClick={() => choose("denied")}>
              {t("consentReject")}
            </button>
            {consent ? (
              <button
                type="button"
                data-analytics-mode="consent"
                onClick={() => {
                  setIsSettingsOpen(false);
                  settingsButtonRef.current?.focus({ preventScroll: true });
                }}
              >
                {t("consentClose")}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
