import { ColorWorkbench } from "@/features/workbench/color-workbench";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/i18n/translate";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={`${styles.root} landingRoot`}>
      <section className={`${styles.hero} landingHero`}>
        <div className={`${styles.heroHeader} landingHeroHeader`}>
          <div className={styles.heroCopy}>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroDescription")}</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section id="workbench" className={`${styles.section} landingSection`}>
        <h2>{t("landingWorkbenchHeading")}</h2>
        <ColorWorkbench />
      </section>
    </main>
  );
}
