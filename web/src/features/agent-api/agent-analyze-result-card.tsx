import type {
  AnalyzeErrorResponse,
  AnalyzeSuccessResponse,
} from "@/domain/photo-analysis/agent-api-contract";
import styles from "./agent-analyze-page.module.css";

type Props = {
  error: AnalyzeErrorResponse | null;
  result: AnalyzeSuccessResponse | null;
};

export function AgentAnalyzeResultCard({ error, result }: Props) {
  return (
    <section className={styles.card}>
      <h2 className={styles.titleReset}>Response summary</h2>
      {error ? (
        <article>
          <p className={styles.errorCode}>{error.error.code}</p>
          <p className={styles.errorMessage}>{error.error.message}</p>
        </article>
      ) : null}
      {result ? (
        <article>
          <dl className={styles.summaryGrid}>
            <dt>Size</dt>
            <dd>
              {result.input.width} x {result.input.height}
            </dd>
            <dt>Color space</dt>
            <dd>{result.input.colorSpace}</dd>
            <dt>Brightness</dt>
            <dd>{result.summary.avgBrightness}</dd>
            <dt>Saturation</dt>
            <dd>{result.summary.avgSaturation}</dd>
            <dt>Description</dt>
            <dd>{result.summary.description}</dd>
          </dl>
          <div className={styles.swatchRow}>
            {result.summary.dominantColors.map((color) => (
              <div key={color.hex} className={styles.swatchItem}>
                <div className={styles.swatch}>
                  <svg viewBox="0 0 40 40" className={styles.swatchSvg} aria-hidden="true">
                    <rect x="0" y="0" width="40" height="40" rx="12" ry="12" fill={color.hex} />
                  </svg>
                </div>
                <div>
                  <div className={styles.swatchHex}>{color.hex}</div>
                  <div className={styles.swatchRatio}>{(color.ratio * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : (
        <p className={styles.empty}>No analysis result yet.</p>
      )}
    </section>
  );
}
