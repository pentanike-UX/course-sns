# 브랜드 컬러 · 사용성 · 페르소나 페인포인트 분석

> **범위:** course-sns MVP (`DESIGN-SYSTEM.md` · `COURSE-UX-DESIGN.md` · 현재 코드)  
> **목적:** 브랜드 컬러 규칙·적용 정합성과, P1–P4 시나리오 페인포인트를 점검한 뒤 UX 개선 방향 도출  
> **기준일:** 2026-07-22

---

## 0. 한 줄 요약

Phase 0–3으로 **전이(따라가기·다녀왔어요) 언어·IA는 자리 잡았으나**, 브랜드 레드가 CTA·상태·지도·에러·성공에 과도하게 겹치고, 일부 표면(지도 peek·보관함 아이콘·좋아요 폴백)이 아직 **좋아요 멘탈모델**을 남겨 페르소나별 실행 루프에 마찰을 만든다.

---

## 1. 브랜드 컬러 규칙 (현행)

| 역할 | 토큰 | 규칙 |
|------|------|------|
| **브랜드 액션** | `--brand-primary` / `--sunset` (`#ef4444`·`#dc2626`) | 주 CTA, FAB, 내비 active, primary 버튼 |
| **선택·필터** | `bg-ink text-paper` | 정렬·필터·레이아웃 토글 active — **레드 금지** |
| **표면·잉크** | `--paper` / `--ink*` | 뉴트럴 (녹회·그린 tint 없음) |
| **상태** | `--success` / `--leaf` / `--error` | 문서상 분리, **값은 모두 레드 계열** |
| **지도 이동** | `TRANSPORT_COLOR` | 수단별 구분색 (도보=`#dc2626` = 브랜드 레드) |

**원칙과의 정합:** CTA vs 선택 분리는 FeedControls·보관함 서브칩에서 잘 지켜지고 있다.  
**구조적 리스크:** success / leaf / error / brand / walk path가 시각적으로 한 가족 → “무엇을 해도 빨갛다” 인지 부하.

---

## 2. 컬러 적용 진단

### 2.1 잘 지켜진 점

- Primary CTA(`따라가기`, `다녀왔어요`, FAB, empty CTA) → `bg-sunset`
- 필터/정렬 active → `bg-ink` (브랜드와 역할 분리)
- 팔로우 미구독 = 레드, 구독 중 = 뉴트럴 보더 (관계 상태 읽힘)
- 다크모드에서 브랜드만 밝게(`#f87171`), 표면은 charcoal — 문서와 일치

### 2.2 페인포인트 (컬러)

| ID | 이슈 | 영향 |
|----|------|------|
| C1 | **성공·에러·브랜드 동일 계열** — `--success`/`--leaf`/`--error`/`--sunset`이 모두 레드. `다녀옴` 뱃지·좋아요 on·삭제 CTA·에러 wash가 비슷한 톤 | “완료”와 “위험/실패” 구분 실패, 신뢰 신호 약화 |
| C2 | **레드 과밀(특히 P3 플래너)** — 스텝 인디케이터, 섹션 칩, 맵 모드, 시트 핸들, 필수 `*`, 에러/힌트 wash, 번호 뱃지까지 sunset | 주 CTA(완료·따라가기)가 묻힘 |
| C3 | **지도 도보 라인 = 브랜드 레드** — `TRANSPORT_COLOR.walk` = `#dc2626` | CTA 의미와 동선 의미가 충돌; “위험한 길”처럼 읽힐 여지 |
| C4 | **레거시 토큰명** — `--primary-green-*`, `--sunset`, `text-leaf` | 구현·리뷰 시 그린/성공 오해 → 잘못된 hex·의미 회귀 |
| C5 | **에러 UI가 sunset-wash** — 폼/완주 에러를 `bg-sunset-wash text-sunset-ink`로 표기 | 위험과 브랜드 힌트가 동일 표면 |

### 2.3 컬러 개선 방향

1. **상태 색 재분리 (우선)**  
   - Success: 뉴트럴 ink 또는 별도 cool/teal(브랜드와 비충돌) — “완료·긍정” 전용  
   - Error: 기존 destructive 유지하되 brand soft와 채도/명도 차별  
   - Brand red: **전환 CTA만** (따라가기 / 다녀왔어요 / FAB / 로그인 primary)
