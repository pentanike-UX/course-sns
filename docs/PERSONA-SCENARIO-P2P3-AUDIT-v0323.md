# P2·P3 페르소나 시나리오 코드 감사 (v0.3.23-mvp)

> **기준 코드:** `fb2acf3` · `APP_VERSION = v0.3.23-mvp`  
> **시나리오 정본:** [`PERSONA-SCENARIOS.md`](PERSONA-SCENARIOS.md) §P2·§P3  
> **감사일:** 2026-08-12  
> **초점:** v0.3.23 이후 잔여 GAP — dirty confirm · next labels · CTA tones · publish gate · stats language

판정: **OK** = 시나리오 기대와 코드 정합 · **GAP** = 기대 대비 불일치/잔여 마찰  
심각도: **P0** 사용 막힘 · **P1** 높은 마찰 · **P2** 혼란·불쾌 · **P3** 폴리시

---

## 요약 — v0.3.23 이후 잔여 GAP

| ID | 단계 | 한 줄 | 심각도 |
|----|------|-------|--------|
| P2-CARD | P2-2 / P2-a / P2-4 | 따라가는 중 카드 탭 → 초안 상세(완주 CTA 없음). ProgressBar만 원본으로 보냄 | P1 |
| P3-PLAN-HINT | P3 plan-3 / P3-3 | 플래너 `planInfoPanel`에 `FollowReadyHint` 없음(기록 위자드·edit만 있음) | P1 |
| P3-SOFT | P3-3 / P3-4 | 공개+미충족이어도 soft 경고만 — hard-block 없음 | P2 |
| P3-STAT-0 | P3-6 | `reactionTotal===0`이면「전이·영향력」섹션 자체 숨김(0명 피드백 없음) | P2 |
| P3-STAT-COPY | P3-6 | 통계「다녀온 지역」등 개인 로그 톤 잔상 | P3 |
| P2-SPOT | P2-2 / P2-b | `스팟 확인`이 spotCount≥1이면 즉시 done — “확인” 행위와 약함 | P3 |

v0.3.12–0.3.23에서 **fixed로 확인된 축:** dirty X/OS-back confirm · edit `visibilityChosen` seed · next「후기 수정」· CTA 톤 사다리 · 저장 카드 분리 · 드로어 팔로워 · SaveNotice 공개 분기 · create→detail `replace`.

---

## P2 Happy path

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| P2-1 | `/library` 진입 시「따라가는 중」기본 | `library/page.tsx:16-23` 기본 `following`; `LibraryTabs.tsx:85` 라벨「따라가는 중」 | **OK** | — | — |
| P2-2 | 따라가는 중 카드 + 진행 체크리스트(스팟·이동·다녀왔어요) | `LibraryTabs.tsx:146-239` `FollowProgressBar` 3스텝; 실데이터 move=`transitLabel`/`totalDurationMin` (`:163-168`) | **OK** (카드 탭은 GAP↓) | — | ProgressBar는 정합. 카드 본체 탭은 P2-CARD |
| P2-3 | `/routes/[id]/edit`에서 스팟·이동·시간 조정, 임시저장/완료 | plan 복제→`isPlanDraft` 플래너(`RouteForm.tsx:1350-1389`) 임시저장+dirty; record 복제→단일 페이지 edit(`:1396-1512`) **완료만**(임시저장 없음) | **OK** | P3 | record 초안에도 임시저장이 필요하면 헤더 draft intent 추가 |
| P2-4 | 원본/내 코스 상세 CTA「다녀왔어요」(톤 사다리) | 원본: `CourseFollowActions.tsx:33-54` + `CompleteCourseButton.tsx:35-42` outline. **초안 상세는 `isOwner`라 CTA 없음** (`RouteView.tsx:223-248`). 카드→`/routes/{copyId}` (`RouteCard.tsx:28`) | **GAP** | **P1** | 카드 탭을 원본으로, 또는 초안 상세에「원본에서 다녀왔어요」배너 CTA |
| P2-5 | 별점+한 줄 팁 → completion → 원본 프루프 | `CompleteCourseButton.tsx:86-124` 시트; `submitCompletion` → `RouteView` transferProof | **OK** | — | — |
| P2-6 | 「후기 수정」neutral 톤 | 시나리오는 neutral, 코드는 **ink solid primary** (`CompleteCourseButton.tsx:38-39`) — CTA-01 의도적 강조. draft 링크는 text soft (`CourseFollowActions.tsx:40-45`) | **OK** | P3 | 시나리오 문구를「ink primary」로 정합 |

---

