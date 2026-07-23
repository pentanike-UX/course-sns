# course-sns — 작업 인수인계 (Handoff)

> **MVP fork**: routdiary v1.14.21을 `~/Documents/course-sns`로 복제한 코스 기록·공유 SNS. 인프라(Supabase/Vercel/도메인)는 routdiary와 **완전 분리** — 배포 체크리스트는 [`MVP-SETUP.md`](MVP-SETUP.md), 로컬 env는 `.env.example` → `.env.local`(새 Supabase 프로젝트 값).

## 1. 제품 개요

**course-sns (코스)** — 따라갈 수 있는 **이동 코스**를 발견·복제·완주·구독하는 커뮤니티.  
정본 UX: [`COURSE-UX-DESIGN.md`](COURSE-UX-DESIGN.md) · 토큰: [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) · 페인포인트: [`UX-PERSONA-PAINPOINTS.md`](UX-PERSONA-PAINPOINTS.md).

- 한 **Route**(코드/DB명 유지) = 순서 있는 **Spot** + 스팟 간 **Leg**(수단/시간/주의)
- 메타: 지역·추천 대상·난이도·테마·감정(보조)·공개여부
- **북스타 루프:** 발견 → 따라가기 → 다녀왔어요 → 영향력(복제·완주·팔로우). 좋아요는 보조 신호
- 모바일 우선(~430px). 데스크톱은 `MobileFrame` 2단 셸(좌 브랜드 레일 + 우 폰 UI)
- **게스트 열람:** `/`·`/routes/[id]`·`/u/[handle]`. 쓰기·따라가기·완주·팔로우 등은 `AuthGate` 시트(전이 가치 카피)

### 현재 화면·내비 (v0.3.0-mvp)

**하단 탭 3개 + 중앙 FAB** (`BottomNav.tsx`):

| 탭 | URL | 주인공 | 역할 |
|----|-----|--------|------|
| 홈 | `/` | P1 | **코스 쇼핑** — 공개 코스 피드. 정렬: 최신·많이 따라간·많이 다녀온·가까운 |
| 지도 | `/?mode=map` | P1 | 동선으로 고르기 (목록↔지도). peek = 따라감/다녀옴 |
| 보관함 | `/library` | P2·P4 | **따라가는 중 · 저장 · 팔로잉**(새 코스 스트림 + 사람). 아이콘=스택 |
| FAB(+) | sheet → `/routes/new` | P3 | 코스 기록하기 / 코스 계획하기 |

**드로어·오버레이 (라우트 전환 없이 클라이언트 스택)**:

- **내 코스**: 둘러보기 헤더 프로필 칩 → 좌측 `SlideDrawer` (`FeedExplorer`, URL 유지 `/`)
- **설정/프로필**: 내 코스 또는 헤더 ⚙ → 우측 `SlideDrawer` (`ProfileDrawerBody` — 전이 지표 우선)
- **하드 라우트**: `/feed`(내 코스), `/profile`
- **`@drawer` 병렬 슬롯**: intercept `(.)feed`는 **비활성**. soft nav는 클라 `SlideDrawer`만 (드로어 애니메이션 스택 보호)

**주요 라우트**:

- `/` — 둘러보기. `?mode=map`, `?q=&sort=&kind=&theme=&mood=&region=` (`popular`→`followed` 매핑)
- `/feed` — 내 코스(보호). `?tab=all|record|plan`
- `/library` — `?tab=following|saved|…` (세그먼트: 따라가는 중 | 저장 | 팔로잉)
- `/routes/new`, `/routes/[id]`, `/routes/[id]/edit` — 작성·상세·수정 (완료 전 **공개/비공개 명시 선택**)
- `/u/[handle]`, `/notifications`, `/login`, `/profile/*`

**fork 이력:** routdiary(일기·좋아요 중심) → course-sns(전이 중심). §3 이하 구 로그의 일기/그린 표현이 남을 수 있음 — **현행 IA·카피·컬러는 이 §1 + DESIGN-SYSTEM + COURSE-UX가 정본**.

## 2. 기술 스택 / 리소스

- **Next.js 16.2.7** (App Router) + React 19 + **Tailwind 4** + TypeScript, pnpm
- **Supabase** (Postgres + Auth + Storage), **네이버 지도**(Maps JS API v3, 연동 완료)
- 위치: `~/Documents/course-sns` (독립 git repo, routdiary fork)
- ⚠️ **`$HOME`(`/Users/nike`) 자체가 git 저장소**임. 새 하위 폴더 작업 시 반드시 해당 폴더에서 `git init` 하고 `git -C <절대경로>`로 커밋. $HOME repo에 커밋 금지.

### Supabase
- **Supabase**: `course-sns` · id **`pbyxnvtgsrwmsvxnynif`** (routdiary와 분리)
- URL/키는 `.env.local`에 있음(gitignore됨). `.env.example` 참고
- **UI 스타일·컴포넌트 규칙:** [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) (토큰 정본 = `src/app/globals.css`)
- ⚠️ 무료 활성 2개 한도 때문에 `pentanike-UX's Project`(twxlokedllghbpztoiej)를 **pause**해 둠(복구 가능). `korea-safemate-v7`은 **다른 제품 — 손대지 말 것**

### Google 로그인 (OAuth)
- 로그인 화면 "Google로 계속하기" → `signInWithOAuth({provider:'google', redirectTo:`${origin}/auth/callback`})` → 기존 `/auth/callback`(code 교환) 재사용
- ⚠️ 콘솔 설정 필요(키는 v6 것 재사용 가능): ① Google Cloud OAuth 클라이언트 **승인된 리디렉션 URI**에 `https://aqafgebedvuixonfuaqm.supabase.co/auth/v1/callback` 추가 ② Supabase → Auth → Providers → Google 활성화 + Client ID/Secret 입력
- `handle_new_user` 트리거 하드닝(`0005`): 핸들 중복 자동 회피(suffix) + Google `full_name/name`·`picture`로 닉네임/아바타 채움 → OAuth/이메일 가입 모두 안전

### 데모 계정 (검증용, 시드됨)
- `demo@routdiary.app` / `demo1234` (email_confirmed 상태)
- 신규 회원가입은 **이메일 확인(Confirm email) ON** 상태로 동작 (E2E 검증됨)
  - `signUp`이 요청 origin 기반 `emailRedirectTo`(`/auth/callback`)를 넘기고, `src/app/auth/callback/route.ts`가 `?code=`→세션 교환 후 리다이렉트
  - ⚠️ Supabase 대시보드 **Authentication → URL Configuration** 필수 설정 완료: Site URL=`https://routdiary.vercel.app`, Redirect URLs에 `https://routdiary.vercel.app/**`·`http://localhost:3000/**`
  - 메일 발송은 Supabase 기본 SMTP라 **rate limit 낮음**(연속 가입 시 429). 실서비스는 커스텀 SMTP 권장

### 환경변수

`.env.example` → `.env.local` 복사 후 채움. Vercel Production에도 동일 키 등록.

| 변수 | 필수 | 용도 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 클라이언트·SSR anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 서명 URL 업로드·계정 삭제(server-only) |
| `NEXT_PUBLIC_NAVER_MAP_KEY` | ✅ | 네이버 Maps JS (`ncpKeyId`) |
| `NAVER_MAP_CLIENT_SECRET` | ✅ | Directions driving REST |
| `NAVER_SEARCH_CLIENT_ID/SECRET` | ⬜ | 장소 키워드 검색(없으면 검색 UI 숨김) |
| `TMAP_APP_KEY` | ⬜ | 보행 실도로(`directions.ts`, SK TMAP pedestrian) |
| `NEXT_PUBLIC_SITE_URL` | ⬜ | OG 이미지 절대 URL(미설정 시 `VERCEL_URL` 폴백) |
| `E2E_DEMO_EMAIL/PASSWORD` | ⬜ | Playwright 로그인(기본 demo 계정) |

## 3. 완료된 작업 ✅

### 드로어 slide-in/out 안정화 (v1.14.5 ~ v1.14.21, 2026-06-24 ~ 06-30)

- **맥락**: v1.14.3 feed→profile 라이브 스택 이후, 내 일기·설정 **EdgeDrawer/SlideDrawer** 슬ide 애니메이션이 끊김·깜빡임·크래시·클리핑 이슈가 연속 발생.
- **핵심 컴포넌트**: `SlideDrawer.tsx`(공용 edge overlay, `SLIDE_DRAWER_MS=320`), `FeedExplorer`(둘러보기 내 일기·설정 2단 SlideDrawer), `FeedProfileStack`+`EdgeDrawer`(`/feed` 라우트), `useSheetTransition`·`useOverlayHistory`.
- **v1.14.5**: 둘러보기→내 일기 오버레이 slide-in + 깜빡임 제거.
- **v1.14.6**: 설정 prefetch·`(.)feed` intercept **비활성** → 클라 `SlideDrawer`만 사용. `keepAlive`로 닫힌 뒤 DOM 유지.
- **v1.14.7~10**: 일기·설정 스택 유지, slide 속도 320ms 통일.
- **v1.14.11~12**: `deferBody`(본문 지연 마운트)+`DiaryDrawerSkeleton`, idle warm-up, 커버 preload.
- **v1.14.13**: idle warm fallback·overlay 등록 effect 크래시 핫픽스.
- **v1.14.14~16**: `keepAlive` 타이밍, 프로필 `deferBody` 대칭, exit double-rAF.
- **v1.14.17~20**: slide-out 시 본문 유지, WAAPI exit 시도 → Strict Mode cleanup 이슈.
- **v1.14.21**: WAAPI 대신 **CSS transition exit**, slide-out 클리핑 제거.
- 검증: `pnpm lint`/`pnpm build` ✅. 실기기 slide 감각은 iOS Safari·Android Chrome에서 재확인 권장.

### IA·내비 대개편 + 직접 계획 + TMAP (2026-06-18 ~ 06-23, v1.99 ~ v1.14.0 사이)

- **랜딩 전환**: `/` = **둘러보기**(공개 피드). 내 일기는 프로필 칩 → 좌측 드로어. 하단 탭 **홈·지도·보관함** 3개(+ FAB). 프로필 탭 제거.
- **내 일기·설정 드로어**: `@drawer` parallel slot 도입 후, soft nav 깜빡임 때문에 intercept feed는 null — **클라 SlideDrawer**가 정식 경로.
- **직접 계획 생성**: `/routes/new?type=plan` place-first 플로우. `0009_direct_plan_drafts.sql` — `route_copies.original_route_id` nullable(복제 없이 plan 초안).
- **TMAP 보행 경로**: `TMAP_APP_KEY` 설정 시 `directions.ts`가 도보·자전거를 SK TMAP pedestrian API로 스냅. 미설정 시 driving fallback.
- **둘러보기 개편**: 카드 계층·필터(테마/감정/지역/종류)·레이아웃 스위처·지도 conveyor·거리순·Apple Maps식 peek sheet 등.
- **여행 통계 확장**: 이동·히트맵·마일스톤·스타일·리액션 섹션 추가.

### 계획 플래너 — 뒤로가기 저장 확인 시트 + 임시저장 버튼 (Claude, 2026-06-24 · v1.14.4)
- **맥락**: "루트 따라가기"로 plan 복제 시 `/routes/[copyId]/edit`로 진입 → `RouteForm`의 `isEdit && isPlanDraft` 분기가 이미 **`PlanRoutePlanner`(계획하기 UX)** 를 렌더하고 데이터도 세팅됨(브라우저 실측 확인: "지도 플래너" + 스팟 로드). ⚠️ "과거 버전 UX"로 보였다면 record 목적 복제(=`isPlanDraft` false → 옛 단일페이지 편집) 또는 배포 지연일 가능성. plan 복제는 직접 "계획하기"(`/routes/new?type=plan`, `isDirectPlanCreate`)와 동일 컴포넌트.
- **추가한 사용성**(플래너 공통 — 직접 계획·복제 편집 둘 다):
  - `AppHeader`에 `left` prop 추가(기본 back/brand affordance를 커스텀 컨트롤로 대체).
  - 플래너 헤더 좌측 = **닫기(X)**: 변경분이 있으면(`isDirty`) `ActionBottomSheet`로 **"저장하지 않고 나가시겠습니까?"**(나가기/계속 편집) 띄움, 변경 없으면 바로 나감.
  - 플래너 헤더 우측 = **임시저장** 버튼(`form="route-form"` submit → 기존 handleSave → create/updateRoute 저장 후 상세로 이동).
  - `isDirty`: 편집 가능한 상태(title/region/meta/spots[title·address·lat·lng·body·photos·leg])를 JSON 스냅샷으로 직렬화 → 마운트 시점 스냅샷(`useState(formSnapshot)`)과 비교(ref 렌더-읽기 회피).
- 검증: `pnpm lint`/`pnpm build` ✅. 브라우저 실측(plan 복제 편집): 헤더 X+임시저장 노출 / 스팟 제목 수정(dirty) 후 X→확인 시트(나가기·계속 편집) / 계속 편집→유지 / 임시저장→저장+상세 이동 / 미변경 X→확인 없이 즉시 이동. ⚠️ 트레이드오프: 임시저장은 저장 후 상세로 redirect(액션이 redirect)라 "저장 후 계속 편집"은 아님 — 필요 시 후속.