2. **레드 예산제** — 화면당 primary red 면적 1곳(또는 1그룹). 플래너 진행·선택·번호는 ink/muted로 강등
3. **지도 수단색** — 도보를 brand와 분리(예: `--plan-ink` 또는 전용 walk slate). sky/bus/subway는 유지
4. **토큰 rename 로드맵** — 신규 코드는 `--brand-*`만; `--primary-green-*`/`leaf`는 alias로 freeze 후 단계적 폐기
5. **에러 표면** — `bg-error-soft text-[color:var(--error)]`로 통일, sunset-wash는 힌트·배지만

---

## 3. 페르소나별 시나리오 · 페인포인트

페르소나 정의는 `COURSE-UX-DESIGN.md` 기준:  
**P1 탐색러 · P2 따라가이 · P3 코스 메이커 · P4 영향력 구독자**

### 3.1 P1 — 탐색러 (발견 → 상세 → 따라가기)

**시나리오:** 홈에서 지역·누구와·난이도 필터 → 스펙/전이 프루프 카드 → 상세 → 따라가기

| ID | 페인포인트 | 근거 |
|----|------------|------|
| P1-1 | **콜드 카드가 좋아요로 폴백** — copy/completion 없으면 TransferPill·MetaRow가 ♥ | `FeedRouteCard` — “따라가는 앱” 1초 테스트 실패 |
| P1-2 | **지도 peek가 여전히 ♥ 중심** — `♥ {likeCount}` | `FeedMap` / `RouteDetailSheet` — 동선 쇼핑 가치가 약함 |
| P1-3 | **정렬 칩 과다 + popular 잔존** — recent/followed/completed/distance (+ popular 경로) | 인지 비용; 전이 정렬이 덜 돋보임 |
| P1-4 | **게스트 전환 마찰** — 따라가기 직전 AuthGate | 의도된 설계이나, 시트 카피가 “왜 로그인?”을 전이 가치로 못 박지 않으면 이탈 |
| P1-5 | **스펙 한 줄 공백** — legs/difficulty 없으면 SpecLine 자체 숨김 | 카드가 다시 감성/제목 중심으로 퇴행 |

**개선 방향 (P1)**

- 카드/지도 peek 소셜 슬롯: `따라감 · 다녀옴` 고정 슬롯(0이어도 `첫 따라가기 기회` 등 전이 카피). 좋아요는 large 레이아웃 보조만
- 지도 TourCard 메타를 카드와 동일 `courseSpecParts` + transfer proof로 교체
- 정렬 기본/`많이 따라간` 강조; `popular`(좋아요)는 UI에서 숨기거나 접기
- AuthGate 문구: “따라가려면 로그인 — 초안은 비공개로 가져와요”

---

### 3.2 P2 — 따라가이 (복제 → 다듬기 → 다녀왔어요)

**시나리오:** 따라가기(plan) → 플래너 다듬기 → 보관함「따라가는 중」→ 원본/초안에서 완주

| ID | 페인포인트 | 근거 |
|----|------------|------|
| P2-1 | **CTA 색 동일** — 따라가기·다녀왔어요·후기 수정이 모두 `bg-sunset` | 상태 전이가 색으로 안 읽힘 (라벨만 의존) |
| P2-2 | **상태 뱃지 의미 충돌** — `다녀옴` = success(레드), `다듬는 중` = sunset-wash | “끝남”과 “진행/브랜드”가 비슷한 빨강 |
| P2-3 | **플래너 레드 과밀 + 임시저장/완료 이중 경로** | 카피로 보완 중이지만 시각 위계가 안 도와줌 → 이탈·미저장 |
| P2-4 | **완주 유도 칩이 카드 위 오버레이** | 터치 타깃·가독성, 카드 Link와 겹침 리스크 |
| P2-5 | **복제 후 next-step은 있으나 재진입 시 체크리스트 약함** | `?followed=1` 1회성 — 보관함에서 다시 열면 “다음에 뭘 하지?” |

**개선 방향 (P2)**