## P2 변형

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| P2-a | 다듬지 않고 원본 → 다녀왔어요 | nextLabel 준비 완료 시「원본에서 다녀왔어요」→`originalHref` (`LibraryTabs.tsx:187-198`). 카드 탭은 초안 | **GAP** | **P1** | P2-CARD와 동일 — ProgressBar 우회 경로 보강 |
| P2-b | 재진입 시 체크리스트로 다음 할 일 | incomplete step `text-sunset-ink` + nextLabel 분기 (`LibraryTabs.tsx:200-228`). done 시「후기 수정」+「내 초안 보기」(`:230-237`) | **OK** | P3 | `스팟 확인`이 복제 직후 거의 항상 ✓ (`spotCount≥1`) — 실질 next는 이동/완주 |
| P2-c | 저장 → 카드「따라가기」→ P2 합류 | `CollectionCard.tsx:33-58` 뱃지「저장 · 아직 안 따라감」+ footer `CopyRouteButton` `primary` sunset | **OK** | — | — |

---

## P2 검증 포인트 (CTA 상태)

| 상태 | 기대 | 코드 실태 | 판정 |
|------|------|-----------|------|
| 미복제 | Primary brand「따라가기」 | `CourseFollowActions.tsx:25-30` + `CopyRouteButton` `bg-sunset` | **OK** |
| 복제·미완주 | outline「다녀왔어요」+ Secondary 초안 | `CompleteCourseButton.tsx:40-41` border-2 sunset; `CourseFollowActions.tsx:47-52` | **OK** |
| 완주 | 「후기 수정」구분 톤 + soft 초안 | ink solid + text link (`CompleteCourseButton.tsx:38-39`, `CourseFollowActions.tsx:40-45`) | **OK** |

---

## P3 Happy path — 기록

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| P3-1 | FAB →「코스 기록하기」 | `BottomNav.tsx:444-470` 시트 옵션「코스 기록하기」→ `/routes/new` | **OK** | — | — |
| P3-2 | `/routes/new` 위자드 스팟·사진·이동·추천·난이도 | `RouteForm.tsx:1516-1637` 5스텝 (사진→지역/스팟→이동→이야기→공개) | **OK** | — | — |
| P3-3 | soft hint: 지역·추천·난이도·스팟≥2 등 | `FollowReadyHint` (`RouteForm.tsx:3294-3351`) create step5·edit share에 노출(`:1619-1626`, `:1488-1495`). **플래너 planInfo에는 없음** | **GAP** | **P1** | `planInfoPanel` 공개 블록 위에 동일 Hint 삽입 |
| P3-4 | 공개/비공개 명시 선택(실수 공개 방지) | `visibilityChosen` create 필수(`:259`, `:617-627`, finish disabled `:1670`); edit seed `mode==="edit"` (`:259`); `VisibilityPicker` chosen 전 non-active (`:3646-3679`) | **OK** | P2 | 공개+미충족 soft만 — P3-SOFT |
| P3-5 | 완료 후 책장·내 코스 노출 | `actions.ts:151-153` `RedirectType.replace` → `?created=1`; `SaveNotice.tsx:42-86` 공개 시「공개했어요」+ 책장/통계 링크; 책장=`getUserProfile` public only (`data.ts:845`) | **OK** | — | — |
| P3-6 | `/profile/stats`·알림에서 따라감·다녀옴·팔로워 (좋아요 하위) | 드로어: 따라감/다녀옴/공개/팔로워 (`ProfileDrawerBody.tsx:57-65`); 통계: 전이 섹션 상단 but **0이면 숨김** (`stats/page.tsx:79-90`); 알림:「전이·구독」위·소셜 demoted (`notifications/page.tsx:53-62`) | **GAP** | **P2** | 전이 타일 0명이어도 항상 표시;「다녀온 지역」→「코스 지역」 |

---

## P3 Happy path — 계획

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| plan-1 | FAB →「코스 계획하기」지도 플래너 | `BottomNav.tsx:464-469` → `/routes/new?type=plan`; `RouteForm.tsx:1309-1347` `PlannerFrame`「새 코스 계획」 | **OK** | — | — |
| plan-2 | 스팟·이동 배치 후 저장(비공개 가능) | 임시저장 draft intent + `planInfoPanel` 공개 피커(`:1245-1306`); leaveHref `/library` (`:783-788`) | **OK** | — | — |
| plan-3 | 다듬은 뒤 공개 = 기록과 동일 게이트 | 공개 게이트는 동일(`visibilityChosen`). **FollowReadyHint 누락**으로 기록 경로와 준비도 비대칭 | **GAP** | **P1** | P3-PLAN-HINT |

---

## P3 변형

