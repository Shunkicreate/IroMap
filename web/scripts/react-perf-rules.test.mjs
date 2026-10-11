import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();
const source = `const Child = (_props: unknown) => null;
export function Example() {
  return <Child data={{}} items={[]} onClick={() => {}} />;
}`;
const lintPerf = async (code, filePath) => {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((message) => message.ruleId?.startsWith("react-perf/"));
};

test("renderers reject freshly created object, array, and callback props", async () => {
  const messages = await lintPerf(source, "src/features/rgb-cube/rgb-cube-canvas.tsx");
  assert.deepEqual(messages.map((message) => message.ruleId).sort(), [
    "react-perf/jsx-no-new-array-as-prop",
    "react-perf/jsx-no-new-function-as-prop",
    "react-perf/jsx-no-new-object-as-prop",
  ]);
  assert.ok(messages.every((message) => message.severity === 2));
});

test("workbench controls allow callbacks but reject fresh data props", async () => {
  const messages = await lintPerf(source, "src/features/workbench/color-workbench.tsx");
  assert.equal(messages.length, 2);
  assert.ok(
    messages.every((message) => message.ruleId !== "react-perf/jsx-no-new-function-as-prop")
  );
});

test("native elements and components outside the selected scope are excluded", async () => {
  assert.deepEqual(
    await lintPerf(
      "export function Example() { return <button onClick={() => {}} data-values={[]} />; }",
      "src/features/rgb-cube/rgb-cube-canvas.tsx"
    ),
    []
  );
  assert.deepEqual(await lintPerf(source, "src/features/agent-api/agent-analyze-page.tsx"), []);
});
