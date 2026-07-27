import { defineConfig } from "@playwright/test";

/** Persona visual audit against production (read-only). */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /persona-audit(-part2)?\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 180_000,
  use: {
    baseURL: process.env.AUDIT_BASE_URL ?? "https://course-sns.vercel.app",
    viewport: { width: 390, height: 844 },
    trace: "off",
    screenshot: "off",
  },
});
