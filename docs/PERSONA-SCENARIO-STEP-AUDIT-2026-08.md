# 페르소나 시나리오 단계별 심층 검수

> **기준:** `v0.3.24-mvp` · 시나리오 정본 [`PERSONA-SCENARIOS.md`](PERSONA-SCENARIOS.md)  
> **방법:** G·P1·P2·P3·P4·교차 루프의 **각 단계**를 코드에 대조  
> **날짜:** 2026-08-12

심각도: **P0** 사용 막힘 · **P1** 높은 마찰 · **P2** 혼란 · **P3** 폴리시

---

## 요약

| 페르소나 | 단계 수 | OK | GAP→핫픽스(v0.3.24) | 잔여 |
|----------|---------|----|--------------------|------|
| G 게스트 | G1–G6 | 대부분 | 브랜드 태그라인 · 정렬 라벨 | — |
| P1 탐색러 | 1–7 + a/b/c | 대부분 | 가져왔어요→보관함 CTA · 정렬 | — |
| P2 따라가이 | 1–6 + a/b/c | 핵심 | **카드→원본** · 초안 배너 | 스팟 ✓ P3 |
| P3 메이커 | 기록·계획 | 대부분 | 플래너 Hint · 통계 0명 | soft-block P2 |
| P4 구독자 | 1–6 + a/b/c | 대부분 | 언팔 revalidate · 맞팔 라벨 | **0014 ops P0** |
| 교차 | 언어·위계 | OK | — | 실기기 QA |

---

## G — 게스트 첫 방문

| 단계 | 기대 | 실태 | 판정 |
|------|------|------|------|
| G1 | 스플래시→브랜드·공개 피드 | BrandLockup → BrandWordmark +「좋은 코스 따라가 보세요」 | OK |
| G2 | 정렬·필터(실행조건 우선) |「많이 따라간/다녀온」·지역→누구와→난이도 · 테마 접힘 | OK |
| G2′ | 가까운 거절 | 배너+칩 해제 | OK |
| G3 | 전이 상세 · ♥ 보조 | proof→CTA→icon demote ·「첫 따라가기」 | OK |
| G4 | 지도 peek+따라가기 | SheetSelectedCard primary · 시트 CTA 상단 | OK |
| G5 | 메이커 책장·팔로우 | FollowToggle · empty CTA | OK |
| G6 | AuthGate 따라가기 | FOLLOW_AUTH | OK |

**성공 조건:** 열람 OK · 쓰기 직전만 막힘 — **충족**.

---

## P1 — 탐색러

| 단계 | 기대 | 실태 | 판정 |
|------|------|------|------|
| 1 | 카드 스펙+전이 | TransferPill · SpecLine · 콜드「첫 따라가기」 | OK |
| 2 | 필터 실행조건 위 | FeedFilterSheet 순서 | OK |
| 3 |「많이 따라간/다녀온」 | FeedControls 라벨 복원(v0.3.24) | OK |
| 4 | 지도 peek=스펙+전이 | mapPointMeta · ♥ 없음 | OK |
| 5 | Primary=따라가기 | CourseFollowActions | OK |
| 6 | AuthGate→비공개 초안 | CopyRouteButton · edit?followed=1 | OK |
| 7 | 가져왔어요→따라가는 중 | FollowNextStepsCard → `/library` CTA (v0.3.24) | OK |
| P1-a | 저장→따라가기 | CollectionCard primary | OK |
| P1-b | 구독 레일 | FollowingRail → tab=subscribed | OK |
| P1-c | 콜드 전이 | 카드/peek/시트/상세 일치 | OK |

---

## P2 — 따라가이

