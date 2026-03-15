import Image from "next/image";
import styles from "./agent-analyze-page.module.css";

type Props = {
  file: File | null;
  isSubmitting: boolean;
  previewUrl: string;
  supportedTypes: readonly string[];
  onFileChange: (file: File | null) => void;
};

export function AgentAnalyzeInputCard(props: Props) {
  const { file, isSubmitting, previewUrl, supportedTypes, onFileChange } = props;

  return (
    <section className={styles.card}>
      <h2 className={styles.titleReset}>Input</h2>
      <p className={styles.muted}>Supported types: {supportedTypes.join(", ")}</p>
      <input
        type="file"
        accept={supportedTypes.join(",")}
        onChange={(event) => {
          onFileChange(event.target.files?.[0] ?? null);
        }}
      />
      <div className={styles.buttonRow}>
        <button type="submit" disabled={!file || isSubmitting} className={styles.button}>
          {isSubmitting ? "Analyzing..." : "Analyze image"}
        </button>
      </div>
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt={file?.name ?? "Uploaded preview"}
          className={styles.preview}
          width={800}
          height={560}
          unoptimized
        />
      ) : null}
    </section>
  );
}