- CTA 상태 머신에 **톤 단계** 도입: 미복제=brand / 복제·미완주=brand outline 또는 ink primary「다녀왔어요」 / 완주=neutral「후기 수정」
- 상태 뱃지: done=ink soft pill, tuning=brand wash, recording=muted (성공색은 체크 아이콘만)
- 플래너: 진행 UI는 ink; primary red는 「완료·저장」1개만. 임시저장은 ghost/secondary
- 「따라가는 중」카드에 진행 체크리스트 1줄(스팟 확인 · 이동 · 다녀왔어요) 상시 노출

---

### 3.3 P3 — 코스 메이커 (작성 → 공개 → 영향력)

**시나리오:** FAB로 코스 만들기 → 동선·추천·난이도 채움 → 공개 → 책장/통계에서 전이 지표 확인

| ID | 페인포인트 | 근거 |
|----|------------|------|
| P3-1 | **프로필 통계에 좋아요·저장이 여전히 전면** | `ProfileDrawerBody` Stat — 영향력(따라감/다녀옴)보다 구 SNS 지표 |
| P3-2 | **작성 성공/가이드가 brand wash** | 긍정 피드백이 경고처럼 보일 수 있음 (C1) |
| P3-3 | **책장 그리드 vs 홈 카드 위계 불균일** | 홈은 transfer 강화, 프로필 쪽은 약한 화면 존재 가능 |
| P3-4 | **공개 범위·완성도 피드백 부족** | “따라가기 쉬운 코스인가” 체크리스트가 게시 전에 약함 |

**개선 방향 (P3)**

- 본인/타인 프로필 상단: **따라간 합 · 다녀온 합 · (별점)** → 팔로워 → 좋아요는 접기/하위
- 게시 전 “따라가기 준비도” 미니 체크(지역·추천대상·난이도·스팟≥2·이동) — 미충족 시 ink 힌트, 강제는 단계적
- 메이커 홈 한 줄: “이번 달 N명이 따라갔어요” (데이터 있을 때)
- 성공 토스트/배너는 success 토큰(재분리 후), 브랜드 wash와 분리

---

### 3.4 P4 — 영향력 구독자 (팔로우 → 스트림 → 따라가기)

**시나리오:** 책장에서 팔로우 → 보관함「팔로잉」새 코스 → 상세 → 따라가기

| ID | 페인포인트 | 근거 |
|----|------------|------|
| P4-1 | **하단 보관함 아이콘 = 하트** | BottomNav — 실행함·구독함인데 “좋아요함”으로 오인 |
| P4-2 | **세그먼트 중첩** — `팔로잉` 안 `새 코스 | 사람` | 발견 비용; 기본이 코스여도 2단 IA |
| P4-3 | **메이커 디스커버리 경로 얇음** | 카드 AuthorTap·상세 작성자 카드 위주 — 탐색 루프가 우연 의존 |
| P4-4 | **새 코스 알림 우선순위** | UX 설계상 원하나, 좋아요/댓과 시각 위계가 섞이면 구독 루프 약화 |
| P4-5 | **저장 vs 따라가는 중 구분** | 저장=아직 안 따라감 — 카피는 있으나 색/아이콘 차별이 약하면 “이미 한 것”으로 착각 |

**개선 방향 (P4)**

- 보관함 탭 아이콘: bookmark/stack/route 계열로 교체 (하트 제거)
- 팔로잉 기본 랜딩 유지 + 사람 관리는 검색 진입으로 단순화(서브칩 최소화)
- 홈/지도에 “팔로잉 메이커의 새 코스” 약한 레일 또는 정렬 옵션 검토
- 저장 카드에 secondary CTA「따라가기」노출 — P1→P2 전환 가속
- 알림 리스트: copy/completion/follow-new-course를 like/comment 위 시각 그룹

---

## 4. 교차 사용성 이슈 (페르소나 공통)

| ID | 이슈 | 개선 |
|----|------|------|
| X1 | 레거시 카피·문서 혼재 (`HANDOFF` 일기/그린 잔상 vs 코드 코스/레드) | 문서 헤더에 “정본 = DESIGN-SYSTEM + COURSE-UX” 명시, HANDOFF §1을 코스 IA로 재작성 |
| X2 | 좋아요 UI는 상세에 남음 — 북스타와 경쟁 | 유지하되 크기·위치 하향; 측정에서 북스타 대용 금지(기존 가드레일 재확인) |
| X3 | 다크모드에서 brand/success/error 동시 밝아짐 | C1 해결과 묶어서 contrast 재검증 |
| X4 | 터치 44pt·reduced-motion은 양호 | 유지; 플래너 오버레이 칩만 타깃 재점검 |

