/**
 * Persona visual audit (read-only) against production or local.
 *
 * BASE_URL=https://course-sns.vercel.app pnpm exec playwright test e2e/persona-audit.spec.ts --project=smoke
 *
 * Writes screenshots + notes under /opt/cursor/artifacts/persona-audit/
 */
import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT = "/opt/cursor/artifacts/persona-audit";
const notes: string[] = [];

function note(line: string) {
  notes.push(line);
  console.log(line);
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  note(`SHOT ${name} → ${file}`);
  return file;
}

async function visibleTexts(root: Locator, limit = 40): Promise<string[]> {
  return root.evaluate((el, lim) => {
    const walk = (node: Node, acc: string[]) => {
      if (acc.length >= lim) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const t = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (t.length >= 2) acc.push(t);
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const e = node as HTMLElement;
        const tag = e.tagName.toLowerCase();
        if (["script", "style", "noscript"].includes(tag)) return;
        for (const c of Array.from(e.childNodes)) walk(c, acc);
      }
    };
    const acc: string[] = [];
    walk(el, acc);
    return acc.slice(0, lim);
  }, limit);
}

async function dumpAria(page: Page, label: string) {
  const buttons = await page.getByRole("button").allTextContents();
  const links = await page.getByRole("link").allTextContents();
  note(
    `ARIA[${label}] buttons=${JSON.stringify(
      buttons.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 30),
    )}`,
  );
  note(
    `ARIA[${label}] links=${JSON.stringify(
      links.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 30),
    )}`,
  );
}

test.describe.configure({ mode: "serial" });

