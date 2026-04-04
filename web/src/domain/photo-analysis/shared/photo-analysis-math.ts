// Shared numeric helpers used by both base analysis and derived analysis.

export const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

export const standardDeviation = (values: number[]): number | null => {
  const avg = mean(values);
  if (avg == null) {
    return null;
  }
  const variance =
    values.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) / values.length;
  return Math.sqrt(variance);
};

export const percentile = (values: number[], ratio: number): number | null => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index] ?? null;
};