### feed→profile 완전한 라이브 스택 (Claude, 2026-06-24 · v1.14.3)
- **목표**: feed(내 일기) 위에 profile이 올라오되 feed가 **라이브로 마운트 유지**되고, profile을 닫으면 feed가 그대로(스크롤/상태 보존) 드러나야 함.
- ⚠️ **왜 라우팅으로 안 되는가**(v1.14.2 한계): `/feed`·`/profile` 두 URL 라우트를 동시에 라이브 마운트 유지하는 건 Next 병렬/인터셉트 라우트로 깨끗이 불가 — `@drawer` 한 슬롯 공유, "soft nav가 미매치 슬롯의 이전 상태 보존" 규칙 vs catch-all(닫기)이 충돌하고, explore→profile vs feed→profile 출처를 URL만으론 구분 못 함(실측·분석으로 확인).
- **해결: URL 전환 없는 클라이언트 오버레이 스택**. feed가 떠 있을 때 설정을 누르면 **같은 컴포넌트 트리 안에서** profile을 우측 슬라이드 오버레이로 띄움(라우트 변경 없음) → feed는 그대로 마운트 유지, 닫으면 그대로 노출.
  - `components/ProfileDrawerBody.tsx`(신규, 서버): 프로필 본문(아바타·통계·설정) 추출 — `/profile` 라우트와 feed 오버레이 양쪽에서 재사용(중복 방지). props: routes/profile/counts/defaultVisibility.
  - `app/(tabs)/profile/page.tsx`: `<EdgeDrawer side=right headerRight={ProfileActions}><ProfileDrawerBody/></EdgeDrawer>`로 리팩터(explore→profile 라우트 동작 불변).
  - `components/FeedProfileStack.tsx`(신규, 클라): feed `EdgeDrawer`(좌측) 렌더 + 그 위에 `z-[60]` 프로필 오버레이를 **open state로** 토글. 설정 버튼=open, 닫기/백드롭=close. 우측 슬라이드 인/아웃. OS 뒤로 제스처 대응: open 시 `history.pushState`(같은 URL) → `popstate`에서 close, 닫기 버튼은 `history.back()`.
  - `app/(tabs)/feed/page.tsx`: profile 데이터(getMyCollectionCounts·getMyDefaultVisibility 추가 fetch)까지 받아 `FeedProfileStack`에 notificationBell·ProfileActions·ProfileDrawerBody 전달.
- **정리(dead code 제거)**: v1.14.2의 `DrawerNavButton.tsx` 삭제, `EdgeDrawer`의 `useEdgeDrawer`/`dismiss` 컨텍스트 원복(이 핸드오프 방식이 라이브 스택으로 대체됨).
- 검증: `pnpm lint`/`pnpm build` ✅. 브라우저 실측 — feed 드로어 DOM 노드에 태그 부여 후: 설정 클릭 시 **URL `/feed` 유지**·태그 노드 그대로 마운트·profile 오버레이 `translate-x-0`(우측 진입), 닫기 시 태그 노드 그대로 노출·오버레이 `translate-x-full`·pushed history 정리. routed `/profile`도 정상. ⚠️ 트레이드오프: feed→profile은 별도 URL 없음(새로고침 시 오버레이 닫힘, /feed). explore→profile은 기존대로 `/profile` 라우트.

