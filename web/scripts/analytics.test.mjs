import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const src = path.resolve("src");
const consentScope = JSON.parse(
  readFileSync(path.join(src, "lib/analytics-consent-scope.json"), "utf8")
);
function compile(relativePath) {
  return ts.transpileModule(readFileSync(path.join(src, relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}
const catalogExports = {};
vm.runInNewContext(compile("lib/analytics-catalog.ts"), { exports: catalogExports });

function harness({
  mode = "production",
  measurementId = "G-TEST123",
  storage = new Map(),
  isStorageBlocked = false,
  isTransportBlocked = false,
  consentDecision = "granted",
  policyVersion = "3",
} = {}) {
  let now = 1_800_000_000_000;
  const exports = {};
  const window = {
    location: {
      pathname: "/",
      origin: "https://iromap.example",
      hostname: "iromap.example",
      search: "?secret=private",
      hash: "#private",
    },
  };
  const localStorage = new Map();
  if (consentDecision !== null)
    localStorage.set(
      "iromap.privacy.analytics-consent",
      JSON.stringify({
        schemaVersion: 1,
        policyVersion,
        decision: consentDecision,
        decidedAt: now,
        expiresAt: now + 365 * 24 * 60 * 60 * 1000,
      })
    );
  window.localStorage = {
    getItem: (key) => localStorage.get(key) ?? null,
    setItem: (key, value) => localStorage.set(key, value),
    removeItem: (key) => localStorage.delete(key),
  };
  window.dispatchEvent = () => {};
  const consentExports = {};
  vm.runInNewContext(compile("lib/analytics-consent.ts"), {
    exports: consentExports,
    require: () => ({ default: consentScope }),
    window,
    Date: { now: () => now },
    Event,
  });
  if (isTransportBlocked)
    window.gtag = () => {
      throw new Error("blocked");
    };
  vm.runInNewContext(compile("lib/analytics.ts"), {
    exports,
    require: (name) => (name.endsWith("analytics-consent") ? consentExports : catalogExports),
    process: { env: { NODE_ENV: mode, NEXT_PUBLIC_GA_MEASUREMENT_ID: measurementId } },
    window,
    document: {
      referrer: "https://example.com/private?email=secret",
      cookie: "",
      getElementById: () => null,
      createElement: () => ({}),
      head: { appendChild: () => {} },
    },
    URL,
    crypto: { randomUUID },
    performance: { now: () => now },
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    sessionStorage: {
      getItem: (key) => {
        if (isStorageBlocked) throw new Error("blocked");
        return storage.get(key);
      },
      setItem: (key, value) => {
        if (isStorageBlocked) throw new Error("blocked");
        storage.set(key, value);
      },
      removeItem: (key) => storage.delete(key),
    },
  });
  exports.initializeAnalytics();
  return {
    api: exports,
    window,
    storage,
    localStorage,
    consent: consentExports,
    advance: (ms) => {
      now += ms;
    },
    events: () =>
      Array.from(window.dataLayer ?? [], (args) => Array.from(args)).filter(
        (args) => args[0] === "event"
      ),
  };
}

test("ordered input, analysis, selection and copy have stable routes and paired outcomes", () => {
  const h = harness();
  h.api.trackPageView("/");
  h.api.trackFeature("photo-file", "input");
  const finish = h.api.startAnalyticsOperation("photo-analysis");
  h.advance(250);
  finish("succeeded");
  finish("failed");
  h.api.trackFeature("preview-point");
  h.api.trackUiAction("metrics-copy", "click");
  const events = h.events();
  assert.deepEqual(
    events.map((event) => event[1]),
    ["page_view", "feature_use", "operation_result", "operation_result", "feature_use", "ui_action"]
  );
  assert.deepEqual(
    events.map((event) => event[2].event_sequence),
    [1, 2, 3, 4, 5, 6]
  );
  assert.equal(new Set(events.map((event) => event[2].journey_id)).size, 1);
  assert.equal(events[3][2].operation_id, events[2][2].operation_id);
  assert.equal(events[3][2].duration_ms, 250);
  assert.equal(events[3][2].since_previous_ms, 250);
  assert.equal(events[4][2].previous_control, "photo-analysis");
  assert.equal(events[4][2].destination, "linked-analysis");
  assert.equal(events[5][2].previous_event, "feature_use");
  assert.equal(events[5][2].occurred_at_ms, 1_800_000_000_250);
});

test("reload and navigation preserve journey and sequence; inactivity starts a new journey", () => {
  const first = harness();
  first.api.trackPageView("/");
  const second = harness({ storage: first.storage });
  second.window.location.pathname = "/analyze";
  second.api.trackPageView("/analyze");
  assert.equal(second.events()[0][2].journey_id, first.events()[0][2].journey_id);
  assert.equal(second.events()[0][2].event_sequence, 2);
  second.advance(30 * 60 * 1000);
  second.api.trackFeature("api-file", "input");
  assert.notEqual(second.events()[1][2].journey_id, first.events()[0][2].journey_id);
  assert.equal(second.events()[1][2].event_sequence, 1);
});

test("page views deduplicate effect replay while genuine navigation is recorded", () => {
  const h = harness();
  h.api.trackPageView("/");
  h.api.trackPageView("/");
  h.window.location.pathname = "/analyze";
  h.api.trackPageView("/analyze");
  h.window.location.pathname = "/";
  h.api.trackPageView("/");
  assert.equal(h.events().length, 3);
});

for (const options of [
  { mode: "development" },
  { measurementId: "" },
  { measurementId: "bad'input" },
]) {
  test(`disabled configuration emits nothing: ${JSON.stringify(options)}`, () => {
    const h = harness(options);
    h.api.trackPageView("/");
    h.api.trackUiAction("photo-choose", "click");
    h.api.startAnalyticsOperation("photo-analysis")("failed");
    assert.equal(h.events().length, 0);
    assert.equal(h.storage.size, 0);
  });
}

test("storage and transport failures never throw; memory still preserves order", () => {
  const h = harness({ isStorageBlocked: true });
  h.api.trackFeature("preview-point");
  h.api.trackFeature("slice-pick");
  assert.equal(h.events()[1][2].event_sequence, 2);
  assert.doesNotThrow(() =>
    harness({ isTransportBlocked: true }).api.trackFeature("preview-point")
  );
});

test("unknown controls, raw URL fragments, referrer paths and poisoned storage are excluded", () => {
  const storage = new Map([
    [
      "iromap.analytics.journey.v1",
      JSON.stringify({
        id: randomUUID(),
        startedAt: 1,
        lastAt: 1,
        sequence: 3,
        previousEvent: "feature_use",
        previousControl: "private-file.jpg",
      }),
    ],
  ]);
  const h = harness({ storage });
  h.window.location.pathname = "/private-file.jpg";
  h.api.trackFeature("private-file.jpg");
  h.api.trackFeature("photo-file", "input");
  const serialized = JSON.stringify(h.events());
  assert.equal(h.events().length, 1);
  assert.equal(h.events()[0][2].page_path, "/other");
  assert.equal(h.events()[0][2].page_location, "https://iromap.example/other");
  assert.equal(h.events()[0][2].page_referrer, "https://example.com");
  assert.doesNotMatch(serialized, /private|secret|email/);
});

test("failed and cancelled operations remain distinct and complete once", () => {
  const h = harness();
  h.api.startAnalyticsOperation("metrics-copy")("failed");
  h.api.startAnalyticsOperation("photo-analysis")("cancelled");
  assert.deepEqual(
    h.events().map((event) => event[2].action),
    ["started", "failed", "started", "cancelled"]
  );
});

for (const options of [
  { consentDecision: null },
  { consentDecision: "denied" },
  { policyVersion: "1" },
  { policyVersion: "2" },
  { policyVersion: "4" },
]) {
  test(`only current explicit consent enables analytics: ${JSON.stringify(options)}`, () => {
    const h = harness(options);
    h.api.trackPageView("/");
    h.api.trackFeature("photo-file", "input");
    assert.equal(h.api.isAnalyticsEnabled(), false);
    assert.equal(h.window.dataLayer, undefined);
    assert.equal(h.storage.size, 0);
  });
}

test("consent expiry and revocation stop emission, clear sequence and ignore old completions after regrant", () => {
  const h = harness();
  h.api.trackPageView("/");
  const oldFinish = h.api.startAnalyticsOperation("photo-analysis");
  h.consent.saveAnalyticsConsent("denied");
  h.api.disableAnalytics();
  assert.equal(h.events().length, 0);
  assert.equal(h.storage.size, 0);
  h.consent.saveAnalyticsConsent("granted");
  h.api.initializeAnalytics();
  oldFinish("succeeded");
  assert.equal(h.events().length, 0);
  h.api.trackPageView("/");
  assert.equal(h.events()[0][2].event_sequence, 1);
  assert.equal(h.events()[0][2].consent_version, "3");
  h.advance(365 * 24 * 60 * 60 * 1000);
  h.api.trackFeature("photo-file", "input");
  assert.equal(h.events().length, 1);
  assert.equal(h.api.isAnalyticsEnabled(), false);
});

test("consent and GA cookies expire after one year without extending the cookie expiry", () => {
  const h = harness();
  assert.equal(h.consent.analyticsConsentLifetimeMs, 365 * 24 * 60 * 60 * 1000);
  const config = Array.from(h.window.dataLayer, (item) => Array.from(item)).find(
    (item) => item[0] === "config"
  );
  assert.equal(config[2].cookie_expires, 31_536_000);
  assert.equal(config[2].cookie_update, false);
});

test("catalog and UI annotations cover every concrete control in active screens", () => {
  const ids = catalogExports.analyticsControls.map(([id]) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z][a-z0-9-]{0,39}$/);
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name.endsWith(".tsx")) files.push(fullPath);
    }
  }
  walk(src);
  const seen = new Set();
  for (const file of files) {
    const relative = path.relative(src, file).replaceAll("\\", "/");
    if (
      relative.startsWith("components/ui/") ||
      relative === "features/photo-analysis/photo-analysis-panel.tsx"
    )
      continue;
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(source);
        const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
        const annotation = attributes.find((attribute) =>
          ["data-analytics-id", "analyticsId"].includes(attribute.name.getText(source))
        );
        if (
          [
            "button",
            "Button",
            "Checkbox",
            "input",
            "select",
            "TabsTrigger",
            "details",
            "PersistedDisclosure",
          ].includes(tag) &&
          relative !== "components/workbench/persisted-disclosure.tsx"
        ) {
          const consentMode = attributes.find(
            (attribute) =>
              attribute.name.getText(source) === "data-analytics-mode" &&
              attribute.initializer &&
              ts.isStringLiteral(attribute.initializer) &&
              attribute.initializer.text === "consent"
          );
          assert.ok(
            annotation || (relative === "components/cookie-consent.tsx" && consentMode),
            `${relative}: <${tag}> needs an analytics ID`
          );
        }
        if (annotation?.initializer && ts.isStringLiteral(annotation.initializer)) {
          assert.ok(
            ids.includes(annotation.initializer.text),
            `${relative}: unregistered ${annotation.initializer.text}`
          );
          seen.add(annotation.initializer.text);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  for (const id of [
    "photo-choose",
    "photo-file",
    "preview-density",
    "cube-rgb",
    "cube-hsl",
    "cube-lab",
    "metrics-copy",
    "histogram-copy",
    "slice-options",
    "inspector-open",
    "api-submit",
    "theme-toggle",
  ])
    assert.ok(seen.has(id), `missing ${id}`);
});

function canonicalScope(value) {
  if (Array.isArray(value)) return value.map(canonicalScope).sort();
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalScope(item)])
    );
  return value;
}

