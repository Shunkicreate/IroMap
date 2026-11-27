import Link from "next/link";
import { analyticsConsentVersion } from "@/lib/analytics-consent";
import { t } from "@/i18n/translate";
import styles from "@/components/cookie-consent.module.css";

export default function PrivacyPage() {
  return (
    <main className={styles.policy}>
      <h1>{t("consentDetails")}</h1>
      <p>{t("consentVersion", { version: analyticsConsentVersion })}</p>
      <p>{t("consentSource")}</p>
      <p>
        <a href="https://github.com/Shunkicreate/IroMap">{t("consentSourceLink")}</a>
      </p>
      <h2>{t("privacyPurposeTitle")}</h2>
      <p>{t("consentPurpose")}</p>
      <h2>{t("privacyChangesTitle")}</h2>
      <p>{t("privacyChanges")}</p>
      <h2>{t("privacyDataTitle")}</h2>
      <p>{t("consentData")}</p>
      <p>{t("privacyDataDetails")}</p>
      <h2>{t("privacyStorageTitle")}</h2>
      <p>{t("privacyStorage")}</p>
      <p>{t("privacyGoogleRetention")}</p>
      <h2>{t("privacyWithdrawalTitle")}</h2>
      <p>{t("consentChoice")}</p>
      <p>{t("privacyWithdrawal")}</p>
      <h2>{t("privacyPreferencesTitle")}</h2>
      <p>{t("privacyPreferences")}</p>
      <h2>{t("privacyGoogleTitle")}</h2>
      <p>
        <a href="https://policies.google.com/technologies/partner-sites?hl=ja">
          {t("privacyGoogleUsage")}
        </a>
      </p>
      <p>
        <a href="https://policies.google.com/privacy?hl=ja">{t("privacyGooglePolicy")}</a>
      </p>
      <p>
        <Link href="/">{t("privacyBack")}</Link>
      </p>
    </main>
  );
}
