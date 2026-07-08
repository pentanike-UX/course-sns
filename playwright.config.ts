import { defineConfig } from "@playwright/test";

/**
 * Smoke tests for the core read paths (login → home/feed/detail/library).
 * Read-only by design: they run against the real Supabase project, so they
 * must never create/mutate data. Uses the seeded demo account (docs/HANDOFF.md).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    // mirror the mobile-first frame (~430px)
    viewport: { width: 390, height: 844 },
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "smoke",
      use: { storageState: "e2e/.auth/demo.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
