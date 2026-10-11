export const parseInteger = (name, rawValue, minimum = 1) => {
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer >= ${minimum}, received ${rawValue}`);
  }
  return value;
};

export const summarize = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return {
    count: values.length,
    avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    min: sorted[0] ?? Number.NaN,
    median:
      sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : (sorted[middle] ?? Number.NaN),
    max: sorted.at(-1) ?? Number.NaN,
  };
};

export const checkBudgets = (results, budgets) => {
  const failures = [];
  if (results.length === 0 || Object.keys(budgets).length === 0) {
    throw new Error("Performance results and budgets must not be empty");
  }
  for (const [size, metrics] of Object.entries(budgets)) {
    const row = results.find((result) => result.size === size);
    if (!row) {
      failures.push(`${size}: missing benchmark result`);
      continue;
    }
    if (Object.keys(metrics).length === 0) {
      throw new Error(`${size}: no metric budgets configured`);
    }
    for (const [metric, limitMs] of Object.entries(metrics)) {
      if (!Number.isFinite(limitMs) || limitMs <= 0) {
        throw new Error(`${size}/${metric}: budget must be a positive number`);
      }
      const summary = row[metric];
      if (
        !Number.isSafeInteger(row.iterations) ||
        row.iterations < 1 ||
        summary?.count !== row.iterations ||
        ![summary?.min, summary?.median, summary?.max, summary?.avg].every(
          (value) => Number.isFinite(value) && value >= 0
        )
      ) {
        failures.push(`${size}/${metric}: missing or invalid samples`);
      } else if (summary.median > limitMs) {
        failures.push(`${size}/${metric}: median ${summary.median.toFixed(1)}ms > ${limitMs}ms`);
      }
    }
  }
  for (const row of results) {
    if (!Object.hasOwn(budgets, row.size)) {
      failures.push(`${row.size}: no budget configured`);
    }
  }
  return failures;
};
