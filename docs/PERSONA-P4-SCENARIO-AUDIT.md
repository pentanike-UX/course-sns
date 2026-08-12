# P4 · 교차 · 역할전환 — 단계별 시나리오 감사

> **기준 코드:** course-sns `v0.3.24-mvp` · 시나리오 정본 [`PERSONA-SCENARIOS.md`](PERSONA-SCENARIOS.md) §P4 · 교차 · 역할 전환  
> **방법:** 단계마다 라우트·컴포넌트·데이터·카피를 코드로 추적 (런타임 클릭 테스트 아님)  
> **날짜:** 2026-08-12  
> **연계:** [`PERSONA-SCENARIO-PAINPOINTS.md`](PERSONA-SCENARIO-PAINPOINTS.md) FOL-01~03 (v0.3.14 fixed)

심각도: **P0** 루프 막힘 · **P1** 높은 마찰/배달 실패 · **P2** 혼란·스테일 · **P3** 폴리시·주석

---

## 0. 한줄 판정

P4 happy path(책장 팔로우 → 구독 코스/레일 → 따라가기)와 교차 언어·전이 위계는 **대체로 OK**.  
남은 구멍은 **① 프로덕션 `0014` 미적용 시 `course_publish` 무배달**, **② 언팔 후 `/`·`/library` 캐시 무효화 부족**, **③ 사람 목록에서 맞팔 라벨 미전달**.

---

## 1. 표면별 프리플라이트 (요청 컴포넌트)

