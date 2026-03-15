"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { AnalyzeErrorResponse, AnalyzeSuccessResponse } from "@/lib/agent-analyze-schema";
import styles from "./agent-analyze-page.module.css";

const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

export function AgentAnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<AnalyzeSuccessResponse | null>(null);
  const [error, setError] = useState<AnalyzeErrorResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!file) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const requestHeaders = new Headers();
      requestHeaders.append("accept", "application/json");
      requestHeaders.append("content-type", file.type);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: requestHeaders,
        body: await file.arrayBuffer(),
      });

      const payload = (await response.json()) as AnalyzeSuccessResponse | AnalyzeErrorResponse;
      if (!response.ok || "error" in payload) {
        setError(payload as AnalyzeErrorResponse);
        return;
      }

      setResult(payload as AnalyzeSuccessResponse);
    } catch {
      setError({
        error: {
          code: "INTERNAL_ERROR",
          message: "Request failed before the server returned a response.",
          retryable: true,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Analyze</p>
        <h1 className={styles.heroTitle}>AI agent image analysis</h1>
        <p className={styles.heroDescription}>
          Upload an image to call the same raw-body API that agents use. The page renders a structured HTML result
          while the API returns JSON.
        </p>
      </section>

      <form onSubmit={onSubmit} className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.titleReset}>Input</h2>
          <p className={styles.muted}>Supported types: {supportedTypes.join(", ")}</p>
          <input
            type="file"
            accept={supportedTypes.join(",")}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
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
      </form>

      {result ? (
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
      ) : null}
    </main>
  );
}
