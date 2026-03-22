import { ColorWorkbench } from "@/features/workbench/color-workbench";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n/translate";

export default function Home() {
  return (
    <main className="landingRoot">
      <section className="landingHero">
        <div className="landingHeroHeader">
          <div>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroDescription")}</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section id="workbench" className="landingSection">
        <ColorWorkbench />
      </section>
    </main>
  );
}