function consentScopeDigest(scope) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalScope(scope)))
    .digest("hex");
}

test("consent scope changes require a new version; published versions are immutable", () => {
  const { consent } = harness({ consentDecision: null });
  const digest = consentScopeDigest(consentScope);
  const manifestPath = "tests/fixtures/analytics-consent-versions.json";
  const versions = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(
    versions[consent.analyticsConsentVersion],
    digest,
    `Consent scope changed. Add a new policy version and its SHA-256 digest: ${digest}`
  );
  let published = {};
  const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "HEAD";
  try {
    published = JSON.parse(
      execFileSync("git", ["show", `${baseRef}:web/${manifestPath}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      })
    );
  } catch (error) {
    // The manifest does not exist before this feature is introduced.
    if (
      !String(error.stderr).includes("does not exist") &&
      !String(error.stderr).includes("exists on disk, but not in")
    )
      throw error;
  }
  for (const [version, publishedDigest] of Object.entries(published))
    assert.equal(
      versions[version],
      publishedDigest,
      `Published consent version ${version} must not be rewritten or removed`
    );
});

test("adding or renaming event controls within the same scope keeps existing consent valid", () => {
  const h = harness();
  const saved = h.localStorage.get("iromap.privacy.analytics-consent");
  catalogExports.analyticsControls.push(["new-feature-action", "photo-preview", "photo-preview"]);
  try {
    h.api.trackFeature("new-feature-action");
    catalogExports.analyticsControls.at(-1)[0] = "renamed-feature-action";
    h.api.trackFeature("renamed-feature-action");
    assert.equal(h.api.isAnalyticsEnabled(), true);
    assert.equal(h.events().length, 2);
    assert.equal(h.localStorage.get("iromap.privacy.analytics-consent"), saved);
  } finally {
    catalogExports.analyticsControls.pop();
  }
});

test("consent scope excludes event lists and display copy, but protects recipient and data changes", () => {
  assert.equal("events" in consentScope, false);
  assert.equal("notice" in consentScope, false);
  for (const expanded of [
    { ...consentScope, recipients: [...consentScope.recipients, "another-provider"] },
    { ...consentScope, purposes: [...consentScope.purposes, "advertising"] },
    { ...consentScope, dataCategories: [...consentScope.dataCategories, "free-text-input"] },
    { ...consentScope, cookieRetentionDays: consentScope.cookieRetentionDays + 1 },
  ])
    assert.notEqual(consentScopeDigest(expanded), consentScopeDigest(consentScope));
  assert.equal(
    consentScopeDigest({
      ...consentScope,
      dataCategories: [...consentScope.dataCategories].reverse(),
    }),
    consentScopeDigest(consentScope)
  );
});