### iOS식 화면 전환 — SlideOver 도입 + feed→profile 핸드오프 (Claude, 2026-06-24 · v1.14.2)
- **목표(사용자 멘탈모델)**: 앞으로 가는 화면은 우측에서 슬라이드인, 뒤로가기는 반대 모션. feed 위에 profile이 올라오고 닫으면 feed 복귀.
- ⚠️ **실측 발견**: Next 16은 일반 네비게이션에서 `document.startViewTransition`을 **호출하지 않음**(`vtCalls:0`, 스파이로 확인). React `<ViewTransition>`은 커버모핑처럼 마크된 요소에만 작동 → **전역 `::view-transition(root)` 슬라이드 불가**. 신뢰 가능한 방식은 transform 기반(EdgeDrawer식). 또 두 URL 라우트(feed+profile)를 동시 라이브 마운트 유지하는 "진짜 스택"은 Next 라우팅 구조상 불가(자체 클라 스택 라우터 필요) → 사용자와 합의해 **SlideOver 확장(안전)** 범위로 진행.
- **`components/SlideOver.tsx`(신규)**: 풀페이지 푸시 화면용 프레임. 마운트 시 우측(`translate-x-full`)→`0` 슬라이드인, 닫을 때 역방향 후 `router.back()`(딥링크면 `fallback`). `fixed inset-0`이라 데스크톱에선 MobileFrame shell transform에 re-base돼 폰 프레임에 클립(EdgeDrawer와 동일). `useSlideOver()` 컨텍스트로 close 노출.
- **`components/BackButton.tsx`**: `useSlideOver()` 감지 — SlideOver 안이면 헤더 뒤로가기가 슬라이드아웃 후 이동(아니면 기존 즉시 pop). → 페이지를 `<SlideOver>`로 감싸기만 하면 기존 AppHeader 뒤로가기가 자동으로 슬라이드 모션을 가짐.
- **적용(#2·#3)**: `/u/[handle]`(작성자 프로필), `/notifications`, `/u/[handle]/followers`·`/following`을 `<MobileFrame shell><SlideOver>…`로 래핑. ⚠️ 폼 플래너(`routes/new`·`/edit`)·프로필 설정 하위(편집/통계/계정/도움말)는 미적용(확장 가능).
- **feed→profile 플래시 제거(#1)**: 기존엔 같은 `@drawer` 슬롯이라 feed가 즉시 언마운트되며 둘러보기가 번쩍 → profile 진입. `EdgeDrawer`에 `useEdgeDrawer().dismiss(to?)` 컨텍스트 추가(슬라이드아웃 후 `router.push(to)`), feed 드로어 설정 버튼을 `components/DrawerNavButton.tsx`(신규)로 교체 → **feed가 좌측으로 퇴장한 뒤 profile이 우측에서 진입**(핸드오프). 닫으면 feed로 복귀. (라이브 스택은 아님 — 번쩍임만 제거)
- 검증: `pnpm lint`/`pnpm build` ✅, 브라우저 실측 — /u 슬라이드 인·아웃(`translate-x-full↔0` 토글), feed→profile 핸드오프(feed `-translate-x-full` 퇴장→`/profile` 진입), 콘솔 에러 0.

### 상세 B레이아웃 스와이프 확장 + 히어로 immersive 상단 + 지도 인증실패 진단 (Claude, 2026-06-24 · v1.14.1)
- **① B레이아웃 타이틀/게시일 영역도 스와이프**: B타입 히어로는 `PhotoCarousel`(가로 scroll-snap) 위에 `RouteHeroMeta`(지역·제목·칩·작성자·게시일)가 `absolute bottom-0`로 겹쳐, 그 밴드를 터치하면 스와이프가 캐러셀에 안 닿았음. → `RouteHeroMeta`에 `passThrough` prop 추가: 컨테이너 `pointer-events-none`(밴드 전체가 뒤 캐러셀로 터치 통과), **작성자 링크만 `pointer-events-auto`**(프로필 이동 유지). `RouteView` B레이아웃에만 적용(A/plan은 스와이프 불필요라 그대로). 검증: 제목 위 `elementFromPoint` → 캐러셀 내부 `IMG.object-cover`(`insideScroller:true`) 반환 = 스와이프 통과 확인.
- **② 상단 safe-area "빈 공간" 제거(개방감)**: 원인은 `MobileFrame` shell의 **노치 글래스 바**(`bg-paper/70 backdrop-blur`, `h-[env(safe-area-inset-top)]`)가 노치 높이만큼 **불투명 페이퍼 밴드**로 히어로 이미지를 덮어 "막힌/빈" 느낌(이미지 자체는 이미 y=0까지 차 있었음, gap=0 실측). → `MobileFrame`에 `immersive` 변형 추가: 노치 밴드를 페이퍼 프로스트 → **옅은 다크 스크림**(`bg-gradient-to-b from-black/30 to-transparent`)으로 교체해 이미지가 상태바 아래까지 그대로 비치고(개방감) 흰 상태바 글자 가독성은 유지. `routes/[id]`의 `page.tsx`·`loading.tsx`에 `<MobileFrame shell immersive>` 적용(탭 루트는 프로스트 그대로). 검증: 노치 47px 시뮬레이션 스샷에서 이미지가 상단 끝까지 차오름.
- **③ 네이버 지도 "지도를 불러오지 못했어요" 진단(코드 아닌 키 문제)**: 콘솔에 SDK가 직접 `Error Code 500 / Internal Server Error · Client ID: pzni5385ah` 출력 + `auth_fail.png` 로드. `maps.js`·`geocoder`는 200 정상인데 **키 인증(`/v3/auth`)이 네이버 서버에서 500**. 401/403(미등록 URL)이 아니라 500이라 **키/계정 비정상 상태**(결제수단 만료·서비스 미구독/마이그레이션·키 삭제 등) 신호. ⚠️ **NCP 콘솔 조치 필요**(결제수단·Maps 서비스 활성·키 유효성·Web URL 등록 확인, 마이그레이션 시 새 키 발급 후 `NEXT_PUBLIC_NAVER_MAP_KEY`·Vercel env 교체). 코드측: `lib/naver.ts`에 `navermap_authFailure` 훅 추가 — 키가 무효/미등록인 경우 6s 타임아웃 없이 즉시 폴백. (단 이번 500 케이스는 네이버가 이 콜백을 안 불러 훅만으론 미복구 — 키 조치가 본질.)
- 검증: `pnpm lint` ✅ / `pnpm build` ✅ / 브라우저 실측(상세 콘솔 에러 0). 키 인증 자체는 키 복구 후 실기기 재확인 필요.

### 사진 순서 드래그 정렬 + 대표(커버) 라벨 (Claude, 2026-06-24 · v1.14.0)
- **수정/작성 모드 사진 정렬**: `RouteForm` 스팟 사진 그리드를 @dnd-kit 정렬 컨텍스트로 전환(`SortablePhoto`). 모바일은 **길게 눌러 드래그**(`PointerSensor` delay 180ms·tolerance 8 — 빠른 스와이프는 스크롤 그대로, 80px 타일이라 별도 핸들 없이 타일 전체가 핸들). `reorderPhotos`로 스팟 내 순서 변경.
- **대표 라벨**: 커버로 지정되는 첫 사진(`spotPhotoPaths.flat()[0]` 기준 = 첫 사진 있는 스팟의 첫 사진, `coverPhotoKey`)에 **좌상단 "대표" 배지**(`CoverBadge`). 삭제 ✕는 우상단이라 미겹침. 순서를 바꿔 다른 사진을 맨 앞으로 옮기면 대표 지정도 자동 이동. 작성 마법사 1단계 일괄 미리보기 그리드 첫 사진에도 동일 배지. record 모드 전용(plan은 사진 미노출).
- 검증: lint/build ✅, 브라우저 실측(데모 로그인→루트 수정, 컬러 PNG 3장 주입): 3장 렌더·대표 배지 1개·드래그 정렬 동작·정렬 후 대표 배지 이동·콘솔 에러 0.

### 입력창 포커스 시 iOS 자동확대 차단 (v1.13.1)
- **원인**: `maximumScale:1` 제거(v1.12.4, a11y) 이후 16px 미만 입력창 포커스 시 iOS가 화면을 자동 확대(검색 아이콘 탭 시 "화면 커짐").
- **해결**: `globals.css`에 **터치 기기 한정** 전역 규칙 추가 — `@media (pointer: coarse){ input,textarea,select{ font-size:16px } }`. 비레이어 규칙이라 Tailwind `text-[Npx]` 유틸을 덮음(케스케이드 검증: 14px→16px). 데스크톱(fine 포인터)은 미적용이라 디자인 그대로. 핀치 확대는 유지.
- `FeedSearchOverlay` 검색 입력창은 명시적으로도 `text-[16px]`로 상향(중복이나 명시 안전장치).

### 게스트 열람 + 액션 시점 로그인 게이트 (v1.13.0)
- **컨셉 전환**: 로그인 없이 전체 열람 가능. 로그인은 **쓰기/개인화 액션 시도 시점**에만 바텀시트로 유도.
- **열람 공개**(`proxy.ts`): `PROTECTED`에서 `/` 제거 → 홈(둘러보기)·`/routes/[id]`·`/u/[handle]` 게스트 열람. 개인 영역(`/feed`,`/profile`,`/routes/new`,`/library`,`/notifications`,`*/edit`)은 직접 URL 방어용으로 리다이렉트 유지(`startsWith` 매칭).
- **전역 AuthGate**(`components/AuthGate.tsx`): 루트 레이아웃이 `getAuthUser()`로 `isAuthed` 주입 → `AuthGateProvider`. `useAuthGate().requireAuth({next})` 호출 시 게스트면 **로그인 바텀시트**(ActionBottomSheet 재사용: "로그인이 필요해요" / "계속 둘러보기" / "로그인 / 회원가입") 오픈하고 `false` 반환, 로그인이면 `true`. 기본 버튼 → `/login?next=`.
- **게이트 배선**(기존 `needsAuth` 계약을 리다이렉트→시트로 전환): 일기등록·계획(`BottomNav` FAB), 따라가기(`CopyRouteButton`), 좋아요·저장(`RouteActions`), 팔로우(`FollowToggle`), 댓글(`CommentForm`), 보관함 탭(`BottomNav`), 설정(`FeedExplorer` ⚙). 모두 게스트면 시트, 로그인이면 기존 동작.
- 검증(쿠키 삭제 게스트): `/`·`/routes/[id]`·`/u/[handle]` 리다이렉트 없이 열람, FAB·따라가기·보관함 → 로그인 시트, 기본 버튼 → `/login?next=`. lint·build 통과.
- ⚠️ 서버 액션은 이미 무권한 시 `{needsAuth:true}` 반환 → 클라 게이트가 1차 방어, 서버가 2차 방어(직접 호출 차단). 로그인 사용자는 `requireAuth`가 즉시 통과해 회귀 없음.

### 안드로이드 한글 깨짐 리스크 개선 (v1.12.4)
- **진단**(런타임 실측): 한글은 웹폰트에 포함됨(next/font가 weight당 124 청크 생성, 700·900 한글 존재). "글자 없음"이 아니라 **폴백 메트릭 불일치 + 타이트 타이포**가 안드로이드 깨짐 원인.
- **폰트 폴백 교체**(`layout.tsx`): `display:"swap"`, 실제 한글 폴백(`Apple SD Gothic Neo, Malgun Gothic, Noto Sans CJK KR, sans-serif`), **`adjustFontFallback:false`** — next/font의 *라틴 메트릭* 자동 폴백(한글을 위아래로 눌러 클리핑)을 제거. 런타임에서 `"Noto Sans KR Fallback"` 사라지고 한글 폴백 적용 확인.
- **자간**(R3): 한글 제목(`LargeTitleHeader`, `MobileFrame` 브랜드 헤드라인) `tracking-tight` → `tracking-[-0.01em]`로 완화(자모 겹침 방지). 라틴 워드마크 "routdiary"는 의도된 디자인이라 유지.
- **접근성**(R4): 뷰포트 `maximumScale:1` 제거 → 핀치 확대 허용(저DPI 안드로이드 작은 한글 대응 + a11y).
- 검증: lint·build 통과, 갤럭시 폴드 커버(280px)에서 칩 가로스크롤·한글 제목 정상 줄바꿈(겹침/클리핑 없음) 확인.
- (참고) `leading-none` 2곳은 한글이 아닌 `＋` 아이콘이라 미변경. `text-[9px]`은 숫자 배지라 유지. 폴드 1단 그리드 전환 등은 P3로 보류.

### 하단 safe-area 채움 — 화면 "축소" 해결 (v1.12.2)
- **문제**(실기기 영상 분석): 화면 하단에 ~57pt 솔리드 paper 띠가 **스크롤과 무관하게 항상** 존재 → 앱이 그만큼 축소돼 보임. 원인: `body{height:100%}`(라지 뷰포트)인데 앱 프레임은 `h-dvh`(다이내믹). iOS에서 `dvh < 100%`라 프레임 아래로 body(paper)가 새는 죽은 띠. (globals.css 주석에 이미 기록돼 있던 누수.)
- **해결**: 풀스크린 표면들의 높이를 `dvh` → **`lvh`(라지 뷰포트, = body 100%)** 로 변경 → 화면 끝까지(노치·홈인디케이터 영역 포함) 채움. safe-area는 요소별 패딩(예: 도크 `pb-[max(safe,16px)]`)으로 계속 처리. `lvh ≥ dvh`라 띠 없는 기기에선 변화 없음.
  - 변경: `MobileFrame`(shell/non-shell 프레임·아우터), `EdgeDrawer` 패널(`h-full`), `FeedExplorer` 지도 오버레이(`h-lvh`), `ActionBottomSheet`(`fixed inset-0` — 시트가 바닥에서 뜨던 것 수정), `error`/`not-found`(`min-h-lvh`).
  - `AppSplash`(`inset-y-0`)·`RouteForm`(`top-0 bottom-0`)은 이미 inset 방식이라 띠 없음 — 변경 없음.

### 노치(safe-area) 리퀴드글라스 + 노치 아래 스티키 (v1.12.1)
- **문제**(실기기 영상): 둘러보기에서 스크롤 시 헤더가 자동 숨으며 필터 툴바가 `top:0`(노치/상태바 뒤)으로 올라가 "최신순" 칩·배치 버튼이 노치에 가려져 UI가 깨져 보임.
- **노치 글라스**: `MobileFrame` 셸에 `absolute top-0 h-[env(safe-area-inset-top)]` 프로스티드 바(`bg-paper/70 backdrop-blur-lg saturate-150`, z-40) 추가 — 노치 아래로 스크롤되는 콘텐츠를 프로스트 처리. `bg-paper`로 라이트/다크 자동, 노치 없는 기기·데스크톱에선 높이 0으로 무력화. 전 셸 화면 공통 적용.
- **노치 아래 스티키**: 헤더 자동 숨김 시 이동량을 `safe+3.5rem` → **`3.5rem`(-translate-y-14)** 로 조정해 필터 툴바가 노치 바로 아래(top=safe-area)에 고정되도록 함(밀려난 헤더는 노치 글라스가 덮음).

### 둘러보기 루트종류 필터 + 스크롤 시 헤더 자동 숨김 (v1.12.0)
- **루트 종류 필터(루트일기/계획)**: `FeedFilters`에 `kinds` 추가(`feed-filters.ts`). `copyPurpose === "plan"`이면 계획, 아니면 루트일기. `FeedFilterSheet`에 "루트 종류" 섹션(최상단), `?kind=` URL 동기화, 활성 칩(`kindLabel`), 라이브 카운트 반영.
  - 리스트(둘러보기) 전용. 지도 모드에선 섹션 숨김(`showKind={!mapActive}`) — 지도 핀은 서버에서 purpose 조인 없이 가져와서 반쪽 동작 방지.
  - ⚠️ 방어 코드: 배포 후 기존 사용자의 옛 sessionStorage(`kinds` 없음) 대비 `routeMatchesFilters`/`filterCount`/활성칩에 `?.`/`?? []` 가드.
- **스크롤 시 헤더 자동 숨김(C안)**: 둘러보기에서 내릴 때 프로필 인사줄이 위로 사라지고 필터 툴바만 상단 컴팩트 고정, 올릴 때 복귀(하단 내비와 동일 방향). `FeedExplorer`가 `[data-tabs-scroll-root]` 스크롤 방향을 감지해 `headerHidden` 토글.
  - 구현 핵심: 헤더 높이 줄이기(margin)는 콘텐츠 높이를 바꿔 **스크롤 피드백 루프(진동)** 를 유발 → 대신 **sticky 컨테이너를 `translate-y`로 올림**(레이아웃 불변)으로 해결. 필터 툴바(`FeedControls`)는 개별 sticky 제거하고 이 컨테이너에 포함.

### 내부 스크롤 셸 전환 — 상세 페이지 프레임 담기 + 스티키 필터/세그먼트 (v1.11.0)
- **`MobileFrame` `shell` = 내부 스크롤 기기 뷰포트**: 프레임을 `min-h-dvh`(window 스크롤) → **`h-dvh` + `overflow-hidden`(모든 사이즈)** 로 바꿔, 페이지의 `flex-1 overflow-y-auto` main이 **프레임 내부에서 스크롤**. 이게 `position: sticky`가 모바일에서도 상단에 붙게 하는 핵심(기존엔 window가 스크롤돼 모바일에선 sticky 헤더조차 안 붙었음).
- **상세/뷰 페이지도 shell 적용**: `routes/[id]`, `u/[handle]`(+`followers`/`following`), `notifications` 및 각 `loading.tsx`를 `<MobileFrame shell>` + main에 `min-h-0`. → 데스크톱에서 폰 프레임 안에 담기고(우측 배치 + 레일, 탭↔상세 점프 없음), 모바일은 풀스크린 그대로. (`login`·생성/편집 폼은 특수 레이아웃이라 기본 중앙정렬 유지)
- **홈 필터 스티키**: `FeedControls`를 `sticky top-[calc(safe-area+3.5rem)]`(둘러보기 헤더 바로 아래)로 고정 — 스크롤 중에도 필터/정렬/배치 항상 노출.
- **보관함 세그먼트 스티키**: `LibraryTabs`의 저장/좋아요/팔로잉 세그먼트를 같은 오프셋(라지타이틀 컴팩트 바 아래)으로 고정.
- ⚠️ 모바일 스크롤이 window→내부(main)로 바뀜: 모바일 브라우저 주소창 자동 숨김은 사라지지만(설치형 PWA는 영향 없음), 스크롤-하이드 내비는 `main.scrollTop` 기준이라 정상. 실측으로 모바일/데스크톱 모두 검증.

### 웹 데스크톱 셸 — 폰 우측 배치 + 좌측 마케팅 레일 (v1.10.0, `MobileFrame.tsx`)
- **문제**: 데스크톱에서 드로어(`EdgeDrawer`)·바텀시트·내비 등 `fixed` 크롬이 뷰포트 중앙 기준이라, 폰 프레임(430px) **밖 배경 위로 슬라이드/백드롭이 새어 보임**. 또 넓은 캔버스가 비어 있었음.
- **해결**: `MobileFrame`에 `shell` 변형 추가(탭 레이아웃 전용). 데스크톱(lg+)에서 폰 컬럼을 **기기 뷰포트**로 전환 — `lg:h-dvh`(내부 스크롤) + `lg:overflow-hidden`(클립) + `lg:[transform:translateZ(0)]`. transform이 걸리면 그 안의 모든 `fixed` 자손이 **폰 프레임 기준으로 재배치 + 클립**되므로, 드로어·내비·시트·헤더·검색 오버레이가 전부 자동 정렬됨(개별 컴포넌트 수정 불필요).
- 폰은 좌측 **브랜드 레일**(로고 + "걸은 길이 그대로 일기가 된다" + 3가지 가치 + CTA)과 2단 그룹으로 중앙정렬돼 자연스럽게 우측에 위치. 미는 양은 (레일폭+gap)/2로 **뷰포트 너비와 무관한 상수**.
- **포털 예외**: `ActionBottomSheet`만 `createPortal`로 body에 렌더 → transform 바깥. `#app-shell`(프레임)로 포털 타깃 변경해 데스크톱에서 프레임 안에 클립(없으면 body 폴백 → 탭 밖 페이지는 중앙정렬 유지).
- **모바일 무영향**: lg 미만에선 transform/높이 변경/레일 모두 없음 → window 스크롤·풀스크린 드로어·뷰포트 고정 크롬 기존 그대로 (실측 검증).
- ⚠️ 탭 밖 전체화면 페이지(`/routes/[id]`, `/routes/new`, `/u/[handle]`, `/login`, `/notifications`)는 기본(non-shell) `MobileFrame`이라 데스크톱에서 **중앙정렬 유지**(내부 스크롤러가 없어 셸로 바꾸려면 각 페이지에 스크롤 컨테이너 추가 필요). 탭→상세 진입 시 폰이 가운데로 살짝 이동.

### 버전 체계 전환 — SemVer 도입 (v1.9.2부터)
- 기존 `APP_VERSION`은 배포마다 0.01씩 올리던 누적 카운터(~`v1.99`). 이를 **SemVer(`MAJOR.MINOR.PATCH`)** 로 전환.
- MAJOR=호환성 깨지는 개편 / MINOR=하위호환 신규기능 / PATCH=버그·미세 UI. 규칙은 `src/lib/version.ts` 주석 참고.
- 직전 "내비바 3등분"은 이미 `v1.99`로 배포됨(히스토리 유지). 여기서부터 `v1.9.x` 라인으로 이어감.

### 로고 스플래시 분리 — 콜드 부팅 1회만 (v1.9.2, `AppSplash`)
- **문제**: `AppSplash`가 `(tabs)/layout.tsx`에 있어, 탭 → 상세(`/routes/[id]`, `/u/...`) → 탭 복귀 시 `(tabs)` 레이아웃이 리마운트되며 로고 스플래시가 매번(~420ms+페이드) 재노출.
- **해결**: 스플래시를 **루트 레이아웃(`app/layout.tsx`)** 으로 이동. 루트 레이아웃은 클라이언트 내비게이션 동안 절대 언마운트되지 않으므로 콜드 부팅 1회만 노출되고, 이후 `gone` 상태로 영구히 `null` 반환 → 어떤 화면 전환에도 재노출 안 됨.
- **화면별 로딩**: 기존 라우트별 `loading.tsx` 스켈레톤(피드/보관함/프로필/상세 등)이 담당 — 페이지 골격을 즉시 보여주는 자연스러운 멘탈모델. 로고 스플래시와 역할 분리 완료.

### 하단 내비바 3등분 + 젤리 강화 (v1.99, `BottomNav.tsx`)
- **3등분 레이아웃**: 탭 `<li>`를 `w-[54px]`+`justify-between` → `flex-1`로 변경, 아이콘은 각 1/3 구역 중앙에 배치(너무 벌어져 보이던 문제 해소).
- **큰 포커스**: 블롭 폭을 JS로 `li.offsetWidth − BLOB_GAP*2`(BLOB_GAP=6)로 설정해 각 구역을 거의 가득 채움. 내비바-포커스 간격은 상하좌우 6px(기존 상하 간격)로 유지.
- **포커스 젤리 강화**: 슬라이드 시 가로 stretch(최대 2.3) + 세로 squash + 오버슈트 스프링(`cubic-bezier(.34,1.62,.46,1)`, 580ms).
- **내비바 동반 젤리**: 탭 누를 때 `pulseBar()`가 바 전체를 squash-and-settle(WAAPI). 아이콘 press는 `h-12 w-12` 내부 span에만 적용해 1/3 폭이 통째로 커지지 않도록 함.


### MVP 프로토타입 (커밋 27b05a8 — 이후 IA 개편됨, §1 현재 내비 참고)
- 모바일 셸(`MobileFrame`), 하단 탭·FAB(`BottomNav`: 현재 **홈·지도·보관함** + 중앙 기록 FAB)
- 디자인 토큰(`globals.css`): **그린 브랜드 "Fresh/Light/Trust"** (하루 컬러 시스템 적용). 기존 선셋/페이퍼 토큰명(`--sunset/--paper/--ink/--line` 등)은 유지하되 값을 그린 체계로 재지정해 전 컴포넌트 자동 리스킨. `--brand-primary(#22c55e)`·`--primary-green-*` 스케일·shadcn 시맨틱 브리지(`--background/--card/--primary` 등)·radius/shadow 토큰 추가. **다크모드 지원**: `.dark` 토큰 블록 + `layout.tsx`의 no-flash init 스크립트(localStorage `theme` + prefers-color-scheme) + 프로필의 `ThemeToggle`(`<html>.dark` 토글·저장). E2E 검증 완료
- 화면: 둘러보기(랜딩 `/`), 내 일기(드로어), 보관함, 루트 상세, 작성·계획 플래너

### Supabase 백엔드 프로비저닝 (커밋 ce08137)
- 스키마: `profiles, routes, spots, spot_photos, legs` + 2단계용 `likes, bookmarks, follows`
- **RLS 전체 ON**: 루트는 공개이거나 본인 것만 조회, 하위행 상속, 쓰기는 소유자만
- Storage 버킷 `route-photos` (경로 `uid/route/spot/idx`, 소유자만 업로드)
- 보안 하드닝: RLS 헬퍼는 `private` 스키마(REST 비노출), 트리거 함수 EXECUTE 회수 → **보안 advisor 0건**
- `supabase/migrations/0001_init.sql · 0002_storage.sql · 0003_security_hardening.sql`
- 타입드 클라이언트(`src/lib/supabase/{client,server,middleware}.ts`) + `database.types.ts`

### 화면 ↔ Supabase 실연동 (커밋 f499f8f) — **E2E 검증 완료**
- 이메일+비번 인증(`src/app/login/`), `src/proxy.ts` 세션 갱신 + 라우트 가드
- 데이터 레이어 `src/lib/data.ts`가 실제 Supabase 조회(홈/피드/상세/프로필)
- 작성 플로우가 route+spots+legs 저장 + 사진 Storage 업로드(`src/app/routes/new/`)
- 회원가입 시 `handle_new_user` 트리거로 profiles 자동 생성
- **검증**: 로그인 → 루트 작성 → 홈/상세 노출까지 브라우저로 확인됨

### 네이버 지도 연동 (E2E 검증 완료)
- 지도: **카카오 대신 네이버 Maps JS API v3** 채택 (한글 장소검색은 별도 검색 OpenAPI라 보류, 좌표는 지도 탭/드래그로 직접 지정)
- `src/lib/naver.ts`: SDK 싱글톤 로더(`submodules=geocoder`) + reverse geocoding 헬퍼. 인증 파라미터 **`ncpKeyId`**(신규 방식, 동작 확인). 구버전 키면 `ncpClientId`로 교체
- `src/components/SpotLocationPicker.tsx`: 작성 화면 — 지도 탭/핀 드래그로 `lat/lng` 지정 → reverse geocode로 주소 자동 채움(사용자가 주소 비워뒀을 때만)
- `src/components/RouteMap.tsx`: 상세 화면 — 번호 마커 + **수단별 스타일 경로**(색/선스타일) + 범례 + bounds 자동 맞춤. 좌표 있는 스팟만 렌더
- `src/lib/directions.ts`(server-only): 네이버 Directions(driving) + **TMAP pedestrian**(도보·자전거, `TMAP_APP_KEY` 있을 때). per-process 캐시. **차량계열(car/taxi/bus/train)** 은 네이버 driving. 지하철 등은 geometry 없음(connector). 키 없으면 graceful `null`/driving fallback
- 수단별 표현: 도보=초록점선, 자전거=청록점선, 자가용=주황실선, 택시=황색실선, 버스=파랑실선, 지하철=보라굵은점선, 기차=회청긴대시
- 키: `.env.local`의 **`NEXT_PUBLIC_NAVER_MAP_KEY`**(JS 지도, Client ID) + **`NAVER_MAP_CLIENT_SECRET`**(server-only, Directions용). Web 서비스 URL에 `http://localhost:3000` 등록 필요. 배포 시 Vercel URL 추가
- ⚠️ 실도로 경로 활성화 조건: ① Maps Application에서 **Directions 서비스 활성화** ② `NAVER_MAP_CLIENT_SECRET` 설정. 둘 중 하나라도 없으면 차량 구간도 connector로 **graceful fallback**
- ⚠️ **Directions 엔드포인트 도메인**: 신규 키(ncpKeyId) 체계는 `https://maps.apigw.ntruss.com/map-direction/v1/driving` 사용. 구버전 `naveropenapi.apigw.ntruss.com`은 같은 키로도 **HTTP 401 errorCode 210**(subscription required) 남. 콘솔 Application에 Directions 5 활성화 + Web 서비스 URL 등록 필요
- **검증 완료**: 작성 화면 지도+인증 OK / 혼합수단(도보·자가용·지하철) 수단별 경로·범례 / 차량계열(자가용·택시) **실도로 경로** 정상 렌더 확인(모두 검증 후 삭제), 콘솔 에러 0건

## 4. 남은 작업 (TODO)

### 사진 업로드 (E2E 검증 완료, 서명URL 방식)
- ⚠️ **핵심 함정**: 이 Supabase 프로젝트는 사용자 JWT를 **ES256(신규 비대칭 서명키)** 로 발급하는데, **Storage 서비스가 이 토큰을 검증 못 함** → 클라이언트 직접 업로드(`storage.upload`)는 RLS 403. (PostgREST·auth는 ES256 정상 검증, storage만 실패)
- 해결: **서버 서명URL 방식**. `signPhotoUploads`(server action)가 사용자 검증 후 **경로를 본인 uid 아래로 강제**해 service-role로 presigned URL 발급 → 클라가 `uploadToSignedUrl`로 업로드(사용자 JWT 불필요)
- `src/lib/supabase/admin.ts`: service-role 클라이언트(server-only, RLS 우회). `SUPABASE_SERVICE_ROLE_KEY` 필요(`.env.local`, gitignore)
- **검증 완료**: 작성 화면 파일선택 → storage 객체 생성(image/png) → spot_photos 행 → 상세/커버 렌더까지 확인(검증 후 루트+객체 삭제)

### 우선순위 높음
- [x] **한글 장소명 키워드 검색** (Claude, 2026-06-12 — 실키 E2E 검증 완료)
      - `src/lib/places.ts`(server-only): 네이버 검색(지역) OpenAPI `local.json` 호출 + 정규화. `mapx/mapy`는 WGS84 ×1e7 형식(2023+ API). 제목의 `<b>` 태그/엔티티 제거. display 최대 5
      - `src/app/api/places/route.ts`: GET `?q=` 프록시. 로그인 필수(일 25k 쿼터 보호), q 2~60자 제한. 키 미설정 시 `{enabled:false}` 반환
      - `SpotLocationPicker`에 `searchEnabled` prop + 검색창/디바운스(300ms)/드롭다운. 선택 시 `onPick({lat,lng,address,place})` → 기존 외부좌표 effect로 핀 이동(EXIF 자동채움과 같은 경로). "searching"은 effect 내 동기 setState 대신 파생 상태(`react-hooks/set-state-in-effect` 회피)
      - `RouteForm`: 검색 선택 시 장소명→스팟 제목(비어있을 때만)·주소는 항상 덮어씀(검색 주소가 권위). 지도 탭은 기존 fill-if-empty 유지. `placeSearchEnabled`는 new/edit 페이지에서 서버 판정해 prop으로 전달(키 없으면 검색 UI 자체가 안 보임)
      - 키: developers.naver.com 앱 등록 완료(검색 API, 웹 서비스 URL: localhost:3000 + routdiary.vercel.app). `NAVER_SEARCH_CLIENT_ID`/`NAVER_SEARCH_CLIENT_SECRET` `.env.local` 설정 완료. ⚠️ **Vercel Production 환경변수 등록은 아직** — 안 하면 프로덕션에서 검색창만 안 보일 뿐 다른 기능 정상. **NCP Maps 키와 별개 자격증명**
      - 검증: `pnpm lint`/`pnpm build` ✅, 키 미설정 → 검색창 미노출·`{enabled:false}`, 실키로 "세화 해변"/"광안리 해수욕장" 검색→선택→제목·주소·핀 자동 채움 확인(스크린샷 검증), 잘못된 키 → `{enabled:true, places:[]}` graceful
      - 참고: dev 콘솔에서 ViewTransition 중복 이름 경고가 버퍼에 보였으나 **실플로우(카드→상세, 뒤로가기)로 재현 안 됨** — Fast Refresh 재마운트/Playwright 다중 워커가 dev 서버에 물린 시점의 dev 전용 아티팩트로 판단. 프로덕션 빌드에서 재관찰되면 그때 조사
- [ ] (권장) Supabase 대시보드에서 **이메일 확인 끄기**(개발 편의) 또는 실제 이메일로 가입 플로우 점검

### 2단계 (SNS)
- [x] **좋아요/즐겨찾기 토글 UI + 액션** (E2E 검증 완료)
      - `routes/[id]/actions.ts` `toggleLike/toggleBookmark`(server action, insert/delete + revalidate)
      - `routes/[id]/RouteActions.tsx`(client, 낙관적 토글, 미로그인 시 /login 리다이렉트)
      - `getRoute`가 현재 사용자 `liked/bookmarked` 동봉, 카운터는 기존 트리거가 like_count/bookmark_count 유지
- [x] **보관함(저장/좋아요 모아보기)** (E2E 검증 완료)
      - 하단탭 **홈·지도·보관함** + 중앙 "기록" FAB(`ring-card`로 관통). (구 5탭 구조에서 개편됨)
      - `(tabs)/library/page.tsx`: `?tab=saved|liked` 세그먼트, 빈 상태 + 둘러보기 CTA
      - `getBookmarkedRoutes`·`getLikedRoutes`(data.ts) — 본인 bookmarks/likes ⨝ routes(LITE)
      - 전역 **탭 피드백**: 버튼/링크 `:active` 시 95% 축소(globals.css, 토글 제외)
      - 보관함 카드 **원탭 해제**(`CollectionCard`: 저장/좋아요 해제 → 즉시 제거 + `router.refresh`)
      - 프로필 통계에 **저장·좋아요 카운트**(`getMyCollectionCounts`) + 탭하면 보관함으로 이동
- [x] **팔로우** (E2E 검증) — `/u/[handle]` 공개 프로필 + `toggleFollow`, 작성자명 링크
- [x] **댓글** (E2E 검증) — `supabase/migrations/0004_comments.sql`(comments 테이블·RLS·`comment_count` 트리거), `getComments`/`addComment`/`deleteComment`, 상세에 댓글 목록+입력폼+삭제. `database.types.ts` 재생성됨
- [x] **공개 피드 정렬/탐색** (E2E 검증 완료)
      - `getPublicFeed({sort, q})` — 최신순/인기순(like_count) + 지역·제목 ilike 검색(or 필터, 입력 sanitize)
      - `feed/FeedControls`(client): 디바운스 검색 + 정렬 칩, URL 쿼리 동기화(`?q=&sort=`)
- [x] **알림** (`0007`): like/comment/follow 트리거 → notifications, 홈 종 뱃지 + `/notifications`(자동 읽음)
- [x] **팔로잉 피드**: ~~둘러보기 `전체/팔로잉` 세그먼트~~ → **보관함>팔로잉**(회원 관리·검색, v1.96). `getFollowingFeed`는 data.ts에 dead export로 잔존
- [x] **루트 공유**: `generateMetadata`(OG/Twitter + 커버 이미지) + 공개 루트 ShareButton(native share/clipboard)
- [x] **스팟 드래그 정렬**: 작성/수정 폼 @dnd-kit 드래그 핸들
- [x] **계정 삭제**: `/profile/account` 위험구역 → service-role 스토리지 정리 + auth 유저 삭제(전체 cascade). E2E 검증(임시 유저)
- ⚠️ Google OAuth 실유저 활동 중(jauin0011·moon2015 등). 테스트 데이터 정리 시 실유저 데이터 건드리지 말 것
- [x] **사진 EXIF 자동 위치** (E2E 검증): `lib/exif.ts`(exifr로 GPS+촬영시각). ① 사진 추가 시 스팟 좌표 자동(`RouteForm.autofillFromPhotos` + `SpotLocationPicker` 외부좌표 반응) ② "사진으로 자동 만들기"(`buildFromPhotos`): GPS ~120m 클러스터링·촬영시각 정렬·주소 자동·경로 자동연결. GPS 없으면 수동 픽 폴백

### 다듬기
- [x] **헤더 버튼/루트 메뉴/폼 닫기/계획 목록형 정리** (Claude, 2026-06-13)
      - **헤더 버튼 약간 확대**: BackButton·NotificationBell·루트 메뉴 트리거 `h-9 w-9`→`h-10 w-10`, 아이콘 22→24. AppHeader 높이(h-14)는 그대로
      - **루트 A/B 토글 터치영역 확대**: 외곽 `h-9`→`h-10`, 각 옵션 `h-7 w-7`→`h-8 min-w-[38px] px-3`로 토글 절반을 꽉 채워 죽은 패딩 제거(더 쉽게 탭)
      - **공유·수정·삭제를 `…` 하나로 통합**(`routes/[id]/RouteMenu.tsx` 신규) — 헤더엔 A/B 토글 + … 만 남김. 메뉴 항목: 공유(공개일 때, native share/clipboard)·수정(링크)·삭제(인라인 확인). `canShare && !isOwner`도 아닌 경우 `null`. 기존 `ShareButton.tsx`·`OwnerMenu.tsx` 삭제(둘 다 RouteView 전용이었음). 좋아요/저장/따라가기(CopyRouteButton)는 본문 소셜행에 그대로
      - **작성/수정 헤더 = 닫기(X)**: `AppHeader`에 `closeButton` prop, `BackButton`에 `icon="back"|"close"`. RouteForm 3곳(지도 플래너·루트 수정·새 루트 기록 위저드) 적용. 동작은 기존 그대로(history pop, 딥링크면 fallback) — 아이콘만 X
      - **계획 세그먼트 = 목록형**(`components/PlanRouteRow.tsx` 신규): 홈 `계획` 탭만 큰 4:5 카드 대신 컴팩트 행(p-2.5, ~76px). 커버 이미지 제거, 왼쪽에 지도 아이콘(sunset-wash 타일). 제목·지역·스팟수·날짜 + chevron. `전체`/`기록` 탭은 기존 RouteCard 유지(요청 범위가 계획 탭 한정). 리스트 간격 plan은 `space-y-2.5`
      - 검증: lint/build ✅, SSR 프리뷰로 닫기/뒤로 아이콘·지도아이콘 행·메뉴 null 가드(비소유·비공개 시 미렌더) 확인 후 삭제. 실기기 확인 권장(특히 헤더 … 드롭다운 위치, 계획 행 탭감)
- [x] **SegPager 전환 중 세로 클리핑 버그 수정** (Claude, 2026-06-13)
      - 증상: 빈 팔로잉(짧은 패널) → 전체(카드로 긴 패널) 전환 시 들어오는 카드 하단이 잘림(둘러보기 스샷 제보). 홈·보관함도 동일 잠재버그
      - 원인: `SegPager` 컨테이너가 `overflow-hidden`(양축 클리핑). 컨테이너 높이는 in-flow인 `renderPanel(shown)`(=현재/짧은 패널)이 결정 → 슬라이드 280ms 동안 들어오는 패널은 `absolute`라 높이 기여 X → 짧은 높이로 세로까지 클리핑
      - 수정: `overflow-x-clip overflow-y-visible`로 변경 — 옆 패널은 가로로만 숨기고, 더 큰 들어오는 패널은 세로로 안 잘림. 둘 다 비스크롤 값이라 CSS 명세상 안정 조합(blockify 안 됨). Tailwind4가 두 규칙 실제 생성 확인(빌드 CSS). 세 사용처 모두 SegPager가 마지막 자식이라 전환 중 세로 오버플로가 들어갈 빈 공간=커밋 후 실제 높이 → 이음새 없음
      - 검증: lint/build ✅, 빌드 CSS에 `overflow-x:clip`·`overflow-y:visible` 존재 확인. 실기기 전환 모션은 다음 세션 확인
- [x] **뒤로가기 = 직전 화면 복귀 (history pop)** (Claude, 2026-06-13)
      - 문제: 헤더 뒤로가기가 `Link href` 하드코딩(루트 상세는 항상 `/`) → 피드·지도·보관함에서 들어가도 홈으로 떨어짐. 표준(인스타·에어비앤비·당근)은 상세=스택 push, 뒤로가기=pop(직전 화면+스크롤 보존), 딥링크만 홈 폴백
      - `components/BackButton.tsx`(client): 앱 내 탐색 이력 있으면 `router.back()`, 없으면(공유 링크 직진입) `router.replace(fallback)`. `AppHeader`의 `back` prop은 **폴백 URL 의미로 변경**(기존 사용처 10곳 모두 자동 적용 — `/u/[handle]`도 댓글에서 진입 시 그 상세로 복귀)
      - 이력 감지: `lib/nav-history.ts` + 루트 layout의 `NavHistoryTracker`(usePathname effect) — 세션 두 번째 pathname부터 NAVIGATED 플래그(sessionStorage). `history.length`는 외부 유입 오탐이 있어 안 씀. `router.replace`류는 pathname이 안 바뀌어 카운트 안 됨(의도)
      - 보너스: history back이라 카드→상세 역모핑이 진입했던 화면의 카드로 걸리고, Next가 스크롤도 복원. 전체화면 지도→상세→back도 지도(카메라 기억)로 복귀
      - 검증: lint/build ✅, dev 페이지 렌더·하이드레이션 에러 0. 실기기에서 피드→상세→back, 딥링크→back(홈 폴백) 확인 권장
- [x] **둘러보기 지도 = 전체화면 표면** (Claude, 2026-06-13)
      - "지도로" 탭 시 지도가 **헤더·하단탭을 덮는 전체화면**(`fixed inset-0 z-40 max-w-[430px] mx-auto` 오버레이, BottomNav가 z-30이라 그 위)으로 — 지도 탐색을 독립된 표면으로 승격. URL은 그대로 `?mode=map`(레이아웃 수술 없이 오버레이 방식, layout은 searchParams를 못 읽으므로 이 방식이 정석)
      - 플로팅 컨트롤: 상단 검색 필(디바운스 검색, map 모드 유지) + 전체/팔로잉 SlidingSegments(w-48 중앙). **하단 중앙 "목록으로" 필**(+리스트 아이콘) = 탈출구, 하단 우측 현위치 버튼. 카드/클러스터 목록이 열리면 둘 다 숨김(겹침 방지, 지도 탭으로 닫으면 복귀)
      - 진입은 `router.push`(뒤로가기 제스처 = 목록 복귀), 목록으로는 `router.replace`. FeedControls의 지도 토글은 이제 목록 모드 전용("지도로"만)
      - FeedMap에 `fullscreen`/`topSlot`/`onExitFullscreen` props. 키 없음·로드 실패 폴백(`MapNotice`)에도 전체화면일 땐 목록으로 버튼 포함(**탈출 불가 방지**). safe-area: 상단 컨트롤 `pt-[max(12px,env(safe-area-inset-top))]`, 하단 요소 `bottom-[max(20px,env(safe-area-inset-bottom))]`
      - 검증: lint/build ✅, 더미 키로 SSR 풀레이아웃(오버레이·검색바·세그먼트·현위치·목록으로) + 키없음 폴백(목록으로 포함) 확인. 실기기 확인 필수
- [x] **둘러보기 지도 모드 UX 개편 (클러스터링 등)** (Claude, 2026-06-12 밤)
      - **클러스터링**: `FeedMap` 자체 구현(라이브러리 없음) — Web Mercator 월드좌표 그리드(60px 셀) + **경계 분할 보정용 greedy 병합 패스**(셀 경계로 갈라진 이웃 클러스터를 중심 픽셀거리 < 60px면 합침, 이게 없으면 전국 뷰에서 1px 거리 핀이 따로 뜸). `idle`에서 줌 바뀐 경우만 마커 재생성. 클러스터 = 그린 원+숫자(38/46/54px 3단계), 단일 = 기존 커버 썸네일 핀
      - **클러스터 탭**: 줌인으로 풀리는 클러스터면 해당 bounds로 fitBounds, **z19에서도 안 풀리는(사실상 같은 자리) 클러스터면 하단 시트 목록**(`이 지역 루트 N` + 내부 스크롤 행 리스트). 단일 핀 탭 = 기존 미니 카드 유지. 지도 빈곳 탭 = 카드/목록 닫기
      - **동선 오버레이**: 핀 선택 시 그 루트의 폴리라인(그린, 0.75 불투명) 표시 — `FeedMapPoint`에 `path`(좌표 있는 스팟 순서 배열) 추가, getFeedMapPoints가 이미 spots를 조회하고 있어 **추가 쿼리 없음**
      - **카메라 기억**: sessionStorage(`routdiary:feed-map-camera`)에 idle마다 center/zoom 저장, 재진입·목록↔지도 토글·전체/팔로잉 전환 시 복원. **검색어(q) 있으면 복원 대신 결과로 fitBounds**(`preferFit` prop). 첫 방문은 기존 fitBounds(전국 개요)
      - **현 위치 버튼**(우상단): geolocation → 파란 점 마커 + zoom 13 panTo, 실패 시 2.5s 토스트. **뷰포트 빈 상태 칩**: idle마다 bounds 내 핀 유무 검사(`bounds.hasLatLng`, 미지원이면 숨김)
      - 검증: lint/build ✅, 클러스터링 수학은 node로 줌 5단계 시나리오 실측(전국 묶임→점진 분리→코로케 유지), SSR 무사고 확인. **지도 실동작(클러스터 탭/카메라 기억/현위치)은 네이버 키+실기기에서만 가능 — 다음 세션 확인 필수**
      - 다음 단계 → **같은 날 밤 후속으로 구현 완료** (아래 항목)
- [x] **둘러보기 지도: 카드 투어 + 뷰포트 조회** (Claude, 2026-06-12 밤, 위 항목의 후속)
      - **카드 좌우 스와이프 ↔ 마커 동기화**: 핀 탭 시 그 시점 화면 안 루트들을 `tour`로 동결(핀 위치 순회 중 뷰포트가 바뀌어도 목록이 안 흔들리게) — 미니 카드(`TourCard`)를 가로 플릭(56px+)하면 이전/다음 루트로 순환, 지도 panTo + 마커 하이라이트(48px·그린 테두리·zIndex 200) + 폴리라인 자동 갱신. 카드에 `i / n` 표기로 스와이프 발견성 확보. 드래그 후 click은 `movedRef`+preventDefault로 내비 차단. 카드 전환은 `key={id}` 리마운트 + `.tour-card-in`(globals.css)
      - **뷰포트 기반 조회**: idle 400ms 디바운스 → 화면 bounds 30% 마진 확장 → `/api/map-points`(GET, 로그인 필수, bounds 검증) → `getFeedMapPoints({bounds})`. 같은 (반올림 2dp) bounds면 스킵, AbortController로 중복 취소, 실패 시 기존 핀 유지(best-effort). **bounds 필터는 spots 테이블 직접 조회(route_id 수집) 후 routes `.in()`** — 임베드에 gte/lte 걸면 반환 스팟도 잘려 path 오버레이가 깨짐(⚠️ 같은 함정 주의). 초기 데이터는 기존 RSC 120개로 첫 페인트, 이후 idle마다 뷰포트 갱신
      - FeedMap 구조 변경: points가 prop→state(`pts`)로, 마커 재빌드는 `rebuildRef`로 노출해 fetch 후 강제 재빌드. naver bounds 좌표는 `getSW/getNE ?? getMin/getMax` + `lat()/lng() ?? y/x` 방어적 접근(API 버전차 대비, 실패 시 fetch 스킵). ⚠️ `react-hooks/refs`: 렌더 중 ref **쓰기**도 금지 — `ptsRef.current = pts` 같은 동기화는 effect 안에서
      - 검증: lint/build ✅, dev에서 `/api/map-points` 비로그인 401·페이지 무사고 확인. **실동작(투어 스와이프·뷰포트 갱신)은 실기기 필수**
- [x] **세그먼트 손가락 추적 페이저(SegPager)** (Claude, 2026-06-12 밤 — 아래 플릭/푸시 구현을 대체)
      - 화면을 잡고 끌면 **패널이 손가락을 1:1로 따라오고**, 놓으면 가까운 탭(또는 플릭 방향)으로 스냅. 끝 탭 너머는 러버밴드(×0.35). 세그먼트 탭 클릭도 같은 스트립 슬라이드를 타서 탭/드래그가 한 모션으로 읽힘
      - `components/SegPager.tsx`가 SegPanel(스냅샷 푸시)·useSwipeTabs(플릭)·globals.css 키프레임을 전부 대체. `useSegTabs`는 탭 상태+replaceState만 남음. 평소엔 활성 패널만 마운트, 드래그 시작(축 잠금) 순간 flushSync로 이웃 패널을 absolute(left/right-full)로 마운트
      - 스냅 판정: 폭 40% 초과 드래그 또는 플릭(0.45px/ms 이상 + 24px 이상 + 드래그와 같은 방향). 커밋 시 `flushSync(setShown+onChange)`로 **부모 tab과 내부 shown을 한 렌더에 스왑**(어긋나면 렌더 단계 staging이 역슬라이드를 잘못 시작함 — 주의)
      - 탭 클릭 경로: 렌더 중 상태 조정으로 타깃을 반대편에 staging → effect의 rAF에서 트랜지션 시작. 연속 클릭은 settle 완료 후 체인으로 이어짐
      - ⚠️ **`react-hooks/refs` 규칙: 렌더 중 ref 읽기 금지** — 드래그 중 여부는 gestureRef가 아니라 `dragging` state 미러로 판정해야 lint 통과
      - reduced-motion은 JS(matchMedia)에서 체크해 즉시 스냅. 중앙 패널에 key 없음 → 전체↔기록처럼 카드를 공유하는 탭 간엔 DOM 재사용(이미지 재마운트 없음)
      - 검증: lint/build ✅, SSR 프리뷰 3화면(초기 페인트는 활성 패널만, 이웃 미마운트) 확인 후 삭제. **드래그 추적·스냅·러버밴드 감각은 실기기 터치에서만 확인 가능 — 다음 세션 필수.** 둔감하면 COMMIT_FRACTION(0.4)/FLICK_VELOCITY(0.45) 조정
- [x] **세그먼트 스와이프 전환 + 보관함/둘러보기 클라이언트화** (Claude, 2026-06-12)
      - 홈에 이어 **보관함(저장/좋아요)·둘러보기(전체/팔로잉)도 즉시 전환**으로 통일하고, 세 화면 모두 **리스트 영역 가로 스와이프로 인접 탭 이동** 가능 (세그먼트 = 좌우로 나란한 패널이라는 멘탈모델)
      - 공용화: `lib/use-seg-tabs.ts`(`useSegTabs` = 탭 상태+replaceState URL 동기화+스와이프+방향 클래스, `useSwipeTabs` = 제스처) + `components/SlidingSegments.tsx`(슬라이딩 필 세그먼트, 옵션 수 가변). 홈 `HomeRoutesTabs`도 이걸로 리팩터
      - 제스처 설계: **touch 전용**(마우스 무시), 화면 가장자리 24px 시작점 무시(브라우저 뒤로가기 스와이프와 충돌 방지), 첫 10px에서 축 잠금(세로면 스크롤에 양보), 48px 이상 플릭만 인정. 패널에 `touch-pan-y` 필수(가로 이동 중 포인터 이벤트 유지)
      - 패널 모션 (같은 날 푸시 전환으로 강화): `components/SegPanel.tsx` — 탭 전환 시 **나가는 패널 스냅샷을 absolute로 잠깐 유지**해 제스처 방향으로 밀어내고(`seg-panel-out-*`), 새 패널이 반대편에서 이어 들어옴(`seg-panel-in-*`, translateX ±100% 280ms 동일 easing → 이음새가 한 띠처럼 보임). adjust-state-during-render 패턴으로 스냅샷 캡처, `onAnimationEnd`(target===currentTarget 가드, 자식 애니 버블 무시)로 제거. 컨테이너 `overflow-hidden`+`touch-pan-y`. 첫 페인트는 무애니메이션(dir=0). **reduced-motion**: in은 animation none, out은 `display:none`(animationend가 안 와서 잔류 방지). ⚠️ 전환 중 ~280ms 동안 같은 루트 카드가 양쪽 패널에 중복 마운트됨(전체↔기록 등) — ViewTransition 이름 중복은 전환(네비게이션) 시점에만 문제라 실사용 무해, 전환 중 카드 탭이라는 엣지만 존재
      - 보관함: `library/LibraryTabs.tsx`(client) — page가 `getBookmarkedRoutes`+`getLikedRoutes` **둘 다 병렬 fetch** 후 전달. CollectionCard 원탭 해제(router.refresh)는 그대로 동작
      - 둘러보기: `feed/FeedExplorer.tsx`(client)가 view 상태 소유, page가 전체+팔로잉 피드(지도 모드면 양쪽 포인트) **둘 다 병렬 fetch**. 검색·정렬·지도 모드는 기존대로 router.replace(서버). FeedControls는 `onViewChange` controlled로 변경, 자체 Seg 제거. **지도 모드는 스와이프 없음**(지도 드래그와 충돌) — 세그먼트 탭만 즉시 전환
      - 트레이드오프: 피드/보관함 진입 시 양쪽 쿼리 실행(LITE select 2개) — 즉시 전환 대가로 수용
      - 검증: lint/build ✅, 목 데이터 SSR 프리뷰로 3화면 렌더(세그먼트 카운트·인디케이터 위치·빈 상태·`touch-pan-y`) 확인 후 삭제, dev 에러 0. **스와이프 제스처는 실기기(터치)에서만 동작하므로 다음 세션에서 확인 필수** (환경 제약: Supabase·Playwright 차단)
- [x] **홈 전체/기록/계획 세그먼트 전환 클라이언트화** (Claude, 2026-06-12)
      - 증상: 세그먼트가 `Link`(`/?tab=`) 기반이라 탭마다 풀 서버 네비게이션(getMyRoutes 등 재조회) + 페이지 전체 view-transition crossfade → 느리고 부자연
      - 수정: 세그먼트+제목줄+리스트+CTA를 `(tabs)/HomeRoutesTabs.tsx`(client)로 분리. 루트는 페이지에서 1회 받고 클라이언트에서 필터 → **즉시 전환**. URL은 `window.history.replaceState`로 동기화(Next 16 공식 shallow routing — 라우터/`useSearchParams` 통합, `single-page-applications.md` 문서 확인) → 새로고침·공유·딥링크(`?tab=`) 동작 유지. `page.tsx`는 데이터 fetch + 인사말만 남김
      - 모션: ① 활성 필 = absolute 인디케이터 `translateX(idx*100%)` 300ms 슬라이드(기존 per-탭 bg 토글 대체, 인디케이터 폭 계산 위해 세그먼트 `gap-1` 제거) ② 리스트 = `key={tab}` 리마운트 + `.home-tab-panel` 240ms 페이드인(globals.css, reduced-motion 시 animation none)
      - ⚠️ `key={tab}` 리마운트로 RouteCard 이미지가 재마운트되지만 브라우저 캐시로 즉시 페인트(전체 탭에서 이미 로드됨). 뒤로가기로 탭 히스토리를 안 쌓도록 push 대신 **replace** 선택
      - 검증: lint/build ✅. 이 원격 환경은 Supabase 호스트·Playwright 브라우저 다운로드가 네트워크 정책으로 차단 → 스모크 미실행. 대신 목 데이터 임시 페이지로 SSR 확인(세그먼트 전체3/기록2/계획1, `initialTab="plan"` 인디케이터 `translateX(200%)`, plan CTA, dev 콘솔 에러 0) 후 삭제. **실기기 전환 모션은 다음 세션에서 한 번 볼 것**
- [x] **copy_source 임베드 형태 버그 수정** (Claude, 2026-06-12)
      - 증상: 계획 초안이 있는데 홈 세그먼트·계획 배지가 안 보임. 원인: `route_copies.copied_route_id`가 **UNIQUE라 PostgREST가 one-to-one로 추론 → `copy_source`를 배열이 아닌 객체로 반환**하는데 `r.copy_source?.[0]`로 읽어 항상 undefined (service-role REST로 실응답 확인)
      - 수정: `toSummary`에서 배열/객체 양쪽 수용. ⚠️ **PostgREST 임베드 일반 규칙**: FK 컬럼에 UNIQUE 있으면 객체로 옴 — 새 임베드 추가 시 주의
- [x] **홈(내 일기) 기록/계획 구분 탭** (Claude, 2026-06-12)
      - 홈 `?tab=all|record|plan` — 계획 = `copyPurpose === 'plan'`(route_copies lineage), 그 외(원작·계획→기록 전환 포함)는 기록
      - 세그먼트(전체 n/기록 n/계획 n)는 보관함 SegTab과 같은 Link 기반 패턴. **계획 루트가 1개 이상일 때만 노출**(계획 기능을 안 쓰는 유저에겐 기존 홈 그대로)
      - 계획 탭의 하단 CTA는 "새로운 하루 기록하기" 대신 "둘러보기에서 계획 가져오기"(→/feed)
      - 검증: lint/build ✅ 스모크 10/10 ✅, `?tab=plan`(빈 상태+CTA)·기본 홈(세그먼트 숨김) 프리뷰 확인. ⚠️ 세그먼트 노출 상태는 데모에 계획 초안이 없어 미리보기 미실시
- [x] **플래너 시트 내부 스크롤** (Claude, 2026-06-12)
      - 증상: 시트 내용이 아래로 잘리는데 스크롤 불가. 원인: 외곽 `max-h-[62%] overflow-hidden` 안에서 ① summary 분기는 스크롤 없음 ② add/info/spot/legs 분기는 자체 `max-h-[58dvh]` 스크롤러 — 핸들(36px) 추가 후 외곽 클리핑과 어긋나 스크롤 뷰포트 하단이 잘림
      - 수정: 시트를 `flex flex-col`로, 핸들 아래 **단일 스크롤 컨테이너**(`min-h-0 flex-1 overflow-y-auto overscroll-contain`)로 감싸고 4개 분기의 자체 max-h/overflow 제거. ⚠️ 분기 내용물은 자체 높이 제한을 두지 말 것(장소검색 결과 같은 내부 리스트 `max-h-48`은 예외적 중첩 스크롤로 유지)
      - 스모크 플레이크 수정: 따라가기 시트 테스트의 `copyButton.count()`가 콜드 컴파일 시 하이드레이션 전에 0을 봐서 스킵되던 것 → `waitFor(7s)` 후 판정으로 변경
      - 검증: lint/build ✅ 스모크 10/10 ✅
- [x] **플래너 시트 접기/펼치기** (Claude, 2026-06-12)
      - `PlanRoutePlanner`의 여행 계획 시트 상단 핸들 바가 실제 컨트롤이 됨: **탭=토글**, **드래그=따라오다 스냅**(8px 미만=탭, ±48px 이상=접힘/펼침, 그 사이=원위치)
      - 구현: `translateY` 기반 — 접힘 = `calc(100% - 36px)`(`SHEET_PEEK_PX`, 핸들 스트립만 노출), 드래그 중엔 px 오프셋(시트 높이는 pointerdown 시점에 측정해 클램프), 스냅 시에만 transition. 핸들 `touch-none`+pointer capture로 스크롤 충돌 방지. 접힘 상태에선 핸들 필이 그린으로
      - 시트를 여는 모든 경로(마커 탭·검색 추가·내부 네비)는 `openSheet()`를 거쳐 **자동으로 펼쳐짐** — 접어둔 채 마커를 탭해도 시트가 올라옴
      - 검증: lint/build ✅ 스모크 10/10 ✅. ⚠️ 플래너 실진입 검증은 여전히 데모 계정에 계획 초안이 없어 미실시(위 계획 모드 항목과 동일 제약)
- [x] **계획 모드: 지도-우선 경험** (Codex, 2026-06-12 오후 — 커밋 4cb365c·a41754d·75a27ec·ac5f325 + 안정화 22895d6)
      - 계획 목적(`purpose='plan'`)으로 가져온 루트는 기록과 완전히 다른 UI를 탐:
        ① 홈/피드 카드: `RoutePlanThumbnail`(좌표 기반 SVG 동선 미니맵) + "계획" 배지
        ② 상세: A/B 레이아웃 대신 **전용 plan 뷰** — 지도 헤더(`RouteMap` 재사용, 실도로 경로 우선) + 스팟/이동시간 합계/직선거리 합계 메트릭 + `PlanLegCard` 타임라인. `isPlanView`에선 A/B 토글 숨김
        ③ 수정: `RouteForm` 내 **`PlanRoutePlanner`** — 풀스크린 네이버 지도에서 핀 추가(지도 탭→reverse geocode)·순서·동선을 직접 조작하는 지도-우선 편집기(+1,200줄 규모). 섹션 어휘도 계획용(계획 메모/여행 예정/예상 비용)
      - `convertPlanDraftToRecord`(actions): 여행 후 계획 초안 → 기록으로 승격(route_copies.purpose update)
      - 안정화(22895d6, Codex 작업·Claude 검증/커밋): 플래너 지도 0px 초기화 방지 — 컨테이너 가시 크기 대기(`waitForVisibleMapContainer`) + ResizeObserver/resize 트리거 + `tilesloaded`/`idle` 후에만 썸네일 fallback 숨김 + 리스너·타이머 정리
      - 검증: lint/build ✅ 스모크 10/10 ✅. ⚠️ 데모 계정에 계획 초안이 없어 플래너 실진입은 미확인 — 처음 계획 가져오기 할 때 한 번 볼 것
- [x] **"이 루트 따라가기" 온보딩 + 계보(lineage)** (Codex, 2026-06-12 오전 — 커밋 d3f965b. 아래 Claude의 최초 구현을 대체/확장)
      - `supabase/migrations/0008_route_copies.sql`: 원본↔복제본 연결 테이블 + `route_copy_purpose` enum(plan|record). RLS는 기존 `private.owns_route/can_read_route` 헬퍼 재사용(복제자 본인 or 원작자만 조회). **실DB 적용 확인됨**, `database.types.ts` 재생성됨
      - `CopyRouteButton` → 바텀시트로: "이 루트를 내 여행으로 시작할까요?" + 목적 선택(아직 안 다녀왔어요=계획 / 이미 다녀왔어요=기록) 필수 후 "내 비공개 초안 만들기" 활성화
      - `copyRoute(routeId, purpose)`: 실패 시 `cleanupDraft` 롤백, 본인 루트 복제 차단, route_copies 행 기록
      - `getRouteCopyStats`(원작자: 내 루트가 몇 명의 계획/기록이 됐는지 → 상세 `LineagePill`), `getRouteCopyContext`(복제본 상단 출처 배너)
      - 스모크 테스트 +1(시트 렌더·목적 선택 게이팅) — 총 10개. `LITE_SELECT`에 `thumbnail_spots`·`copy_source` 임베드 추가됨
- [x] **A 레이아웃: 사진 라이트박스 + 이동 정보 강화** (Codex, 2026-06-12 오전 — 커밋 1cd97a3)
      - `routes/[id]/PhotoLightbox.tsx`: 스팟 사진 탭 → 전체화면 스와이프 뷰어. CSS scroll-snap(네이티브 스와이프), 키보드 ←/→/Esc, 스팟 이름·`i/n` 캡션, body 스크롤 잠금/복원
      - A 레이아웃 이동 블록: 수단·이동시간·**직선거리**(haversine, 두 스팟 좌표 있을 때) 그리드 + 이동 방법 메모 카드로 확장
- [x] **여행 통계 (프로필)** (Claude, 2026-06-12 — E2E 검증)
      - `getMyTravelStats()`(data.ts): 내 routes+spots 1쿼리 → 루트/스팟/지역 수, 지역별 횟수(다빈도순), 최근 12개월 월별 기록 수(빈 달 포함), 전체 스팟 좌표
      - `/profile/stats`: 요약 3카드 + 월별 CSS 바차트(라이브러리 없음) + 지역 칩(×n) + **내 여행 지도**(`StatsMap`: 그린 닷 마커+fitBounds, 좌표 스팟 없으면 섹션 숨김). 루트 0개면 빈 상태+기록 CTA
      - 프로필에 "여행 통계" 진입 카드(통계 그리드 아래)
      - 스모크 테스트 2개 추가(여행 통계·지도 모드) — 총 9개. ⚠️ dev 서버 콜드 컴파일 직후 첫 실행은 타임아웃 플레이크 가능, 재실행 시 통과
- [x] **"이 루트 따라가기" (루트 복제)** (Claude, 2026-06-12)
      - `routes/[id]/actions.ts` `copyRoute`: 보이는 루트(공개/본인)를 **내 비공개 초안으로 복제** 후 `/routes/{newId}/edit`로 redirect. 복사: 메타(제목·지역·테마·추천대상·시기·비용)+스팟(이름·주소·좌표·순서)+이동(수단·시간·주의). **미복사(의도)**: 원작자 사진·일기 본문(body)·감정(mood)
      - 스팟 id 리매핑: order_index 공유로 old→new 매핑 후 legs 재연결. `transport`는 DB enum(`TransportMode`) 타입 필요(string이면 타입에러)
      - `CopyRouteButton`(client): 비소유자+공개 루트의 소셜 행(좋아요·저장 옆)에 표시. 미로그인 → /login?next=. 성공 시 서버 redirect라 실패시에만 반환값 처리
      - 검증: lint/build ✅, 스모크 7/7 ✅, 버튼 렌더/게이팅 확인(데모로 타인 공개 루트). ⚠️ **실제 복제 실행은 미검증**(실DB 쓰기 가드) — 처음 써볼 때 복제→수정 화면 진입 확인 권장
- [x] **지도 기반 탐색 (둘러보기 지도 뷰)** (Claude, 2026-06-12 — E2E 검증)
      - `getFeedMapPoints({q, view})`(data.ts): 공개 루트를 **첫 좌표 스팟** 위치로 핀(최신 120개 limit). 좌표 없는 루트는 제외. 팔로잉 뷰도 지원(follows 조인)
      - `feed/FeedMap.tsx`(client): 커버 썸네일 원형 마커(40px, 흰 테두리) + fitBounds. 마커 탭 → 하단 미니 카드(커버·제목·지역·스팟·♥) → 상세 링크. 빈 상태/키 미설정/로드 실패 처리
      - `FeedControls`에 `mode`(list|map) URL 파라미터 + "지도로/목록으로" 토글(정렬 칩은 지도에서 숨김 — 핀에 순서 없음). `feed/page.tsx`가 mode 분기, FeedMap은 `key={q|view}`로 검색·뷰 변경 시 리마운트
      - 검증: lint/build ✅, 스모크 7/7 ✅, 마커 3개(서울·강원·부산) 렌더 + 탭→카드→링크 확인. ⚠️ 네이버 마커는 합성 click 단발로는 안 잡힘 — 테스트 시 pointerdown→mousedown→pointerup→mouseup→click 시퀀스 필요
- [x] **PWA화 (manifest + 설치 지원)** (Claude, 2026-06-12)
      - `src/app/manifest.ts`(Next 컨벤션 → `/manifest.webmanifest` 자동 서빙·링크): standalone, ko, 화이트 테마
      - 아이콘: `public/icons/icon.svg`(원본, 그린 #22c55e + 흰 출발점·점선루트·도착핀) → ImageMagick으로 192/512/apple-touch-icon(180) 래스터화. full-bleed라 maskable 겸용. ⚠️ ImageMagick MSVG는 `stroke-dasharray` 미지원 — 점선은 명시적 circle로 그림
      - `layout.tsx`: `icons.apple` + `appleWebApp`(capable/title/statusBarStyle) 추가, `viewport.themeColor` `#f3f6f4`→`#ffffff`(순백 배경과 일치)
      - 서비스워커/오프라인은 의도적 미포함(App Router SW 복잡도 대비 효익 낮음) — 필요해지면 별도 작업
      - 검증: lint/build ✅(빌드에 `/manifest.webmanifest` 라우트), head에 manifest·apple-touch-icon·theme-color 링크 확인, 아이콘 PNG 200, 스모크 7/7 ✅
- [x] **업로드 이미지 클라이언트 리사이즈/WebP 변환** (Claude, 2026-06-12)
      - `src/lib/image.ts`: `compressImage`(createImageBitmap→canvas→WebP). 최대 변 1600px(아바타 512px)·q0.82, 200KB 미만/gif/svg/비이미지/디코딩 실패/축소 무효과 시 **원본 그대로 반환**(graceful). `mapWithConcurrency`(동시 3개)로 메모리 보호
      - 삽입점: `RouteForm.handleSave`(서명 전 압축 → path ext가 실제 payload와 일치) + `ProfileEditForm` 아바타. **EXIF(GPS·촬영시각)는 선택 시점에 원본에서 이미 읽으므로 영향 없음**(canvas가 EXIF 제거하는 건 업로드본만)
      - 검증: lint/build ✅, 스모크 7/7 ✅. 압축 알고리즘은 브라우저에서 동일 소스로 실측(19.7MB PNG→995KB WebP 1600px, 95.1%↓, 노이즈=압축 최악조건). ⚠️ **실제 루트 작성→storage 객체 webp 확인은 미실시**(자동화 가드가 실DB 쓰기 차단) — 다음에 사진 1장으로 루트 만들었다 지우며 한 번 확인 권장
- [x] **Playwright 스모크 테스트** (Claude, 2026-06-12 · 2026-07-06 IA 반영 갱신)
      - `pnpm test:e2e` — `playwright.config.ts` + `e2e/auth.setup.ts`(데모 계정 로그인→storageState 저장) + `e2e/smoke.spec.ts`
      - 커버: **둘러보기(`/`)** + 하단탭(홈·지도·보관함), 검색·카드→상세·따라가기 시트, 보관함(저장·좋아요·팔로잉), `/profile`, 지도 탭→**홈으로**, **게스트 `/` 열람**·`/library` → login
      - ⚠️ **읽기 전용 설계**: 실제 Supabase 프로젝트를 대상으로 돌므로 데이터 생성/변경 테스트 금지. 데모 계정은 `E2E_DEMO_EMAIL/PASSWORD` env로 교체 가능
      - webServer 설정으로 dev 서버 자동 기동(이미 떠 있으면 재사용). `/test-results/`·`/playwright-report/`·`/e2e/.auth/` gitignore됨
      - 검증: 7/7 통과(10.5s). 새 기능 작업 후 `pnpm lint`+`pnpm build`와 함께 돌릴 것
- [x] **카드→상세 모핑 자연화 + 캐러셀 장수표기 이동** (Codex, 2026-06-11)
      - 첨부 영상(`/Users/nike/Downloads/ScreenRecording_06-11-2026 15-56-36_1.mov`) 프레임 분석: 카드 4:5 이미지가 상세 히어로로 커지는 동안 페이지 전체 crossfade와 헤더/본문 등장 타이밍이 길게 겹쳐 어색해 보였고, 캐러셀 장수표기가 상단 헤더 컨트롤과 겹치는 문제가 확인됨
      - `ViewTransition`에 `share` prop 타입 추가, 카드/상세/PhotoCarousel 첫 이미지 모두 `share="route-cover-morph"`로 같은 커버 평면을 캡처하도록 정리
      - `globals.css`: 기본 view-transition은 짧게(페이지 crossfade 260~320ms), 커버 전용 morph는 460ms easing + 약한 mid-blur로 분리
      - `PhotoCarousel`: `i / n` 배지를 우측 상단에서 우측 하단으로 이동하고, 도트 스텝퍼와 같은 하단 컨트롤 줄에 배치. B 레이아웃 히어로는 제목 영역 `pb-12`로 하단 컨트롤과 충돌 방지
      - 검증: `pnpm lint` ✅, `pnpm build` ✅, Browser로 `/feed` 카드 클릭→`/routes/469f2523-7b8f-49ff-a65c-973cf72d220e` 상세 도착 확인, B 레이아웃 장수표기 `1 / 5`가 헤더 아래/이미지 하단 우측에 표시됨, 콘솔 에러 0건
- [x] **상세 진입 즉시 반응 + 헤더 고정** (Codex, 2026-06-11)
      - 카드 클릭 후 상세 데이터 응답 전까지 morph가 멈춘 것처럼 보이는 문제 대응: `routes/[id]/loading.tsx` + `RouteDetailLoadingShell` 추가로 동적 상세 라우트에 즉시 표시되는 히어로 skeleton 제공
      - `RouteCard` 클릭/포인터다운 시 pending route summary를 `sessionStorage`에 저장하고, 진입 morph 이름을 `route-cover-enter`로 즉시 전환해 loading shell/상세 히어로와 연결. `useLinkStatus` 기반 은은한 pending sheen도 추가
      - 루트 상세 헤더는 히어로 내부 absolute 배치에서 프레임 폭(`max-w-[430px]`)에 맞춘 `fixed top-0` 플로팅 헤더로 이동해 상세 스크롤 중에도 상단 컨트롤 유지
      - pending morph는 상세 도착 후 520ms 뒤 기존 per-route 이름(`route-cover-{id}`)으로 되돌리고 세션 값을 정리해 뒤로가기 morph와 충돌 방지
- [x] **루트 상세 헤더/메타 배치 정리** (Codex, 2026-06-11)
      - `routes/[id]/ShareButton.tsx`: 헤더용 `glass` variant 추가(아이콘-only, native share/clipboard 동작 유지)
      - `routes/[id]/RouteView.tsx`: 공개 루트 공유 버튼을 본문 소셜 영역에서 히어로 헤더 오른쪽으로 이동. 좋아요/저장은 본문 상단에 유지
      - 테마/감정 칩을 히어로 제목 아래(작성자·날짜 위)로 이동해 A/B 상세 레이아웃 모두 제목 영역 근처에 표시
      - `components/AppHeader.tsx`: 공용 헤더의 하단 border 제거 → 홈/둘러보기/보관함/프로필 및 설정류 헤더에서 하단 라인 없음
      - 검증: `pnpm lint` ✅, `pnpm build` ✅, Browser로 `/routes/469f2523-7b8f-49ff-a65c-973cf72d220e`와 `/feed` 확인(공유 버튼 헤더 이동, 칩 제목부 이동, 헤더 border 0px)
- [x] **Next 16 / React 19 lint 정리** (Codex, 2026-06-11)
      - AGENTS 지침대로 `node_modules/next/dist/docs/`의 Next 16 업그레이드/Proxy/View Transitions/useSearchParams 문서 확인 후 수정
      - `RouteView`의 상세 레이아웃(A/B) 저장값과 `ThemeToggle`의 다크모드 상태를 `useEffect` 동기 `setState` 대신 `useSyncExternalStore` 구독 패턴으로 변경
      - `ChipSheet`/`MoodSheet`는 열릴 때 내부 패널을 새로 마운트해 초기값을 잡도록 변경(바텀시트 애니메이션은 기존처럼 `requestAnimationFrame`)
      - `SpotLocationPicker`의 `onPickRef` 갱신을 렌더 중 ref 쓰기에서 effect로 이동
      - `routes/new/actions.ts`의 미사용 eslint-disable 1개 제거
      - 검증: `pnpm lint` ✅, `pnpm build` ✅
- [x] **루트 상세 A 레이아웃 히어로 높이 확대**
      - `routes/[id]/RouteView.tsx`: A 레이아웃 커버 히어로를 `h-72`에서 `h-[52vh] max-h-[560px] min-h-[300px]`로 조정해 카드→상세 morph가 더 크게 읽히게 함
- [x] **루트 수정/삭제** (E2E 검증 완료)
      - 작성/수정 공용 `src/components/RouteForm.tsx`(mode create|edit). `new/page`는 얇은 래퍼
      - `routes/new/actions.ts`: `updateRoute`(소유자검증→메타 update→스팟 cascade 삭제 후 재삽입→고아 스토리지 정리)·`deleteRoute`(소유자검증→cascade 삭제→스토리지 제거). `signPhotoUploads`는 key 기반 파일명(수정 시 충돌 방지)
      - `routes/[id]/edit/page.tsx`(소유자만), 상세에 소유자 전용 수정 링크 + `DeleteRouteButton`(확인 후 삭제)
      - 기존 사진은 `Photo.storagePath`로 보존, 신규만 업로드
- [x] **빈 상태/로딩/에러 UX** (스켈레톤·에러바운더리·404)
      - `RouteCardSkeleton`/`RouteListSkeleton` + `loading.tsx`(홈·피드·보관함·프로필·루트 상세) — Suspense 폴백
      - `app/error.tsx`(client, 다시 시도) · `app/not-found.tsx`(친화적 404, notFound() 연결)
      - 빈 상태는 피드(검색 무결과)·보관함(저장/좋아요 없음)에 이미 적용됨
- [x] **프로필 편집(아바타·닉네임·핸들)** (E2E 검증 완료)
      - `(tabs)/profile/edit` + `ProfileEditForm`, 프로필에 "프로필 편집" 버튼
      - `profile/actions.ts`: `updateProfile`(닉네임/핸들 검증, 핸들 중복 23505 처리)·`signAvatarUpload`(아바타는 route-photos 버킷 `{uid}/avatar/`에 서명URL 업로드)
- [x] **설정 항목 실제 연결** (E2E 검증)
      - 계정 정보 `/profile/account`(이메일·로그인방식·가입일·로그아웃)
      - 공개 범위 기본값: `profiles.default_visibility`(마이그레이션 `0006`) 인라인 토글 → 새 루트 작성이 이 값으로 시작
      - 도움말 `/profile/help`(FAQ), 알림은 시스템 부재로 "준비 중" 정직 표기

### 배포 (완료)
- **프로덕션**: https://course-sns.vercel.app (Vercel `pentanike-uxs-projects/course-sns`)
- **현재 버전**: v1.14.21 (`src/lib/version.ts`)
- Vercel Production env (**필수 5**): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_NAVER_MAP_KEY`, `NAVER_MAP_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- **권장 추가**: `NAVER_SEARCH_CLIENT_ID/SECRET`(장소 검색), `TMAP_APP_KEY`(보행 실도로), `NEXT_PUBLIC_SITE_URL`(OG)
- 네이버 Maps Application Web URL: `https://routdiary.vercel.app` + `http://localhost:3000`. ⚠️ **프리뷰 배포는 URL이 달라 지도 인증 실패**(필요 시 프리뷰 도메인도 등록)
- Supabase 마이그레이션: `supabase/migrations/0001`~`0009` — CLI/`supabase db push` 또는 SQL 수동 적용. `0009` = 직접 plan draft(`original_route_id` nullable)
- `vercel --prod`로 수동 배포 가능. `.vercel/`은 gitignore

## 5. 실행 방법

```bash
cd ~/Documents/routdiary
pnpm install      # 필요 시
cp .env.example .env.local   # 최초 1회
pnpm dev          # http://localhost:3000
pnpm lint         # ESLint (build는 lint 미실행)
pnpm build        # 프로덕션 빌드 검증
pnpm test:e2e     # Playwright 스모크
```

## 6. 알아둘 함정 (Gotchas)

- **PostgREST 임베드 모호성**: `routes`에서 `profiles` 임베드 시 `likes/bookmarks` 정션 때문에 다대다 경로가 추론돼 HTTP 300(PGRST201). → FK 힌트 필수: `author:profiles!routes_author_id_fkey(...)`. `spots`도 legs 정션 영향으로 `spots!spots_route_id_fkey` 사용 중.
- **Next 16**: `middleware.ts` deprecated → `proxy.ts`(export `proxy`). `useSearchParams`는 `<Suspense>`로 감쌀 것. `next build`는 lint를 실행하지 않으므로 검증 시 `pnpm lint`를 별도로 돌릴 것.
- **이미지 호스트**: `next.config.ts` `images.remotePatterns`에 Supabase Storage 호스트 등록돼 있음.
- **기록 패턴**: 사람이 읽는 인수인계는 이 파일(`docs/HANDOFF.md`)에 같은 문체로 누적. **UI·디자인 규칙**은 [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md)에 정본으로 유지하고, 버전별 UI 결정만 §7에 남긴다. `.bkit/`는 세션 자동 기록으로 보이며 현재 untracked 상태라 임의 삭제/커밋하지 말 것.

## 7. 작업 로그 (이어서 누적)

### 사람 팔로우 디스커버리 루프 (Cursor, 2026-06-17 · v1.93 기준)
- **배경**: 남의 프로필 화면(`/u/[handle]`)·팔로우·팔로잉 피드는 이미 동작했지만 **거기로 가는 길이 거의 없었음**. "프로필 새로 만들기"가 아니라 (1) 진입점(디스커버리)을 뚫고 (2) 프로필을 팔로우 판단에 맞게 다듬는 작업. 멘탈모델 = "프로필 = 그 사람의 여행 루트 책장", 팔로우 = "그 사람의 앞으로 공개 루트를 내 팔로잉 피드로 구독".
- ⚠️ **이 로컬은 직전까지 v1.70로 23빌드 뒤처져 있었음**(version.ts만 보고 헷갈리기 쉬움). `git pull`로 v1.93 동기화 후 작업. 로컬 `RouteForm.tsx` 미커밋분(플래너 그리드 UI)은 이미 v1.93 `01a1d8d`에 정식 반영돼 있어 **discard 후 ff pull**.
- **데이터(`src/lib/data.ts`)**:
  - `UserProfile`에 `followsMe` 추가(`getUserProfile`에 "상대가 나를 팔로우?" 쿼리 1개 더). 맞팔/서로팔로우 라벨 근거.
  - `PersonSummary` 타입 + `getFollowConnections(handle, "followers"|"following")`(관계행 → 프로필 hydrate, 뷰어 팔로우 상태 동봉, 최신 관계순) + `getMyFollowing()`(내가 팔로우한 사람들) + 내부 `hydratePeople()`. ⚠️ `follows`는 `select("follower_id, followee_id, created_at")` 후 JS에서 방향에 맞게 id 선택(동적 컬럼 select는 타입추론 깨짐 회피). id 순서 보존 위해 `Map`으로 재정렬.
- **컴포넌트**:
  - `components/FollowToggle.tsx`(신규, 공용): 기존 `/u/[handle]/FollowButton.tsx`를 대체(삭제). 4-상태 라벨(팔로우/팔로잉/맞팔로우/서로 팔로우), `size lg|sm`, 낙관적 토글 + `router.refresh`. 서버액션은 `@/app/u/[handle]/actions`의 `toggleFollow` 재사용.
  - `components/PersonRow.tsx`·`components/PeopleList.tsx`(신규): 아바타+이름+@핸들 Link + 행 단위 FollowToggle, 빈 상태 포함.
  - `routes/[id]/RouteAuthorCard.tsx`(신규): 루트 상세 본문의 **작성자 카드**(아바타·이름·@핸들·"여행 루트 보기"·chevron → `/u/handle`). `RouteView`의 A/B/plan 3레이아웃 모두 `{social}` 바로 아래에 삽입(비소유 + handle 있을 때만).
- **디스커버리(1단계)**: 피드 카드 작성자 칩을 탭 가능하게. 카드 전체가 `<Link>`라 **중첩 `<a>` 불가** → 작성자 영역을 `role="link" tabIndex=0` span으로 만들고 `onPointerDown/onClick`에서 `stopPropagation`(+click은 `preventDefault`)해 카드 네비/모핑 대신 `/u/handle`로. 적용처: `feed/FeedRouteCard.tsx`(`AuthorTap` 헬퍼로 `OwnerLine`·`OwnerPill` 감쌈), `components/RouteCard.tsx`(showOwner 칩). 루트 상세 byline·댓글은 이미 링크였음.
- **프로필 다듬기(1단계)**: `/u/[handle]/page.tsx` — 팔로워/팔로잉 Stat을 `Link`로(→ 사람 목록), `followsMe`면 "회원님을 팔로우합니다" 맥락 줄, FollowToggle에 `followsMe` 전달.
- **사람 목록(2단계)**: `/u/[handle]/followers`·`/u/[handle]/following` 페이지 신규(PeopleList + getFollowConnections, back은 해당 프로필).
- **보관함 팔로잉(2단계)**: `library/page.tsx`가 `getMyFollowing()`도 fetch. `LibraryTabs`의 팔로잉 패널에 **루트 / 사람** 하위 세그먼트(`SlidingSegments`) — 소비(루트 피드) vs 관리(내가 팔로우한 사람 + 언팔). 기본은 루트.
- **검증**: `pnpm lint` ✅ / `pnpm build` ✅ (새 라우트 `/u/[handle]/followers`·`/following` 생성 확인). ⚠️ 실제 팔로우 토글·실데이터 목록은 브라우저 미검증(이번 세션은 빌드까지) — 실기기/실계정에서 발견→프로필→팔로우 루프, 보관함 사람 탭 언팔 한 번 확인 권장.
- ⚠️ **환경 메모**: bkit 플러그인 훅(`unified-bash-pre.js`·`pre-write.js`)이 invalid JSON으로 쉘/파일편집을 차단해 `~/.claude/settings.json`에서 `bkit@bkit-marketplace: false`로 끔 → 이 기간 `.bkit/` 자동기록은 공백(의도된 선택). 기록은 Cursor 대화 + git + 이 파일로 유지.

### 피드 3종 마감: 계획 썸네일 비율 · 필터/배치 유지 · 강조색 톤다운 (Cursor, 2026-06-17 · v1.95)
- **① 계획 게시글 썸네일 찌그러짐**: `components/RoutePlanThumbnail.tsx`의 SVG가 `viewBox 0 0 100 125`(세로형) + `preserveAspectRatio="none"`이라 "큰 이미지"(16/10) 레이아웃에서 가로로 비균일하게 늘어나 핀(원)이 타원으로, 동선이 찌그러짐. → `preserveAspectRatio="xMidYMid slice"`(균일 채움)로 변경. slice 크롭이 핀을 자르지 않도록 `plotPoints`의 좌표 범위를 중앙 안전영역으로 좁힘(x `14→[14,86]`을 `[22,78]`, y `[24,102]`을 `[36,88]`). 16/10 크롭 시 가시 y≈[31,94]라 안전. 사진 커버는 기존대로 `object-cover`.
- **② 필터·배치타입 유지**(상세 진입 후 복귀 시 풀리던 문제): `FeedExplorer`의 layout은 `useState("grid")` 로컬, filters는 `window.history.replaceState`(shallow)만 → 라우터 캐시가 몰라 뒤로가기/재마운트 시 초기화됨. → 둘 다 `useSyncExternalStore`로 영속화. layout=`localStorage`(고정 선호), filters=`sessionStorage`(세션). 테마 토글과 동일 패턴(SSR/첫 페인트는 기본/URL값, 하이드레이션 후 저장값으로 reconcile → set-state-in-effect 린트·하이드레이션 미스매치 둘 다 회피). 저장값 있으면 그게 진실원, URL은 첫 로드 seed. `applyFilters`는 sessionStorage 기록 + 커스텀 이벤트 dispatch + 기존 shallow URL 동기화 유지.
- **③ 선택 강조색 톤다운**(브랜드 그린 → 그레이 계열): 선택 상태를 `bg-ink text-paper`(중성 다크 펠릿, 토스트와 동일 토큰)로 통일. 적용처 — `FeedControls`(정렬칩·필터버튼 active, 레이아웃 버튼 active 아이콘 `text-sunset→text-ink`), 적용된 필터칩은 `bg-sunset-wash/text-sunset-ink → bg-muted/text-ink-soft + ring-line`. `FeedFilterSheet` 칩 active, `FeedExplorer` 지도 칩·지도 필터버튼 active도 동일 처리. ⚠️ CTA(필터 적용 버튼 등)·내비바는 브랜드 그린 **현행 유지**.
- **검증**: `pnpm lint` ✅ / `pnpm build` ✅. 브라우저 실측은 미진행(빌드까지) — 큰 이미지 레이아웃에서 계획 핀 원형 유지, 필터/배치 설정 후 상세 왕복 복원, 강조색 확인 권장.

### 보관함>팔로잉 = 회원 관리 + 회원 검색(친구 찾기) (Cursor, 2026-06-17 · v1.96)
- **결정(사용자 확인)**: ① 팔로잉 탭의 `루트/사람` 세그먼트 제거 → **팔로우한 회원 카드만** 노출(팔로우한 사람의 공개 루트 피드 `getFollowingFeed`는 탭에서 **완전 제거**, 디스커버리는 둘러보기 홈이 담당). ② 검색 대상 = **전체 공개 회원**(이름·@핸들). ③ 검색어 없을 땐 **내 팔로잉 목록**만(추천 회원은 후속).
- **SNS 패턴 차용**(인스타/쓰레드/X): 검색 바 + 디바운스 타이프어헤드, 결과 행 = 아바타·이름·@핸들·인라인 팔로우, 이름+핸들 동시 매칭, 본인 제외, 행 탭→프로필.
- **데이터(`src/lib/data.ts`)**: `searchPeople(q)` 추가 — `profiles`를 `display_name`/`handle` `ilike` OR 검색(or()/ilike 깨는 `%,()` 제거), 본인 제외, 이름순 20명, id만 뽑아 기존 `hydratePeople`로 뷰어 팔로우 상태까지 주입(PersonSummary). 피드 검색과 동일한 살균 규칙.
- **API**: `src/app/api/people/route.ts`(GET `?q=`) 신설 — auth-gated, 2~60자만 조회, `{ people }` 반환(`/api/places` 타이프어헤드 패턴).
- **UI**: `library/FollowingPanel.tsx`(신규, client) — 검색 인풋(이름/@아이디, 지우기)+디바운스 280ms fetch. 검색어<2글자=팔로잉 목록(서버 prop), ≥2글자=검색 결과. 행은 공용 `PersonRow`(인라인 `FollowToggle`, 낙관적). 상태: 스피너/무결과/빈 팔로잉. ⚠️ **린트 `set-state-in-effect` 회피**: effect 본문에서 동기 setState 금지라, 모든 setState를 디바운스 setTimeout 콜백 안에서만 호출(요청 경합은 `reqRef` 카운터로 최신만 반영).
- **연결**: `LibraryTabs`에서 `루트/사람` 세그먼트·`FeedRouteCard`·`PersonRow`·`useState` 제거, 팔로잉 패널은 `<FollowingPanel following={followingPeople} />`로 단순화. `EmptyState`는 saved/liked 전용으로 축소. `library/page.tsx`는 `getFollowingFeed` fetch 제거(함수 자체는 data.ts에 dead export로 남겨둠 — 향후 둘러보기 '팔로잉' 필터 재사용 여지).
- **검증**: `pnpm lint` ✅ / `pnpm build` ✅(`/api/people` 라우트 생성). 실측 권장: 친구 검색→팔로우→팔로잉 목록 반영, 언팔 후 목록 갱신(router.refresh).

### 하단 회색 띠(콘텐츠 잘림) 수정 (Cursor, 2026-06-17 · v1.97)
- **증상**: 폰 4개 화면(프로필/피드/스플래시/새 계획) 하단에 회색 띠가 보이고 콘텐츠가 잘려 보임.
- **원인**: `globals.css`의 `body { background: var(--stage) }`(데스크톱 프레임 양옆 배경용 뉴트럴 `#f0f0f0`)가, `html,body{height:100%}`(≈large viewport)와 프레임 `min-h-dvh`(dynamic viewport)의 차이만큼 **프레임 하단 아래로 새어** 보임. `BottomNav`는 `fixed bottom-0`라 도크와 흰 영역 사이에 회색 띠가 생김. (실제 클리핑 아님)
- **수정**: `@media (max-width:430px)`에서 `body { background: var(--paper) }`로 폰에서는 프레임과 동일한 흰 배경 적용 → 새던 회색이 흰색이 되어 봉합. 프레임이 화면보다 좁아지는 >430px(데스크톱/태블릿)에서는 stage 배경 그대로 유지. CSS 1곳, 저위험.
- **검증**: `pnpm build` ✅.

### 새 여행 계획(지도 플래너) 하단 빈 공간 수정 (Cursor, 2026-06-17 · v1.98)
- **증상**: body 회색 수정(v1.97) 후에도 `routes/new`(계획) 화면만 하단이 빈 채로 남고 시트가 위로 떠 보임.
- **원인**: 이 화면은 `(tabs)` 밖이라 MobileFrame을 안 쓰고 `RouteForm`의 `PlannerFrame`이 자체 `fixed inset-x-0 top-0 h-dvh` 컨테이너를 사용. `top-0 + h-dvh`는 브라우저의 레이아웃 뷰포트와 dynamic viewport가 어긋나면 **실제 화면 바닥에 못 닿아** 프레임 아래가 비고, 맵(flex-1) 안에서 `bottom: safe-area`로 앵커된 하단 시트도 그만큼 떠 보임.
- **수정**: `PlannerFrame`을 `top-0 + h-dvh` → **`inset-x-0 top-0 bottom-0`**(상·하단 동시 고정)으로 변경. 높이가 정의되면서도 실제 바닥까지 flush. 가로 중앙정렬(`mx-auto max-w-[430px] w-full`)은 그대로. 로딩 셸(`RouteFormLoadingShell`)은 MobileFrame 기반이라 v1.97 body 수정으로 이미 해결.
- **검증**: `pnpm build` ✅.

### 문서·E2E 현행화 (Cursor, 2026-07-06)

- **배경**: v1.14.5~21 드로어 작업·IA 개편(랜딩=둘러보기, 3탭+FAB)이 `HANDOFF.md`·README·E2E에 반영되지 않아 신규 세션/CI에서 혼동.
- **갱신**:
  - `docs/HANDOFF.md` §1 현재 내비·드로어, §2 환경변수 표, §3 v1.14.5~21·IA·TMAP·0009, 배포·실행·스모크 설명
  - `README.md` — 프로젝트 소개·빠른 시작·문서 링크
  - `.env.example` + `.gitignore`(`!.env.example`) — 전체 env 템플릿
  - `e2e/smoke.spec.ts`·`auth.setup.ts` — 둘러보기 `/`, 탭 홈·지도·보관함, 게스트 `/` 공개·`/library` 가드
- **검증**: `pnpm lint`/`pnpm build`/`pnpm test:e2e` 권장.

### UI Design System 문서 신설 (Cursor, 2026-07-06)

- **배경**: 토큰·UI 결정이 `globals.css`와 HANDOFF §3·§7에 분산 — 신규 컴포넌트·재활용 시 일관 언어 부재.
- **추가**: `docs/DESIGN-SYSTEM.md` — 원칙, 컬러·타ipo·radius·shadow, MobileFrame/z-index, 컴포넌트 카탈로그, 모션 상수, 레시피, a11y, don'ts, 동기화 규칙.
- **연결**: README·HANDOFF §6·§2에서 링크. 정본 토큰은 여전히 `globals.css`.

### UX Waves A–D · 공개 게이트 · 페르소나 재채점 (Cursor, 2026-07-22~23 · v0.2.0-mvp)

- **버전**: `APP_VERSION` `v0.1.0-mvp` → **`v0.2.0-mvp`** (전이 UX 마이너 묶음).
- **Wave A (의미 충돌 제거)**: 보관함 탭 하트→스택; 지도 peek·카드 ♥ 폴백 제거→따라감/다녀옴; 에러 `error-soft`; 상태 뱃지 재매핑.
- **Wave B (루프 전환)**: CTA 톤(따라가기 solid / 다녀왔어요 outline / 후기 수정 neutral); 저장 카드「따라가기」; `FollowProgressBar`; AuthGate 전이 카피; `popular`→`followed`.
- **Wave C (토큰 건강)**: `--success` teal; 플래너 레드 예산(완료만 sunset); walk path slate; leaf/primary-green deprecate.
- **Wave D (영향력)**: 프로필 전이 지표; 알림 전이/소셜 그룹; 게시 전 `FollowReadyHint`.
- **공개/비공개 게이트**: `RouteForm` — finish→상세는 `visibilityChosen` 필수(스크롤/기본값으로 우회 불가). 임시저장은 허용. 편집 시 확인 시트+피커. (PR #15 계열)
- **문서**: §1을 코스 IA로 재작성; [`UX-PERSONA-PAINPOINTS.md`](UX-PERSONA-PAINPOINTS.md) Wave 이후 **10점 시나리오 재채점** + Wave E 개선안.
- **검증**: `pnpm lint` / `pnpm build` / (가능 시) `pnpm test:e2e`.
- **정본 동기화 순서**: `globals.css` → DESIGN-SYSTEM → HANDOFF §7 → (비표준 시) JSDoc.

### Wave E — 잔여 페인포인트 해소 (Cursor, 2026-07-23 · v0.3.0-mvp)

- **버전**: **`v0.3.0-mvp`**.
- **E1**: 상세 `CourseFollowActions`를 ♥/저장(`RouteActions`)보다 위. 소유자 공개 코스에 전이 프루프/빈 상태 힌트. like·bookmark·FollowToggle AuthGate 전이 카피.
- **E2**: `courseSpecLine` null 금지; TransferPill/MetaRow `첫 따라가기` 고정; 지도 peek 스펙 패리티(`getFeedMapPoints` legs/difficulty).
- **E4**: `FollowProgressBar` 스팟/이동을 실데이터로; 저장 카드 `저장함 · 아직 안 따라감`.
- **E3**: migration `0014` — 알림 `copy`·`course_publish` 트리거; 알림 UI·정렬; 홈 `FollowingRail`.
- **E5**: `--error` `#b91c1c` (brand와 분리); 통계 타이틀 `코스 통계`.
- **검증**: `pnpm lint` / `pnpm build` / `pnpm test:e2e`.
- **운영**: Supabase에 `0014_transfer_notifications.sql` push 필요(미적용 시 홈 레일·기존 알림은 동작, 신규 타입 트리거만 대기).
