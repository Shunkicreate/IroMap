import { defineConfig, globalIgnores } from "eslint/config";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "variable",
          types: ["boolean"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          prefix: ["is", "has", "can"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "parameter",
          types: ["boolean"],
          format: ["camelCase"],
          prefix: ["is", "has", "can"],
          leadingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
      "react/jsx-pascal-case": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXOpeningElement > JSXIdentifier[name="header"]',
          message:
            "Do not use <header> directly. Use semantic sections with explicit component/class naming instead.",
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/*"],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.tsx", "src/features/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXOpeningElement > JSXIdentifier[name="header"]',
          message:
            "Do not use <header> directly. Use semantic sections with explicit component/class naming instead.",
        },
        {
          selector: "JSXText[value=/\\S+/]",
          message: "Do not hardcode UI text in JSX. Use i18n key via t().",
        },
        {
          selector: "JSXExpressionContainer > Literal[value=/\\S+/]",
          message: "Do not hardcode UI text in JSX. Use i18n key via t().",
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/features/*"],
        },
      ],
    },
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["next", "react"],
          patterns: ["next/*", "react/*", "@/app/*", "@/features/*"],
        },
      ],
    },
  },
  {
    files: ["src/rendering/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/*", "@/features/*"],
        },
      ],
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXAttribute[name.name="style"]',
          message:
            "Do not use JSX style props. Move styles to CSS or CSS Modules and pass dynamic values via attributes or class names.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