| 단계 | 기대 | 실태 | 판정 |
|------|------|------|------|
| 1 | 「따라가는 중」기본 | library default tab | OK |
| 2 | 체크리스트 | FollowProgressBar 실데이터(LIB-01) | OK |
| 2′ | 카드 탭→완주 경로 | 미완료+원본 → **원본 href**(v0.3.24) | OK |
| 3 | 초안 다듬기 | edit / 플래너 · dirty confirm | OK |
| 4 | CTA「다녀왔어요」 | 원본 CompleteCourseButton · 초안 **배너**(v0.3.24) | OK |
| 5 | 별점+팁 | completion sheet | OK |
| 6 | 후기 수정 | ink 톤 | OK |
| P2-a | 바로 완주 | 카드→원본 + ProgressBar | OK |
| P2-b | 재진입 next | nextLabel 단계별 | OK |
| P2-c | 저장→따라가기 | CollectionCard | OK |

---

## P3 — 코스 메이커

| 단계 | 기대 | 실태 | 판정 |
|------|------|------|------|
| 기록 1–2 | FAB→위자드 | BottomNav · RouteForm 5스텝 | OK |
| 기록 3 | FollowReadyHint | create/edit + **플래너**(v0.3.24) | OK |
| 기록 4 | 공개 게이트 | visibilityChosen | OK |
| 기록 5 | 책장·토스트 | replace · SaveNotice | OK |
| 기록 6 | 통계·알림 | 전이 섹션 **0명도 노출**(v0.3.24) ·「코스 지역」 | OK |
| 계획 1–2 | 플래너·임시저장 | leave `/library` | OK |
| 계획 3 | 동일 게이트+Hint | planInfoPanel Hint | OK |
| P3-a/b/c | 비공개·알림·후기 | public-only 책장 · copy 알림 | OK |

**잔여:** ~~스팟&lt;2 공개 soft-block~~ → **v0.3.25** soft confirm「이대로 공개할까요?」.

---

## P4 — 영향력 구독자

| 단계 | 기대 | 실태 | 판정 |
|------|------|------|------|
| 1 | 작성자→책장 | RouteAuthorCard · `/u` | OK |
| 2 | 팔로우 라벨 | FollowToggle「팔로우 중」·맞팔 | OK |
| 3 | 「구독 코스」스트림 우선 | LibraryTabs | OK |
| 4 | 홈 레일 | FollowingRail | OK |
| 5 | 알림 전이 그룹 위 | UI OK · **`0014` ops** | GAP(ops) |
| 6 | →따라가기 | P1 합류 | OK |
| P4-a | 팔로우 관리 | FollowingPanel | OK |
| P4-b | 언팔 스트림 | `/`·`/library` revalidate (v0.3.24) | OK |
| P4-c | 맞팔 | PersonRow `followsMe` (v0.3.24) | OK |

---

## 교차 · 북스타

| 체크 | 판정 |
|------|------|
| 사용자면「일기」「루트」「팔로잉」탭 없음 | OK |
| 전이 CTA > 저장/♥ | OK |
| 게스트 열람 · AuthGate 쓰기 | OK |
| 브랜드 스플래시·헤더·로그인 | OK |

```text
P3 공개 → P4 팔로우 → P1 발견·따라가기 → P2 다녀왔어요 → P3 알림·통계
```

---

## v0.3.24 핫픽스 목록

1. 따라가는 중 카드 → 원본(미완료) + 초안 상세 배너  
2. FollowNextStepsCard「보관함 · 따라가는 중」  
3. 플래너 FollowReadyHint  
4. 통계 전이 0명 노출 ·「코스 지역」  
5. 정렬「많이 따라간/다녀온」시나리오 동기  
6. 언팔 revalidate 홈/보관함  
7. PersonRow 맞팔(`followsMe`)  
8. 게스트 태그라인 정합  

## v0.3.25 후속

9. 공개 완료 + 준비도 미충족 → soft confirm  
10. 체크리스트「스팟·제목」· e2e/status IA 동기  

## 운영(사람)

- Supabase `0014_transfer_notifications.sql` 미적용 시 P3→P4 알림 루프 무배달 — HANDOFF §4  
- Vercel `NAVER_SEARCH_*` · `NEXT_PUBLIC_SITE_URL` · NCP Maps URL · 실기기 QA
