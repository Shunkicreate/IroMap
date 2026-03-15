import type { AnalyzeSuccessResponse } from "@/domain/photo-analysis/agent-api-contract";
import styles from "./agent-analyze-page.module.css";

type Props = {
  result: AnalyzeSuccessResponse;
};

export function AgentAnalyzeExplanations({ result }: Props) {
  return (
    <article className={`${styles.card} ${styles.explanations}`}>
      <h2>Visualization explanations</h2>
      <div className={styles.explanationList}>
        {result.explanations.map((item) => (
          <section key={item.id} className={styles.explanationCard}>
            <h3>{item.title}</h3>
            <p className={styles.muted}>{item.description}</p>
            <p>{item.findings}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
