import { ColorWorkbench } from "@/features/workbench/color-workbench";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n/translate";

export default function Home() {
  return (
    <main className="landingPage">
      <section className="landingHero">
        <div className="landingHeroTopBar">
          <p className="landingEyebrow">{t("landingEyebrow")}</p>
          <ThemeToggle />
        </div>
        <h1>{t("landingTitle")}</h1>
        <p className="landingLead">{t("landingLead")}</p>
        <a href="#workbench-preview" className="landingCta">
          {t("landingCta")}
        </a>
      </section>

      <section id="workbench-preview" className="landingSection">
        <div className="landingSectionHeader">
          <h2>{t("landingWorkbenchTitle")}</h2>
          <p>{t("landingWorkbenchDescription")}</p>
        </div>
        <ColorWorkbench />
      </section>

      <section className="landingSection">
        <div className="landingSectionHeader">
          <h2>{t("landingFeaturesTitle")}</h2>
        </div>
        <div className="featureCards">
          <article className="featureCard">
            <h3>{t("landingFeature1Title")}</h3>
            <p>{t("landingFeature1Description")}</p>
          </article>
          <article className="featureCard">
            <h3>{t("landingFeature2Title")}</h3>
            <p>{t("landingFeature2Description")}</p>
          </article>
          <article className="featureCard">
            <h3>{t("landingFeature3Title")}</h3>
            <p>{t("landingFeature3Description")}</p>
          </article>
        </div>
      </section>

      <section className="landingSection">
        <div className="landingSectionHeader">
          <h2>{t("landingDocsTitle")}</h2>
          <p>{t("landingDocsDescription")}</p>
        </div>
        <a
          href="https://github.com/Shunkicreate/IroMap/tree/main/docs"
          target="_blank"
          rel="noreferrer"
          className="landingDocsLink"
        >
          {t("landingDocsLink")}
        </a>
      </section>
    </main>
  );
}