| 표면 | 상태 | 심각도 | 근거 (file:line) | 구체 수정 |
|------|------|--------|------------------|-----------|
| `RouteAuthorCard` | **OK** | — | `RouteAuthorCard.tsx:9-37` → `/u/[handle]`, 카피「코스 보기」; `RouteView.tsx:285-288` 비소유자 노출 | — |
| `FollowToggle` | **OK** | — | `FollowToggle.tsx:34-62` AuthGate「구독 코스」·라벨 팔로우/맞팔로우/서로 팔로우/**팔로우 중**(「팔로잉」회피) | — |
| 보관함 구독 탭 | **OK** | — | `LibraryTabs.tsx:87` 라벨「구독 코스」; `page.tsx:21-25` `?tab=subscribed`→스트림, `?tab=people`→팔로우 관리 | — |
| `FollowingPanel` | **OK** | — | `FollowingPanel.tsx:14-95` 검색+목록; 진입은「팔로우 관리」(`LibraryTabs.tsx:276-291`) | — |
| `FollowingRail` | **OK** | — | `FollowingRail.tsx:21-60`「구독 중인 새 코스」; 전체 보기→`tab=subscribed`, empty만 `tab=people` | — |
| 알림 그룹핑 | **OK** | — | `notifications/page.tsx:12-18,53-62`「전이 · 구독」↑ /「좋아요 · 댓글」demote; `data.ts:1027-1049` type rank | — |
| `course_publish` | **GAP** | **P0** | 코드·SQL OK (`0014_transfer_notifications.sql:30-52`, UI `notifications/page.tsx:129-132`) · 운영 미확인 (`MVP-SETUP.md:10`, `deliverables/status` ⚠️) | 프로덕션에 `0014` push 후 publish→팔로워 알림 실측 |
| `/u/[handle]` 책장 | **OK** | — | `u/[handle]/page.tsx:79-119`「코스 책장」+ empty CTA「다른 코스 둘러보기」 | — |
| 프로필 following 목록 | **OK** | — | `page.tsx:48-52`「팔로우 중」→`/u/.../following`; `following/page.tsx:20` 타이틀「팔로우 중」 | — |

---

## 2. P4 Happy path (P4-1 … P4-6)

| 단계 | 기대 | 상태 | 심각도 | 근거 | 구체 수정 |
|------|------|------|--------|------|-----------|
| **P4-1** 작성자 진입 | 카드/상세 → `/u/[handle]` 책장 | **OK** | — | 카드: `RouteCard.tsx:120-129` author tap; 상세: `RouteAuthorCard` + `RouteView.tsx:285-288` | — |
| **P4-2** 팔로우 | 토글·맞팔 라벨 | **OK** | — | `FollowToggle.tsx:55-62`; 책장 `followsMe` 배지 `u/[handle]/page.tsx:37-41,70-73` | — |
| **P4-3** 구독 코스 | `?tab=subscribed` 스트림 우선 | **OK** | — | `library/page.tsx:16-25`; 기본 mode=`courses`, 사람 동등칩 제거(`LibraryTabs.tsx:264-306`) | — |
| **P4-4** 홈 레일 | 로그인 시 신작 레일 | **OK** | — | `FeedExplorer.tsx:604-606` `profile && FollowingRail`; `page.tsx:80` 스트림 fetch | 지도 모드에서는 리스트 패널과 함께 밀려 숨김 — 의도적(레일은 리스트 홈) |
| **P4-5** 새 코스 알림 | 전이·구독 > 좋아요·댓글 | **OK**(코드) / **GAP**(운영) | **P0** | UI·정렬 OK; 트리거 미적용 시 알림 0건 | `supabase db push`로 `0014` 적용 · status 페이지 ✅로 갱신 |
| **P4-6** 따라가기 | 상세 CTA → P2 | **OK** | — | `CourseFollowActions.tsx:25-30` + `CopyRouteButton`「이 코스 따라가기」; 위계 `RouteView.tsx:222-236` proof→CTA→like/save | — |

---

## 3. P4 변형 (a/b/c)

| ID | 기대 | 상태 | 심각도 | 근거 | 구체 수정 |
|----|------|------|--------|------|-----------|
| **P4-a** 사람 관리 |「팔로우 관리」또는 프로필 following | **OK** | — | `LibraryTabs.tsx:286-291`「팔로우 관리」; 프로필 Stat「팔로우 중」`page.tsx:48-52` | — |
| **P4-b** 언팔 후 스트림 정리 | 해당 메이커 신작 감소 | **GAP** | **P2** | DB 삭제 OK `u/[handle]/actions.ts:19-25`; `getFollowingFeed` follows 기반 `data.ts:197-211`. 그러나 `revalidatePath("/u")`만 (`actions.ts:28`) — `/`·`/library` RSC 캐시 잔존 가능. `FollowToggle`의 `router.refresh()`는 **현재 페이지만** | `revalidatePath("/", "layout")` + `revalidatePath("/library")` (+ 필요 시 `/notifications`) |
| **P4-c** 맞팔 인지 | 라벨 → 책장 재방문 | **부분 OK** | **P2** | 책장 토글·배지 OK. `PersonSummary`에 `followsMe` 없음(`data.ts:817-826`) → `PersonRow.tsx:39-43`이 `followsMe` 미전달 → 팔로우 관리/following 목록에서「맞팔로우/서로 팔로우」불가 | `hydratePeople`에 follows-me 조인 · `PersonRow`에 prop 전달 |

---

## 4. 교차 시나리오 end-to-end 루프

```text
[P3 공개] → [P4 팔로우] → [P1 발견·따라가기] → [P2 다듬기·다녀왔어요] → [P3 알림·통계]
```

| 체크 | 상태 | 심각도 | 근거 | 구체 수정 |
|------|------|--------|------|-----------|
| P3 공개 → 팔로워 알림 | **GAP** | **P0** | 트리거 코드 OK · 운영 `0014` 미확인 | 프로덕션 push + 데모 계정으로 publish 실측 |
| P4 팔로우 → 스트림/레일 | **OK** | — | FOL-01/02 반영 | — |
| P1 따라가기 | **OK** | — | 전이 CTA 위계 DET-01/02 | — |
| P2 보관함·완주 | **OK** | — |「따라가는 중」체크리스트 | — |
| P3 copy/completion 수신 | **OK**(코드) / **GAP**(운영) | **P1** | `copy` 트리거도 `0014`; UI 타입「따라가기」「완주」 | 동일 `0014` 적용 |
| 언어「코스」 | **OK** | — | 사용자 JSX에「일기」「루트」문자열 없음(아래 §5) | 주석 잔상만 P3 |
| 위계 전이 > 좋아요 | **OK** | — | `RouteView.tsx:222-236`; `RouteActions.tsx:14-16` icon-only demote | — |
| 게스트 열람 | **OK** | — | AuthGate 기본 카피 `AuthGate.tsx:75-77`; 상세/책장 공개 | `/library` 딥링크는 §5 |
| 브랜드 coursee | **OK** | — | 락업·headers (브랜드 Wave 이력) | — |

---

## 5. 교차 언어 · 게스트 세부

| 체크 | 상태 | 심각도 | 근거 | 구체 수정 |
|------|------|--------|------|-----------|
| 사용자면「일기」없음 | **OK** | — | `rg` UI 문자열 0건. AuthGate 주석도「코스 기록」(`AuthGate.tsx:24`) | — |
| 사용자면「루트」없음 | **OK** | — | UI 0건. 주석만: `data.ts:498`「이 루트 따라가기」, `@drawer`「내 일기」 | 주석을「코스」로 정리 (P3) |
| 사용자 탭「팔로잉」없음 | **OK** | — | 탭「구독 코스」`LibraryTabs.tsx:87`; 토글「팔로우 중」`FollowToggle.tsx:59` | 개발 주석「팔로잉」잔상 정리 (P3) |
| 전이 > 좋아요 | **OK** | — | §4와 동일 | — |
| 게스트 Browse OK | **OK** | — | `/`, `/routes/[id]`, `/u/[handle]` 로그인 불필요 | — |
| 게스트 쓰기 AuthGate | **OK** | — | 따라가기/팔로우/좋아요/FAB | — |
| 게스트 `/library` 딥링크 | **GAP** | **P3** | 레이아웃 Auth 없음 → 빈 보관함 셸. BottomNav만 게이트(`BottomNav.tsx:387-398`) | `library/page.tsx`에서 비로그인 시 AuthGate/리다이렉트 또는 안내 empty |

---

## 6. 역할 전환 맵

| From → To | 트리거(시나리오) | 상태 | 근거 | 비고 |
|-----------|------------------|------|------|------|
| G → P1 | 로그인 후 쇼핑 | **OK** | AuthGate → `next=` 복귀 | — |
| P1 → P2 | 따라가기 성공 | **OK** | Copy → 보관함「따라가는 중」 | — |
| P2 → P3 | FAB 작성 | **OK** | BottomNav FAB AuthGate | — |
| P1/P2 → P4 | 메이커 팔로우 | **OK** | RouteAuthorCard/카드 → FollowToggle | — |
| P4 → P2 | 구독 코스 따라가기 | **OK** | 스트림/레일 → 상세 → Copy | — |
| P3 → 영향 | 타인 copy/completion | **GAP** | **P0/P1** | 코드 경로 OK · `0014` 운영 의존 |

---

## 7. 잔여 GAP 백로그 (신규 ID)

| ID | 단계 | 심각도 | 한 줄 | 수정 위치 |
|----|------|--------|-------|-----------|
| **FOL-04** | P4-b | P2 | 언팔 후 홈/보관함 스트림 스테일 가능 | `u/[handle]/actions.ts` `revalidatePath` 확장 |
| **FOL-05** | P4-c | P2 | 사람 목록 맞팔 라벨 부재 | `PersonSummary`+`hydratePeople`+`PersonRow` |
| **FOL-06** | P4-5 · 교차 | **P0** | 프로덕션 `0014` 미적용 시 publish/copy 알림 무배달 | Supabase push · status 갱신 |
| **LIB-G1** | 교차 게스트 | P3 | `/library` 딥링크 빈 셸 | library 페이지 게스트 게이트 |
| **HYG-01** | 언어 | P3 | 코드 주석「일기/루트/팔로잉」잔상 | `data.ts`, `FollowingPanel`, `FeedExplorer`, `@drawer` |

이미 fixed (참고): FOL-01 구독 탭 · FOL-02 레일 CTA · FOL-03 알림 배지/책장 empty (`PERSONA-SCENARIO-PAINPOINTS.md`).

---

## 8. 단계×파일 인덱스

| 단계 | 주요 파일 |
|------|-----------|
| P4-1 | `RouteCard.tsx`, `RouteAuthorCard.tsx`, `RouteView.tsx`, `u/[handle]/page.tsx` |
| P4-2 | `FollowToggle.tsx`, `u/[handle]/actions.ts` |
| P4-3 | `library/page.tsx`, `LibraryTabs.tsx`, `data.ts` `getFollowingCourseStream` |
| P4-4 | `FollowingRail.tsx`, `FeedExplorer.tsx`, `(tabs)/page.tsx` |
| P4-5 | `notifications/page.tsx`, `data.ts` `getNotifications`, `0014_*.sql` |
| P4-6 | `CourseFollowActions.tsx`, `CopyRouteButton.tsx`, `RouteActions.tsx` |
| P4-a | `LibraryTabs.tsx` FollowingCoursesPanel, `FollowingPanel.tsx`, `following/page.tsx` |
| P4-b | `actions.ts` toggleFollow, `getFollowingFeed` |
| P4-c | `FollowToggle.tsx`, `PersonRow.tsx`, `data.ts` PersonSummary |