---

## 5. UX 개선 로드맵 (우선순위)

침습도·의존성 기준으로 정렬. 일정 단위 없음.

### Wave A — 의미 충돌 제거 (컬러·아이콘, 침습 낮음) ✅ 적용

1. [x] 보관함 탭 아이콘 하트 → 스택(실행함) 아이콘 (`BottomNav`)
2. [x] 지도 peek / TourCard: ♥ → 따라감/다녀옴 (`FeedMap` · `getFeedMapPoints` copy/completion)
3. [x] 카드 좋아요 폴백 제거 (`FeedRouteCard` · `RouteCard` · `RouteDetailSheet`)
4. [x] 에러 표면을 `bg-error-soft text-error`로 통일
5. [x] 상태 뱃지: 다녀옴=ink muted · 다듬는 중=brand wash · 기록 중=muted

**성공 기준:** 홈·지도만 봐도 “좋아요 앱”이 아닌 “따라가는 앱”으로 읽힘.

### Wave B — 루프 전환율 (P1→P2, P2 완주) ✅ 적용

1. [x] CTA 톤 상태머신 — 따라가기=brand solid · 다녀왔어요=brand outline · 후기 수정=neutral  
2. [x] 저장 카드에「따라가기」(`CollectionCard` + `CopyRouteButton short`)  
3. [x] 「따라가는 중」진행 체크리스트 1줄 (`FollowProgressBar`)  
4. [x] AuthGate 전이 가치 카피 (따라가기·완주·FAB·보관함)  
5. [x] `?sort=popular` → `followed` 매핑, UI에서 좋아요 정렬 퇴장  

**성공 기준:** Detail→Copy, Copy→Completion 가드레일 지표 개선.

### Wave C — 브랜드 토큰 건강성 ✅ 적용

1. [x] `--success` = teal (`#0f766e`), brand 레드와 분리  
2. [x] 플래너: 섹션/맵모드/스텝퍼/핸들/임시저장 → ink; 완료 CTA만 sunset  
3. [x] `TRANSPORT_COLOR.walk` = slate `#475569`  
4. [x] `--primary-green-*` / `--leaf` deprecate 주석 (`leaf`→success 별칭)  

**성공 기준:** 신규 PR에서 상태색을 brand로 오용하는 회귀 0.

### Wave D — 영향력·구독 (P3·P4) ✅ 적용

1. [x] 프로필 드로어: 따라감·다녀옴·공개·저장 (좋아요 전면 제거)  
2. [x] 통계: 전이·영향력 섹션 (따라감·다녀옴 우선) · 알림 그룹(전이/소셜)  
3. [x] 게시 전 `FollowReadyHint` (지역·추천·난이도·스팟)  

**성공 기준:** Follow→Copy, Copies per public course.

---

## 6. 하지 말 것 (이 분석 범위)

- 브랜드를 다시 그린/보라 테마로 교체
- mood·좋아요 기능 삭제(노출·위계만 조정)
- DB/URL `routes`→`courses` rename을 컬러·UX 개선의 전제로 삼기

---

## 7. 관련 정본

| 문서/코드 | 역할 |
|-----------|------|
| `docs/DESIGN-SYSTEM.md` | 컬러·컴포넌트 규칙 |
| `docs/COURSE-UX-DESIGN.md` | 페르소나·북스타 루프·Phase |
| `src/app/globals.css` | 토큰 값 정본 |
| `src/app/(tabs)/feed/FeedRouteCard.tsx` | P1 카드 위계 |
| `src/app/(tabs)/feed/FeedMap.tsx` | P1 지도 peek |
| `src/app/routes/[id]/CourseFollowActions.tsx` | P2 CTA 상태머신 |
| `src/app/(tabs)/library/LibraryTabs.tsx` | P2·P4 실행함 |
| `src/components/BottomNav.tsx` | 탭 멘탈모델·브랜드 active |

이 문서의 다음 구현은 **Wave A**부터 개별 PR로 쪼개는 것을 권장한다.
