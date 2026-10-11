import assert from "node:assert/strict";
import { test } from "node:test";
import { checkBudgets, parseInteger, summarize } from "./workbench-perf-budget.mjs";

const result = (values) => [{ size: "512x512", iterations: 2, photoTotalMs: summarize(values) }];
const budgets = { "512x512": { photoTotalMs: 100 } };

test("median tolerates a single outlier and accepts the exact limit", () => {
  assert.deepEqual(
    checkBudgets(
      [{ size: "512x512", iterations: 3, photoTotalMs: summarize([90, 100, 1000]) }],
      budgets
    ),
    []
  );
});

test("performance regression fails with the size and metric", () => {
  assert.match(checkBudgets(result([101, 120]), budgets)[0], /512x512\/photoTotalMs.*> 100ms/);
});

test("missing, nonfinite, negative, and incomplete samples fail closed", () => {
  for (const values of [[], [1], [NaN, 1], [Infinity, 1], [-1, 1]]) {
    assert.match(checkBudgets(result(values), budgets)[0], /invalid samples/);
  }
  assert.match(checkBudgets([{ size: "512x512", iterations: 2 }], budgets)[0], /invalid samples/);
});

test("missing results and unbudgeted sizes cannot pass", () => {
  assert.match(checkBudgets(result([10, 20]), { other: { photoTotalMs: 100 } })[0], /missing/);
  assert.match(checkBudgets(result([10, 20]), { other: { photoTotalMs: 100 } })[1], /no budget/);
  assert.throws(() => checkBudgets([], budgets), /empty/);
  assert.throws(() => checkBudgets(result([10, 20]), {}), /empty/);
});

test("invalid budgets and run parameters are rejected", () => {
  for (const limit of [0, -1, null, "100", Infinity]) {
    assert.throws(() => checkBudgets(result([10, 20]), { "512x512": { photoTotalMs: limit } }));
  }
  assert.throws(() => checkBudgets(result([10, 20]), { "512x512": {} }));
  for (const value of ["", "0", "-1", "1.5", "10runs", "NaN"]) {
    assert.throws(() => parseInteger("iterations", value));
  }
  assert.equal(parseInteger("iterations", "10"), 10);
  assert.equal(parseInteger("warmup", "0", 0), 0);
});
