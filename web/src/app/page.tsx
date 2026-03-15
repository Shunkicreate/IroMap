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
        </div>
      </section>

      <section id="workbench" className="landingSection">
        <h2>{t("landingWorkbenchHeading")}</h2>
        <ColorWorkbench />
      </section>
    </main>
  );
}
