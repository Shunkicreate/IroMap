import { ColorWorkbench } from "@/features/workbench/color-workbench";
import { t } from "@/i18n/translate";

export default function Home() {
  return (
    <main className="landingRoot">
      <section className="landingHero">
        <h1>{t("heroTitle")}</h1>
        <p>{t("heroDescription")}</p>
        <div className="landingHeroActions">
          <a href="#workbench">{t("heroStartButton")}</a>
          <a href="/docs/specs/README.md">{t("heroDocsButton")}</a>
        </div>
      </section>

      <section id="workbench" className="landingSection">
        <h2>{t("landingWorkbenchHeading")}</h2>
        <ColorWorkbench />
      </section>

      <section className="landingSection">
        <h2>{t("landingFeatureHeading")}</h2>
        <div className="landingFeatureGrid">
          <article>
            <h3>{t("landingFeatureCubeTitle")}</h3>
            <p>{t("landingFeatureCubeDescription")}</p>
          </article>
          <article>
            <h3>{t("landingFeatureSliceTitle")}</h3>
            <p>{t("landingFeatureSliceDescription")}</p>
          </article>
          <article>
            <h3>{t("landingFeaturePhotoTitle")}</h3>
            <p>{t("landingFeaturePhotoDescription")}</p>
          </article>
        </div>
      </section>

      <section className="landingSection">
        <h2>{t("landingDocsHeading")}</h2>
        <div className="landingDocLinks">
          <a href="/docs/specs/README.md">{t("landingDocsSpecs")}</a>
          <a href="/docs/architecture/overview.md">{t("landingDocsArchitecture")}</a>
          <a href="/docs/development/README.md">{t("landingDocsDevelopment")}</a>
        </div>
      </section>
    </main>
  );
}
