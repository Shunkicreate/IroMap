import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testMatch: "mobile-image-paste.spec.ts",
  projects: [{ name: "mobile-webkit", use: { ...devices["iPhone 13"] } }],
});
