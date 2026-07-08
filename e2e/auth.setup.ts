import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/demo.json";

/**
 * Log in once as the seeded demo account and persist the session for the
 * smoke project. Credentials overridable via env for CI.
 */
setup("authenticate as demo", async ({ page }) => {
  const email = process.env.E2E_DEMO_EMAIL ?? "demo@course-sns.app";
  const password = process.env.E2E_DEMO_PASSWORD ?? "demo1234";

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  // the mode tab is also named 로그인 — target the submit button specifically
  await page.locator('button[type="submit"]').click();

  await page.waitForURL("/");
  await expect(page.getByRole("button", { name: "검색" })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
