import { test, expect } from "@playwright/test";

/**
 * Read-only smoke tests over the core navigation paths. No mutations —
 * these run against the real Supabase project (see playwright.config.ts).
 */

/** Stable anchor on the explore landing page (works for guest + logged-in). */
async function expectExploreLanding(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: "검색" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "홈" })).toBeVisible();
}

test("둘러보기: 피드와 하단 탭이 렌더된다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expectExploreLanding(page);
  for (const tab of ["홈", "지도", "보관함"]) {
    await expect(page.getByRole("link", { name: tab })).toBeVisible();
  }
});

test("둘러보기: 검색 컨트롤이 렌더된다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expectExploreLanding(page);
  await expect(page.getByRole("button", { name: "필터" })).toBeVisible();
});

test("루트 상세: 피드 첫 카드에서 상세로 진입한다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expectExploreLanding(page);

  const card = page.locator('a[href^="/routes/"]:not([href="/routes/new"])').first();
  if ((await card.count()) === 0) {
    test.skip(true, "공개 루트가 없어 상세 진입을 건너뜀");
  }
  await card.click();

  await page.waitForURL(/\/routes\/[0-9a-f-]+/, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /댓글/ })).toBeVisible();
});

test("이 루트 따라가기: 안내 시트와 목적 선택이 렌더된다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expectExploreLanding(page);

  const card = page.locator('a[href^="/routes/"]:not([href="/routes/new"])').first();
  if ((await card.count()) === 0) {
    test.skip(true, "공개 루트가 없어 따라가기 시트 검증을 건너뜀");
  }
  await card.click();
  await page.waitForURL(/\/routes\/[0-9a-f-]+/, { waitUntil: "domcontentloaded" });

  const copyButton = page.getByRole("button", { name: "이 루트 따라가기" });
  const buttonAppeared = await copyButton
    .waitFor({ timeout: 7000 })
    .then(() => true)
    .catch(() => false);
  if (!buttonAppeared) {
    test.skip(true, "타인 공개 루트가 없어 따라가기 시트 검증을 건너뜀");
  }
  await copyButton.click();

  await expect(page.getByRole("heading", { name: "이 루트를 내 여행으로 시작할까요?" })).toBeVisible();
  await expect(page.getByText("장소와 이동 정보만 내 비공개 초안으로 가져와요.")).toBeVisible();

  const start = page.getByRole("button", { name: "내 비공개 초안 만들기" });
  await expect(start).toBeDisabled();
  await page.getByRole("button", { name: /아직 안 다녀왔어요/ }).click();
  await expect(start).toBeEnabled();
});

test("보관함: 따라가는 중/저장/팔로잉 탭이 렌더된다", async ({ page }) => {
  await page.goto("/library", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "따라가는 중" })).toBeVisible();
  await expect(page.getByRole("button", { name: "저장" })).toBeVisible();
  await expect(page.getByRole("button", { name: "팔로잉" })).toBeVisible();
});

test("프로필: 내 정보가 렌더된다", async ({ page }) => {
  await page.goto("/profile", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "프로필 편집" })).toBeVisible();
  await expect(page.getByRole("link", { name: /코스 통계/ })).toBeVisible();

  await page.goto("/profile/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
});

test("코스 통계: 요약·월별 차트·지역이 렌더된다", async ({ page }) => {
  await page.goto("/profile/stats");
  await expect(page.getByRole("heading", { name: "활동 기록" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "다녀온 지역" })).toBeVisible();
});

test("지도 모드: 지도 탭과 홈으로 버튼이 렌더된다", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "지도" }).click();
  // Conveyor slide waits for nav blob settle (~520ms) before the map pane moves in.
  await expect(page.getByRole("button", { name: "홈으로" })).toBeVisible({ timeout: 12_000 });
});

test.describe("비로그인 가드", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("둘러보기(/)는 게스트도 열람 가능하다", async ({ page }) => {
    await page.goto("/");
    await expectExploreLanding(page);
  });

  test("보관함 접근 시 /login으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/library");
    await page.waitForURL(/\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
