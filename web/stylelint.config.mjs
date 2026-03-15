const viewportLengthPropertyPattern =
  /^(block-size|height|inline-size|max-block-size|max-height|max-inline-size|max-width|min-block-size|min-height|min-inline-size|min-width|width)$/;

/** @type {import('stylelint').Config} */
const config = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [".next/**", "node_modules/**"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["apply", "custom-variant", "theme"],
      },
    ],
    "declaration-property-value-disallowed-list": {
      [viewportLengthPropertyPattern]: ["/\\b100vh\\b/", "/\\b100vw\\b/"],
    },
    "hue-degree-notation": null,
    "import-notation": null,
    "lightness-notation": null,
    "media-feature-range-notation": null,
    "no-descending-specificity": null,
    "selector-class-pattern": null,
    "unit-disallowed-list": ["px"],
  },
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
};

export default config;
