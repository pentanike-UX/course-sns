# G · P1 단계별 코드 실태 감사 (v0.3.23-mvp)

> **기준 브랜치:** `cursor/persona-scenarios-31ef` · `APP_VERSION = v0.3.23-mvp`  
> **시나리오:** [`PERSONA-SCENARIOS.md`](PERSONA-SCENARIOS.md) §G · §P1  
> **페인포인트:** [`PERSONA-SCENARIO-PAINPOINTS.md`](PERSONA-SCENARIO-PAINPOINTS.md) — G/P1 항목 대부분 ✅ fixed 표기  
> **방법:** 단계마다 실제 소스 open → 기대 vs 실태 대조 (문서 주장과 무관하게 코드만 판정)  
> **날짜:** 2026-08-12

심각도: **P0** 사용 막힘 · **P1** 높은 마찰 · **P2** 혼란·불쾌 · **P3** 폴리시

**한 줄:** Wave G1–G6로 막히던 P0/P1은 대부분 해소. **잔여 GAP은 정렬 라벨 문서 드리프트·가져왔어요→보관함 연결·브랜드 태그라인 불일치·지도 리스트 행 CTA** 쪽.

---

## G — 게스트 첫 방문

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| G1 | `/` 공개 코스 쇼핑 피드. 스플래시 후 coursee 브랜드 | `AppSplash.tsx:69` BrandLockup(dark) → `HomeBoot` `app:ready`. 게스트 헤더 `FeedExplorer.tsx:538-543` BrandWordmark +「좋은 코스, 따라가 보세요」. 피드 `FeedRouteCard` | **OK** (브랜드 노출) / 태그라인은 BRAND.md와 불일치 → 아래 BRAND-G | — | 스플래시·로그인·게스트 헤더 루프 카피 통일 검토 |
| G2 정렬 | 최신·**많이 따라간**·**많이 다녀온**·가까운 | `FeedControls.tsx:64-83` 칩 =「최신」「**따라간**」「**다녀온**」「가까운」. 레이아웃은 오버플로 메뉴(`:85-138`) | **GAP** | **P2** | 시나리오·HANDOFF·COURSE-UX는 여전히「많이 따라간/다녀온」. GUI 핫픽스(HOME-sort)가 축약만 하고 정본 미갱신. **칩을「많이 따라간/다녀온」으로 되돌리거나**, 시나리오/HANDOFF를「따라간/다녀온」으로 동기화 |
| G2 필터 | 지역·누구와·난이도 우선 (감정·테마 아래) | `FeedFilterSheet.tsx:113-160` 지역 → 누구와·무엇을 → 난이도 → 종류 → ThemeSection/MoodSection 기본 접힘(`:188-246`) | **OK** | — | — |
| G2 가까운 거절 | 안내 + 칩 해제 | `FeedExplorer.tsx:402-409` geoDenied 시 sort 쿼리 제거(최신). `:588-601` 배너「최신순으로 보여드려요」 | **OK** | — | — |
| G3 | 스펙·전이 위주 상세. 좋아요 보조 | `RouteView.tsx:194-236` 콜드「첫 따라가기」슬롯 → `CourseFollowActions` → `RouteActions` 아이콘 demote(`RouteActions.tsx:14-16,70-96`). `courseSummary` 스펙 칩 | **OK** | — | — |
| G4 | `/?mode=map` 핀·클러스터·peek에 스펙+전이 | `FeedMap.tsx:49-64` `mapPointMeta` = spec · 따라감/다녀옴/첫 따라가기. fullscreen `SheetSelectedCard:957` CopyRouteButton. `filterSig:224-231` 전 필터 필드 | **OK** (peek/필터) | — | SheetRow(`:995-1001`)는「보기」만 — 선택 전 전이는 메타 문구로만 |
| G4→따라가기 | 지도에서 바로 따라가기 | `RouteDetailSheet.tsx:342-345` prominent CopyRouteButton. `SheetSelectedCard:957` primary「따라가기」 | **OK** | — | — |
| G5 | `/u/[handle]` 공개 코스·팔로우 버튼 | `u/[handle]/page.tsx:65-70` FollowToggle, `:79-108` 책장 + empty「다른 코스 둘러보기」 | **OK** | — | — |
| G6 | 상세 CTA → AuthGate「따라가려면 로그인」 | `CopyRouteButton.tsx:15-18,70-72` title「따라가려면 로그인이 필요해요」·비공개 초안 설명. secondary「계속 둘러보기」(`AuthGate.tsx:80`) | **OK** | — | 기본 AuthGate(`:74-77`)는 저장·후기 병기 — 따라가기 경로는 FOLLOW_AUTH로 덮음 |

### G 잔여 (시나리오 성공/실패 조건)

| ID | 관련 | 실태 | 판정 | 심각도 | 구체 개선 |
|----|------|------|------|--------|-----------|
| BRAND-G | G1 | 게스트 헤더「좋은 코스, 따라가 보세요」(`FeedExplorer:541`) ≠ `BRAND.md` Tagline「See how they got there.」. 로그인(`login/page.tsx:61-63`)·스플래시(태그라인 없음)와 3중 불일치 | **GAP** | **P3** | 제품 루프 한 줄로 통일(권장: 헤더/로그인 동일)하거나, 스플래시에도 같은 훅 1줄 |
| SORT-DOC | G2 | 코드「따라간/다녀온」vs 시나리오「많이 따라간/다녀온」 | **GAP** | **P2** | 정본 한쪽으로 맞출 것 (위 G2) |
| SHEET-META | G4 | `RouteDetailSheet:335` 전이 옆에「댓글 N」병기 | **GAP** | **P3** | 댓글 카운트 demote/제거 — 전이가 1초 신호로 읽히게 |

---