test("P0 guest + P1–P4 persona audit walkthrough", async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  note(`BASE ${page.url() || "(start)"}`);
  note(`UA viewport audit start ${new Date().toISOString()}`);

  // ── Guest / cold open (P1 entry) ──
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("navigation").getByRole("link", { name: "홈" })).toBeVisible({
    timeout: 20_000,
  });
  await shot(page, "01-guest-home");
  await dumpAria(page, "guest-home");
  const homeTexts = await visibleTexts(page.locator("body"));
  note(`TEXT[guest-home] ${JSON.stringify(homeTexts.slice(0, 50))}`);

  // Filter / sort density
  const filterBtn = page.getByRole("button", { name: "필터" });
  if (await filterBtn.isVisible().catch(() => false)) {
    await filterBtn.click();
    await page.waitForTimeout(600);
    await shot(page, "02-guest-filter-sheet");
    await dumpAria(page, "filter-sheet");
    // close sheet if possible
    const close = page.getByRole("button", { name: /닫기|취소|적용/ }).first();
    if (await close.isVisible().catch(() => false)) await close.click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(400);
  }

  // First card anatomy
  const card = page.locator('a[href^="/routes/"]:not([href="/routes/new"])').first();
  const cardCount = await page.locator('a[href^="/routes/"]:not([href="/routes/new"])').count();
  note(`METRIC cards=${cardCount}`);
  if (cardCount > 0) {
    const cardBox = card;
    await cardBox.scrollIntoViewIfNeeded();
    await shot(page, "03-guest-home-card-focus");
    const cardText = await visibleTexts(cardBox, 25);
    note(`TEXT[first-card] ${JSON.stringify(cardText)}`);
    // Transfer / like language on card
    const body = await cardBox.innerText();
    note(`RAW[first-card]\n${body}`);
  }

  // Map mode
  await page.getByRole("link", { name: "지도" }).click();
  await page.waitForTimeout(1500);
  await shot(page, "04-guest-map");
  const homeBack = page.getByRole("button", { name: "홈으로" });
  const mapReady = await homeBack.isVisible({ timeout: 15_000 }).catch(() => false);
  note(`MAP home-back visible=${mapReady}`);
  if (mapReady) {
    await dumpAria(page, "map");
    // Try peek card if any
    const peek = page.locator('[class*="Tour"], [data-tour], article, a[href^="/routes/"]').first();
    if (await peek.isVisible().catch(() => false)) {
      const peekText = await peek.innerText().catch(() => "");
      note(`RAW[map-peek]\n${peekText.slice(0, 500)}`);
    }
    await homeBack.click().catch(() => {});
    await page.waitForTimeout(800);
  } else {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  }

  // Detail (guest)
  await page.goto("/", { waitUntil: "networkidle" });
  if (cardCount > 0) {
    const c = page.locator('a[href^="/routes/"]:not([href="/routes/new"])').first();
    await c.click();
    await page.waitForURL(/\/routes\/[0-9a-f-]+/, { timeout: 20_000 });
    await page.waitForTimeout(800);
    await shot(page, "05-guest-detail-top");
    await dumpAria(page, "guest-detail");
    const detailTop = await visibleTexts(page.locator("body"), 60);
    note(`TEXT[guest-detail] ${JSON.stringify(detailTop)}`);

    // Scroll to see CTA stack
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(400);
    await shot(page, "06-guest-detail-mid");

    // Follow CTA / AuthGate
    const follow =
      page.getByRole("button", { name: /이 코스 따라가기|이 루트 따라가기|따라가기/ }).first();
    if (await follow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const label = (await follow.innerText()).replace(/\s+/g, " ").trim();
      note(`CTA follow-label="${label}"`);
      await follow.click();
      await page.waitForTimeout(700);
      await shot(page, "07-guest-authgate-or-copy-sheet");
      await dumpAria(page, "after-follow-click");
      const sheetText = await visibleTexts(page.locator("body"), 40);
      note(`TEXT[after-follow] ${JSON.stringify(sheetText)}`);
      await page.keyboard.press("Escape").catch(() => {});
    } else {
      note("WARN follow CTA not visible for guest detail");
    }
  }

  // Library as guest → login redirect
  await page.goto("/library", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await shot(page, "08-guest-library-or-login");
  note(`URL after /library → ${page.url()}`);

  // ── Login as demo (P2/P3/P4 surfaces) ──
  const email = process.env.E2E_DEMO_EMAIL ?? "demo@course-sns.app";
  const password = process.env.E2E_DEMO_PASSWORD ?? "demo1234";
  await page.goto("/login", { waitUntil: "networkidle" });
  await shot(page, "09-login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('button[type="submit"]').click();
  const loggedIn = await page
    .waitForURL("/", { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  note(`LOGIN ok=${loggedIn} url=${page.url()}`);
  if (!loggedIn) {
    await shot(page, "09b-login-failed");
    note("FAIL demo login — remaining steps use whatever session we have");
  } else {
    await page.waitForTimeout(1000);
    await shot(page, "10-authed-home");
    await dumpAria(page, "authed-home");
    const followingRail = page.getByText(/팔로잉|새 코스/);
    note(
      `HOME following-rail hint visible=${await followingRail
        .first()
        .isVisible()
        .catch(() => false)}`,
    );
    const homeAuthed = await visibleTexts(page.locator("body"), 50);
    note(`TEXT[authed-home] ${JSON.stringify(homeAuthed)}`);
  }

  // Authed detail + follow sheet (no mutate: stop before submit)
  await page.goto("/", { waitUntil: "networkidle" });
  const authedCard = page.locator('a[href^="/routes/"]:not([href="/routes/new"])').first();
  if ((await authedCard.count()) > 0) {
    await authedCard.click();
    await page.waitForURL(/\/routes\/[0-9a-f-]+/, { timeout: 20_000 });
    await page.waitForTimeout(800);
    await shot(page, "11-authed-detail-top");
    // Capture CTA order: look for like/save/follow buttons in DOM order
    const actionLabels = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, a"));
      return btns
        .map((b) => (b.textContent || "").replace(/\s+/g, " ").trim())
        .filter((t) =>
          /따라가기|다녀왔|좋아요|저장|후기|팔로우|완료/.test(t),
        )
        .slice(0, 20);
    });
    note(`CTA-ORDER ${JSON.stringify(actionLabels)}`);
    await dumpAria(page, "authed-detail");

    const copyBtn = page
      .getByRole("button", { name: /이 코스 따라가기|이 루트 따라가기/ })
      .first();
    if (await copyBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await copyBtn.click();
      await page.waitForTimeout(700);
      await shot(page, "12-copy-sheet");
      const sheet = await visibleTexts(page.locator("body"), 40);
      note(`TEXT[copy-sheet] ${JSON.stringify(sheet)}`);
      // Do NOT confirm — read-only
      await page.keyboard.press("Escape").catch(() => {});
      const cancel = page.getByRole("button", { name: /닫기|취소/ }).first();
      if (await cancel.isVisible().catch(() => false)) await cancel.click().catch(() => {});
    }

    // Author card → profile (P4)
    const author = page.locator('a[href^="/u/"]').first();
    if (await author.isVisible().catch(() => false)) {
      const href = await author.getAttribute("href");
      note(`AUTHOR href=${href}`);
      await author.click();
      await page.waitForTimeout(1000);
      await shot(page, "13-maker-bookshelf");
      await dumpAria(page, "maker-profile");
      const profileText = await visibleTexts(page.locator("body"), 50);
      note(`TEXT[maker-profile] ${JSON.stringify(profileText)}`);
      const followToggle = page.getByRole("button", { name: /팔로우|팔로잉|맞팔|서로/ }).first();
      note(
        `FOLLOW toggle visible=${await followToggle.isVisible().catch(() => false)} label=${(
          await followToggle.innerText().catch(() => "")
        )
          .replace(/\s+/g, " ")
          .trim()}`,
      );
    }
  }

  // Library segments (P2 / P4)
  await page.goto("/library", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "14-library-following-in-progress");
  await dumpAria(page, "library-default");
  const libText = await visibleTexts(page.locator("body"), 50);
  note(`TEXT[library] ${JSON.stringify(libText)}`);

  for (const tab of ["저장", "팔로잉"] as const) {
    const btn = page.getByRole("button", { name: tab });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(700);
      await shot(page, `15-library-${tab}`);
      const t = await visibleTexts(page.locator("body"), 40);
      note(`TEXT[library-${tab}] ${JSON.stringify(t)}`);
      // following sub-segments
      if (tab === "팔로잉") {
        for (const sub of ["새 코스", "사람"]) {
          const s = page.getByRole("button", { name: sub });
          if (await s.isVisible().catch(() => false)) {
            await s.click();
            await page.waitForTimeout(500);
            await shot(page, `16-library-following-${sub}`);
            note(
              `TEXT[following-${sub}] ${JSON.stringify(await visibleTexts(page.locator("body"), 30))}`,
            );
          }
        }
      }
    }
  }

  // FAB / new course entry (P3) — open sheet only, no save
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const fab = page.getByRole("button", { name: /새 코스|만들기|\+/ }).first();
  // Bottom nav center button
  const fabAlt = page.locator("nav").getByRole("button").filter({ hasText: /새|코스|\+/ }).first();
  const fabBtn = (await fab.isVisible().catch(() => false)) ? fab : fabAlt;
  if (await fabBtn.isVisible().catch(() => false)) {
    await fabBtn.click();
    await page.waitForTimeout(700);
    await shot(page, "17-fab-sheet");
    note(`TEXT[fab] ${JSON.stringify(await visibleTexts(page.locator("body"), 30))}`);
    const plan = page.getByRole("link", { name: /계획|기록|코스/ }).first();
    if (await plan.isVisible().catch(() => false)) {
      // Prefer navigating to new plan without submitting
      const planLink = page.locator('a[href*="/routes/new"]').first();
      if (await planLink.isVisible().catch(() => false)) {
        await planLink.click();
        await page.waitForTimeout(1000);
        await shot(page, "18-routes-new");
        note(`TEXT[routes-new] ${JSON.stringify(await visibleTexts(page.locator("body"), 45))}`);
        note(`URL routes-new ${page.url()}`);
      }
    }
  } else {
    await page.goto("/routes/new?type=plan", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "18-routes-new-direct");
    note(`TEXT[routes-new] ${JSON.stringify(await visibleTexts(page.locator("body"), 45))}`);
  }

  // Profile drawer / stats (P3 influence)
  await page.goto("/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await shot(page, "19-profile");
  note(`TEXT[profile] ${JSON.stringify(await visibleTexts(page.locator("body"), 45))}`);
  await page.goto("/profile/stats", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await shot(page, "20-profile-stats");
  note(`TEXT[stats] ${JSON.stringify(await visibleTexts(page.locator("body"), 40))}`);

  // Notifications (P4)
  const notif = page.locator('a[href*="notif"], a[href*="notification"]').first();
  if (await notif.isVisible().catch(() => false)) {
    await notif.click();
    await page.waitForTimeout(800);
    await shot(page, "21-notifications");
    note(`TEXT[notif] ${JSON.stringify(await visibleTexts(page.locator("body"), 40))}`);
  } else {
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await shot(page, "21-notifications");
    note(`TEXT[notif] ${JSON.stringify(await visibleTexts(page.locator("body"), 40))}`);
    note(`URL notif ${page.url()}`);
  }

  fs.writeFileSync(path.join(OUT, "notes.txt"), notes.join("\n") + "\n", "utf8");
  note(`DONE notes → ${path.join(OUT, "notes.txt")}`);
});
