/**
 * Continuation of persona audit (library / profile / fab / notifications).
 */
import { test, expect, type Page } from "@playwright/test";
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
  note(`SHOT ${name}`);
}

async function visibleTexts(page: Page, limit = 40) {
  return page.locator("body").evaluate((el, lim) => {
    const acc: string[] = [];
    const walk = (node: Node) => {
      if (acc.length >= lim) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const t = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (t.length >= 2) acc.push(t);
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (["script", "style", "noscript"].includes(tag)) return;
        for (const c of Array.from(node.childNodes)) walk(c);
      }
    };
    walk(el);
    return acc;
  }, limit);
}

test("P2–P4 library profile fab notifications", async ({ page }) => {
  test.setTimeout(240_000);
  const email = process.env.E2E_DEMO_EMAIL ?? "demo@course-sns.app";
  const password = process.env.E2E_DEMO_PASSWORD ?? "demo1234";

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("/", { timeout: 25_000 });
  await expect(page.getByRole("heading", { name: "둘러보기" })).toBeVisible({
    timeout: 15_000,
  });

  // Library
  await page.goto("/library", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await shot(page, "14-library-default");
  note(`TEXT[library] ${JSON.stringify(await visibleTexts(page, 50))}`);

  for (const tab of ["따라가는 중", "저장", "팔로잉"] as const) {
    const btn = page.getByRole("button", { name: tab });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
      await shot(page, `15-library-${tab.replace(/\s+/g, "-")}`);
      note(`TEXT[library-${tab}] ${JSON.stringify(await visibleTexts(page, 40))}`);
    }
  }

  // Following subs
  const following = page.getByRole("button", { name: "팔로잉" });
  if (await following.isVisible().catch(() => false)) {
    await following.click();
    await page.waitForTimeout(500);
    for (const sub of ["새 코스", "사람"]) {
      const s = page.getByRole("button", { name: sub });
      if (await s.isVisible().catch(() => false)) {
        await s.click();
        await page.waitForTimeout(600);
        await shot(page, `16-following-${sub.replace(/\s+/g, "-")}`);
        note(`TEXT[following-${sub}] ${JSON.stringify(await visibleTexts(page, 35))}`);
      }
    }
  }

  // Own course detail (demo's) for P2 complete CTA / influence
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  // Open demo's own card if present
  const own = page.locator('a[href^="/routes/"]').filter({ hasText: "한강" }).first();
  if (await own.count()) {
    await own.click();
    await page.waitForURL(/\/routes\//, { timeout: 15_000 });
    await page.waitForTimeout(900);
    await shot(page, "17-own-detail");
    note(`TEXT[own-detail] ${JSON.stringify(await visibleTexts(page, 45))}`);
    const ctas = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button, a"))
        .map((b) => (b.textContent || "").replace(/\s+/g, " ").trim())
        .filter((t) => /따라가기|다녀왔|좋아요|저장|후기|팔로우|완료|편집|공개/.test(t))
        .slice(0, 25),
    );
    note(`CTA-OWN ${JSON.stringify(ctas)}`);
  }

  // FAB sheet
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  // Center FAB in bottom nav
  const fabCandidates = [
    page.getByRole("button", { name: "새 코스 만들기" }),
    page.getByRole("button", { name: /새 코스/ }),
    page.locator("nav button").nth(1),
  ];
  let opened = false;
  for (const c of fabCandidates) {
    if (await c.isVisible().catch(() => false)) {
      await c.click().catch(() => {});
      await page.waitForTimeout(700);
      if (await page.getByText(/기록|계획/).first().isVisible().catch(() => false)) {
        opened = true;
        break;
      }
    }
  }
  if (opened) {
    await shot(page, "18-fab-sheet");
    note(`TEXT[fab] ${JSON.stringify(await visibleTexts(page, 30))}`);
  } else {
    note("WARN fab sheet not opened — direct /routes/new");
  }

  await page.goto("/routes/new?type=plan", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await shot(page, "19-planner-new");
  note(`TEXT[planner] ${JSON.stringify(await visibleTexts(page, 50))}`);
  note(`URL planner ${page.url()}`);

  await page.goto("/routes/new?type=record", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await shot(page, "20-record-new");
  note(`TEXT[record-new] ${JSON.stringify(await visibleTexts(page, 50))}`);

  // Profile + stats
  await page.goto("/profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot(page, "21-profile");
  note(`TEXT[profile] ${JSON.stringify(await visibleTexts(page, 50))}`);

  await page.goto("/profile/stats", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot(page, "22-stats");
  note(`TEXT[stats] ${JSON.stringify(await visibleTexts(page, 45))}`);

  // Maker bookshelf
  await page.goto("/u/pentanike", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await shot(page, "23-u-pentanike");
  note(`TEXT[u-pentanike] ${JSON.stringify(await visibleTexts(page, 45))}`);

  // Notifications
  await page.goto("/notifications", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot(page, "24-notifications");
  note(`TEXT[notif] ${JSON.stringify(await visibleTexts(page, 40))}`);
  note(`URL notif ${page.url()}`);

  fs.appendFileSync(path.join(OUT, "notes.txt"), "\n--- PART2 ---\n" + notes.join("\n") + "\n");
});