## P1 — 탐색러 Happy path

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| P1-1 | 카드에 실행 스펙 + 따라감/다녀옴 | `FeedRouteCard` SpecLine(`:246-258`) + TransferPill(`:262-287`) 콜드 고정「첫 따라가기」. MetaRow small도 동일(`:307-308`) | **OK** | — | — |
| P1-2 | 필터: 지역 → 누구와 → 난이도 (감정·테마보다 위) | `FeedFilterSheet` 섹션 순서 + 테마/감정 접힘 | **OK** | — | — |
| P1-3 | 정렬「많이 따라간」또는「많이 다녀온」 | 칩「따라간」「다녀온」(`FeedControls:70-78`). sort 키 `followed`/`completed`는 동작 | **GAP** | **P2** | 「많이 —」복원 또는 시나리오 문구를 현행 칩에 맞춤. 데모 스크립트(`PERSONA-SCENARIOS` §데모)도 불일치 |
| P1-4 | 지도 peek = 스펙 + 전이 (♥ 아님) | `mapPointMeta` 전이만. ♥ 없음. fullscreen 선택 카드에 따라가기 CTA | **OK** | — | SheetRow「보기」만 → 한 탭 더 (P3) |
| P1-5 | Primary CTA = 따라가기 | `CourseFollowActions.tsx:25-29` CopyRouteButton prominent. 하트/저장은 구분선 아래 아이콘(`RouteView:229-236`) | **OK** | — | likeCount>0일 때 숫자 노출(`RouteActions:82`) — SNS 잔상 P3 |
| P1-6 | 「이 코스 따라가기」→ AuthGate → 복제 → **비공개 초안** | AuthGate 카피 OK. 목적 시트(`CopyRouteButton:93-145`) → `actions` redirect `edit?followed=1` | **OK** | — | 목적 선택 1스텝 추가 마찰은 설계 의도 |
| P1-7 | 가져왔어요 가이드 / next-step → 보관함「따라가는 중」 | `RouteForm.tsx:3398-3428` FollowNextStepsCard: 체크리스트만, **`/library` 링크 없음**. plan back은 `/library`(`:787`)이나 가이드 카드와 무관 | **GAP** | **P2** | 카드에 primary「보관함 · 따라가는 중」→ `/library` (또는 닫기 옆 텍스트 CTA) |

### P1 변형

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| P1-a | 상세「저장」→ 보관함「저장」→ 나중에「따라가기」 | `RouteActions` 북마크 AuthGate「저장하려면…」. `CollectionCard.tsx:36-56`「저장 · 아직 안 따라감」+ 푸터 CopyRouteButton | **OK** | — | — |
| P1-b | 홈「구독 중인 새 코스」→ 상세 → 따라가기 | `FollowingRail.tsx:21-60` 타이틀「구독 중인 새 코스」. 데이터 있을 때「전체 보기」→ `tab=subscribed`. empty만 `tab=people` | **OK** | — | — |
| P1-c | 콜드 전이 카피「첫 따라가기」— ♥ 폴백 금지 | TransferPill/MetaRow/mapPointMeta/RouteView/RouteDetailSheet 모두 콜드 슬롯 고정. lifestyle/difficulty 폴백 **제거됨** | **OK** | — | — |

---

## 포커스 영역 요약 (요청 항목)

| 포커스 | v0.3.23 실태 | 잔여? |
|--------|--------------|-------|
| micro-copy · 정렬 | 「따라간」「다녀온」축약 — 시나리오「많이 —」와 충돌 | **GAP P2** |
| CTA hierarchy | 상세·지도시트: 따라가기 > 저장/♥. 지도 SheetRow는「보기」만 | 상세 OK / SheetRow P3 |
| empty states | 홈 필터/검색/콜드 empty CTA sunset (`FeedExplorer:428-475`). 책장 empty CTA OK | OK |
| AuthGate copy | 따라가기 전용 카피 양호. 댓글/저장/팔로우 분기됨 | OK |
| 콜드「첫 따라가기」 | 카드·peek·시트·상세 일치 | OK (DET-01/CARD-01/MAP-03 fixed 유지) |
| guest brand tagline | 워드마크+루프 한 줄 있음. BRAND/로그인/스플래시와 불일치 | **GAP P3** |
| map follow CTA | SheetSelectedCard + RouteDetailSheet에 존재 | OK (MAP-02 fixed 유지) |

---

## 아직 유효한 개선 백로그 (G/P1 only, 우선순위)

| 순위 | ID | 단계 | 심각도 | 한 줄 |
|------|-----|------|--------|-------|
| 1 | SORT-01 | G2 / P1-3 | P2 | 「따라간/다녀온」↔「많이 따라간/다녀온」정본 통일 |
| 2 | NEXT-01 | P1-7 | P2 | FollowNextStepsCard → `/library` CTA |
| 3 | BRAND-G | G1 | P3 | 게스트/로그인/스플래시 태그라인 통일 |
| 4 | SHEET-META | G4 | P3 | 지도 상세 시트「댓글 N」demote |
| 5 | MAP-ROW | G4 / P1-4 | P3 | SheetRow에 따라가기 또는 전이 강조 |
| 6 | DET-♥ | P1-5 | P3 | likeCount 숫자까지 숨기고 아이콘만 |

---

## 판정 범례

- **OK** — 시나리오 기대와 코드가 실질적으로 일치 (고정된 painpoint 유지 포함)
- **GAP** — v0.3.23 코드에 아직 기대 미달 (문서상 fixed여도 잔여·신규·드리프트 포함)

`main`은 아직 `v0.3.8-mvp` — 위 OK 항목(지도 필터·시트 CTA·콜드 슬롯·BrandWordmark 등)은 **이 브랜치(v0.3.23) 기준**이다.
