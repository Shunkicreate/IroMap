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
    </main>
  );
}
