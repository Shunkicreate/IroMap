"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type {
  AnalyzeErrorResponse,
  AnalyzeSuccessResponse,
} from "@/domain/photo-analysis/agent-api-contract";
import { AgentAnalyzeExplanations } from "@/features/agent-api/agent-analyze-explanations";
import { AgentAnalyzeInputCard } from "@/features/agent-api/agent-analyze-input-card";
import { AgentAnalyzeResultCard } from "@/features/agent-api/agent-analyze-result-card";
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
          Upload an image to call the same raw-body API that agents use. The page renders a
          structured HTML result while the API returns JSON.
        </p>
      </section>

      <form onSubmit={onSubmit} className={styles.grid}>
        <AgentAnalyzeInputCard
          file={file}
          isSubmitting={isSubmitting}
          previewUrl={previewUrl}
          supportedTypes={supportedTypes}
          onFileChange={setFile}
        />
        <AgentAnalyzeResultCard error={error} result={result} />
      </form>

      {result ? <AgentAnalyzeExplanations result={result} /> : null}
    </main>
  );
}