| 단계 | 기대 | 코드 실태 (file:line) | 판정 | 심각도 | 구체 개선 |
|------|------|----------------------|------|--------|-----------|
| P3-a | 비공개만 → 책장 미노출 | `VisibilityPicker` 비공개; `/u/[handle]` public only (`data.ts:845`, `u/[handle]/page.tsx:80-84`) | **OK** | — | — |
| P3-b | 따라감 알림·통계 증가 | `notifications` copy 메시지「따라가기 시작했어요」(`:113-120` 부근); 통계 `copiesReceived` | **OK** | P3 | 카피를 시나리오「따라갔어요」로 짧게 통일 가능 |
| P3-c | 다녀옴 후기 유입 | 원본 상세 completions 섹션 (`routes/[id]/page.tsx` completionCount>0); 알림 type completion | **OK** | — | — |

---

## 초점 축 심층 (v0.3.23 이후)

### 1) Dirty confirm

| 항목 | 코드 실태 | 판정 | 잔여 |
|------|-----------|------|------|
| 플래너 X | `formCloseButton` → `requestExitForm` (`RouteForm.tsx:826-838`, `:796-798`) | **OK** | — |
| 작성/수정 X | create·edit 모두 `left={formCloseButton}` (`:1400`, `:1521`) | **OK** | — |
| OS/제스처 back | dirty 시 `history.pushState` + `popstate` confirm (`:801-824`) — v0.3.23 CREATE-back | **OK** | pushState 잔여 히스토리 엔트리는 P3 폴리시 |
| 미변경 즉시 이탈 | `!isDirty` → `leaveForm()` | **OK** | — |

### 2) Next labels (`FollowProgressBar`)

| 조건 | 라벨 | 판정 |
|------|------|------|
| !spots | 스팟 다듬기 → edit | **OK** |
| !move | 이동 확인하기 → edit | **OK** |
| ready+원본 | 원본에서 다녀왔어요 → original | **OK** (카드 탭 우회는 GAP) |
| done+원본 | 후기 수정 → original (+ 내 초안 보기) | **OK** |

### 3) CTA tones

| CTA | 톤 | 판정 |
|-----|-----|------|
| 따라가기 | sunset solid | **OK** |
| 다녀왔어요 | sunset outline (prominent) | **OK** |
| 후기 수정 | ink solid (시나리오「neutral」과 문구 drift) | **OK** (의도) |
| 저장 카드 따라가기 | sunset primary short | **OK** |

### 4) Publish gate

| 항목 | 판정 | 잔여 |
|------|------|------|
| create finish 전 명시 탭 | **OK** | — |
| edit seed (재탭 강제 제거) | **OK** | — |
| draft 임시저장은 게이트 스킵 | **OK** (의도) | — |
| FollowReadyHint 공개 경고 강화 | **OK** (soft) | hard-block 없음 = P3-SOFT |
| 플래너 완료 경로 Hint | **GAP** | P3-PLAN-HINT |

### 5) Stats language

| 면 | 실태 | 판정 |
|----|------|------|
| 드로어 4셀 | 따라감·다녀옴·공개·팔로워 (저장 demote) | **OK** |
| 통계 타이틀 |「코스 통계」 | **OK** |
| 전이 섹션 | 상단 배치, 좋아요 조건부 | **OK** / 0명 숨김 **GAP** |
|「다녀온 지역」 | 개인 여행 톤 | **GAP** P3 |

---

## 컴포넌트 매핑 (감사 범위)

| 컴포넌트 | 역할 | 주요 경로 |
|----------|------|-----------|
| `LibraryTabs` / `FollowProgressBar` | P2 체크리스트·next | `src/app/(tabs)/library/LibraryTabs.tsx` |
| `CollectionCard` | P2-c 저장→따라가기 | `…/CollectionCard.tsx` |
| `BottomNav` FAB sheet | P3-1 / plan-1 | `src/components/BottomNav.tsx` |
| `RouteForm` + `FollowReadyHint` + dirty | P2-3 · P3-2..4 · plan | `src/components/RouteForm.tsx` |
| `CompleteCourseButton` / `CourseFollowActions` | P2-4..6 | `src/app/routes/[id]/` |
| `ProfileDrawerBody` / `profile/stats` | P3-6 | `src/components/ProfileDrawerBody.tsx`, `…/stats/page.tsx` |
| `notifications` | P3-6 / P3-b/c | `src/app/notifications/page.tsx` |
| `SaveNotice` + create replace | P3-5 | `SaveNotice.tsx`, `routes/new/actions.ts` |

---

## 권장 수정 순서

1. **P1** 따라가는 중 카드 → 원본(또는 초안 상세에 완주 배너)  
2. **P1** 플래너 `planInfoPanel`에 `FollowReadyHint`  
3. **P2** 통계 전이 0명 타일 상시 노출 +「다녀온 지역」카피  
4. **P2/P3** 공개 시 스팟&lt;2 soft-block(확인 시트) 검토  
5. **P3** 시나리오 P2-6「neutral」문구를 ink primary에 맞게 수정
