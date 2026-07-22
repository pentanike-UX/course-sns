# 코스 Design System

> UI·인터페이스 일관성을 위한 정본 가이드. **코드 토큰 = 스펙** — 값을 바꿀 때는 `src/app/globals.css`를 먼저 수정하고, 이 문서와 `docs/HANDOFF.md` §7에 변경 이유를 남긴다.  
> 최종 업데이트: 2026-07-16 · course-sns MVP · **브랜드 포인트 컬러 = 레드** (`globals.css` 정본) · 표면/잉크 뉴트럴 (녹회·그린 tint 제거)

---

## 1. 원칙

| 원칙 | 설명 |
|------|------|
| **Fresh / Light / Trust / Followable** | 밝고 가벼운 **따라갈 수 있는 코스**. 과장된 장식보다 사진·지도·동선이 주인공 |
| **모바일 우선 (~430px)** | 모든 화면은 폰 프레임 안에서 설계. 데스크톱은 같은 UI + 좌측 레일 |
| **iOS 멘탈모델** | large title, edge drawer, bottom sheet, 44pt 터치, 슬라이드 전환 |
| **토큰 우선** | 하드코딩 hex 대신 CSS 변수 / Tailwind semantic (`bg-paper`, `text-ink`) |
| **역할 분리** | **브랜드 레드** = CTA·내비·FAB / **ink neutral** = 선택·필터 active |

---

## 2. 토큰 정본

**파일:** `src/app/globals.css`

새 컴포넌트는 아래 semantic 이름을 쓴다. `--sunset` / `--primary-green-*` 는 **legacy 이름** — 값은 레드 포인트 컬러. 신규는 `--brand-primary` 또는 `bg-sunset`(=레드) 사용.

### 2.1 컬러

#### Surfaces

| Token | Light | 용도 | Tailwind |
|-------|-------|------|----------|
| `--paper` | `#ffffff` | 앱 배경 | `bg-paper` |
| `--card` | `#ffffff` | 카드·시트 | `bg-card` |
| `--bg-sunken` / `--muted` | `#f3f3f3` | 칩·세그먼트 트랙 | `bg-muted` |
| `--stage` | `#f0f0f0` | 데스크톱 프레임 바깥 | (body only) |

#### Text (Ink)

| Token | 용도 | Tailwind |
|-------|------|----------|
| `--ink` | 본문·제목 (neutral charcoal `#171717`) | `text-ink` |
| `--ink-soft` | 보조·라벨 | `text-ink-soft` |
| `--ink-faint` | placeholder·메타 | `text-ink-faint` |
| `--line` | hairline border | `border-line`, `ring-line` |

#### Brand & Action (레드 포인트)

| Token | Light | 용도 |
|-------|-------|------|
| `--brand-primary` | `#ef4444` | 주 CTA, FAB, 내비 active, primary 버튼 |
| `--brand-primary-hover` | `#dc2626` | hover |
| `--brand-primary-pressed` | `#b91c1c` | pressed |
| `--sunset` | `#dc2626` | `bg-sunset`, `text-sunset` (legacy 이름 → 레드) |
| `--sunset-ink` | `#b91c1c` | wash 위 텍스트 |
| `--sunset-wash` | `#fee2e2` | 연한 레드 배경 (배지·힌트) |
| `--shadow-brand` | `rgba(220, 38, 38, 0.18)` | 레드 CTA glow |

스케일 별칭 `--primary-green-*` 도 **레드 스케일 값**을 담는다 (이름만 legacy).

#### Selection (neutral)

**필터·정렬·레이아웃 토글 active**에는 브랜드 레드 대신:

```
bg-ink text-paper
```

적용된 필터 칩: `bg-muted text-ink-soft ring-1 ring-line`

#### Status & Accents

| Token | 용도 |
|-------|------|
| `--success` / `--success-soft` | 완료·긍정 (**teal**, brand 레드와 분리 — Wave C) |
| `--leaf` | **DEPRECATED** → `--success` 별칭 (신규는 `text-success`) |
| `--warning` / `--warning-soft` | 주의 |
| `--error` / `--error-soft` | 삭제·위험·**폼/시트 에러 배너** (`bg-error-soft text-error`) — sunset-wash에 넣지 말 것 |
| `--info` / `--info-soft` | 정보 |
| `--sky` | 링크·지도·대중교통 |
| `--accent-*` | 테마/감정 칩 등 메타 (`--accent-mint`는 soft coral `#fca5a5`, sky, sunshine, coral, lavender) |

**상태 뱃지 (보관함「따라가는 중」):** `다녀옴` = `bg-muted text-ink ring-line` · `다듬는 중` = sunset-wash · `기록 중` = muted. 완료에 brand 레드를 쓰지 않는다.

**플래너 레드 예산:** 주 CTA(완료·따라가기 계열)만 `bg-sunset`. 섹션 칩·맵 모드·스텝퍼·시트 핸들·임시저장은 **ink/muted**. 지도 도보 라인은 brand가 아닌 slate (`TRANSPORT_COLOR.walk`).

#### Map / Route

| Token | 용도 |
|-------|------|
| `--plan-ink` | 계획 타임라인·leg 라인 (네이비) |
| `.rd-map` | 지도 stacking context + 다크 invert |

### 2.2 Radius

| Token | 값 | 용도 |
|-------|-----|------|
| `--radius-sm` | 8px | 작은 칩 |
| `--radius-md` | 12px | 입력·버튼 |
| `--radius-lg` | 16px | |
| `--radius-card` | 18px | **카드 기본** — 자동 `shadow-card` (@layer base) |
| `--radius-4xl` | 20px | 프로필 칩 등 |

카드: `rounded-[var(--radius-card)]` 또는 프로젝트 관례 `rounded-[18px]`

### 2.3 Shadow

| Token | 용도 |
|-------|------|
| `--shadow-card` | 카드 elevation (기본) |
| `--shadow-sm` / `--shadow-md` | 시트·플로ating |
| `--shadow-brand` | 레드 CTA glow |

Tailwind: `shadow-[var(--shadow-sm)]` 등

### 2.4 Typography

**Font:** Noto Sans KR (`layout.tsx`) — weights 400, 500, 700, 900  
**Fallback:** Apple SD Gothic Neo, Malgun Gothic, Noto Sans CJK KR  
**`adjustFontFallback: false`** — Android 한글 클리핑 방지 (건드리지 말 것)

| 스타일 | 클래스 | 용도 |
|--------|--------|------|
| Large title | `text-[28px] font-black tracking-[-0.01em]` | 탭 루트 (`LargeTitleHeader`) |
| Section compact | `text-[15px] font-bold` | sticky bar 제목 |
| Body | `text-[14px]` ~ `text-[15px]` | 본문 |
| Meta | `text-[12px]` ~ `text-[13px] text-ink-soft` | 날짜·부가 |
| Badge | `text-[9px]` ~ `text-[11px]` | 숫자 배지 (최소 크기) |

**한글 제목:** `tracking-tight` 대신 `tracking-[-0.01em]`  
**터치 입력:** `@media (pointer: coarse)` → inputs 16px (`globals.css`) — iOS 자동 확대 방지

### 2.5 Dark mode

- 토글: `<html class="dark">` — **OS 자동 아님** (`ThemeToggle`, localStorage `theme`)
- Tailwind `dark:`는 `@custom-variant dark (&:where(.dark, .dark *))` — class와 동기화
- 표면: neutral charcoal (`--paper: #121212`), 브랜드 레드는 더 밝게 (`#f87171`)
- 녹회색·그린 tint 없음 — 표면·잉크·success/leaf 모두 뉴트럴 + 브랜드 레드 계열

---

## 3. 레이아웃 & 프레임

### 3.1 MobileFrame

**파일:** `src/components/MobileFrame.tsx`

| Mode | 용도 |
|------|------|
| default | 상세·로그인 등 — 중앙 430px column |
| `shell` | 탭·뷰 페이지 — `h-lvh overflow-hidden`, **내부 스크롤** |
| `shell immersive` | 상세 히어로 — 노치 band = dark scrim (이미지 edge-to-edge) |

```
max-w-[430px]
safe-area: pt-[env(safe-area-inset-top)], pb-[max(16px,env(safe-area-inset-bottom))]
```

데스크톱 `shell`: 좌측 BrandRail + `lg:[transform]` → `fixed` 자손이 폰 프레임 기준으로 re-base

### 3.2 Z-index 스택 (대략)

| z | 레이어 |
|---|--------|
| 20 | sticky header, filter toolbar |
| 30 | BottomNav |
| 40 | 지도 conveyor pane |
| 50 | SlideDrawer (내 코스) |
| 60 | SlideDrawer (설정/프로필 overlay) |
| 70+ | ActionBottomSheet (portal → `#app-shell`) |

### 3.3 Spacing 관례

| 영역 | 값 |
|------|-----|
| Horizontal page padding | `px-3` ~ `px-4` |
| Header height | `h-[calc(env(safe-area-inset-top)+3.5rem)]` (56px + notch) |
| Sticky filter offset | `top-[calc(env(safe-area-inset-top)+3.5rem)]` |
| Main bottom inset (탭) | `pb-28` (floating nav clearance) |
| Card list gap | `space-y-4` (grid), `space-y-2.5` (compact plan rows) |

---

## 4. 컴포넌트 카탈로그

새 UI는 **아래 기존 컴포넌트를 먼저** 찾고, 없을 때만 추가한다.

### 4.1 Chrome & Navigation

| 컴포넌트 | 파일 | 언제 쓰나 |
|----------|------|-----------|
| `MobileFrame` | `MobileFrame.tsx` | 모든 페이지 래퍼 |
| `AppHeader` | `AppHeader.tsx` | 서브페이지 sticky bar (back/close/title) |
| `LargeTitleHeader` | `LargeTitleHeader.tsx` | 탭 루트 (보관함 등) — scroll collapse |
| `BottomNav` | `BottomNav.tsx` | 탭 3 + FAB — 수정 시 젤리·glass 규칙 유지 |
| `BackButton` | `BackButton.tsx` | history pop; `SlideOver` 안이면 slide-out |
| `GlassCircle` | `GlassCircle.tsx` | 헤더 아이콘 36pt chip — `tone="solid"|"hero"` |
| `NotificationBell` | `NotificationBell.tsx` | 알림 뱃지 |

**헤더 아이콘 규격 (iOS 26):** 터치 `h-11 w-11` (44pt) · visible chip `h-9 w-9` (36pt) · glyph ~20–24px

### 4.2 Overlays & Sheets

| 컴포넌트 | 파일 | 언제 쓰나 |
|----------|------|-----------|
| `SlideDrawer` | `SlideDrawer.tsx` | edge drawer (좌/우) — **320ms**, `SLIDE_DRAWER_MS` |
| `EdgeDrawer` | `EdgeDrawer.tsx` | routed drawer (`/feed`, `/profile`) |
| `SlideOver` | `SlideOver.tsx` | full-page push (`/u`, `/notifications`) |
| `ActionBottomSheet` | `ActionBottomSheet.tsx` | 확인·로그인 게이트·FAB 선택 |
| `BottomSheet` | `BottomSheet.tsx` | detent sheet (지도 peek) |
| `ChipSheet` / `MoodSheet` / `FeedFilterSheet` | 각 파일 | 메타·필터 선택 |

**Sheet primary CTA:** `bg-sunset text-white` (brand)  
**Sheet danger:** `bg-[var(--error)] text-white`

### 4.3 Input & Actions

| 컴포넌트 | 파일 | 언제 쓰나 |
|----------|------|-----------|
| `JellyButton` | `JellyButton.tsx` | 지도·floating — press 후 onClick |
| `SlidingSegments` | `SlidingSegments.tsx` | 2~3 탭 세그먼트 (보관함, 필터) |
| `SegPager` | `SegPager.tsx` | 스와이프 가능 탭 패널 |
| `FollowToggle` | `FollowToggle.tsx` | 팔로우 4-state |
| `AuthGate` | `AuthGate.tsx` | 게스트 → 로그인 시트 |

**Press feedback:** 전역 `scale(1.06)` on `:active` (`globals.css`); 젤리는 `.jelly` + `lib/jelly-tap`

### 4.4 Content

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| `RouteCard` / `FeedRouteCard` | | 피드·홈 카드 (4:5 cover) |
| `RouteCardSkeleton` | | loading |
| `PlanRouteRow` | | 계획 탭 compact row |
| `RoutePlanThumbnail` | | 계획 SVG 썸네일 — `preserveAspectRatio="xMidYMid slice"` |
| `PersonRow` / `PeopleList` | | 회원 목록 |
| `CollectionCard` | | 보관함 |

### 4.5 Skeleton

| 컴포넌트 | 용도 |
|----------|------|
| `DiaryDrawerSkeleton` | 내 코스 drawer deferBody |
| `ProfileDrawerSkeleton` | 설정 drawer |
| `PanelSkeleton` | SegPager placeholder |

---

## 5. 모션 & Easing

### 5.1 Duration 상수 (코드에서 import/복사)

| 이름 | ms | 출처 | 용도 |
|------|-----|------|------|
| `SLIDE_DRAWER_MS` | 320 | `SlideDrawer.tsx` | edge drawer |
| Slide easing | `cubic-bezier(0.22, 1, 0.36, 1)` | SlideDrawer | iOS-like decelerate |
| Nav blob spring | 580ms, `cubic-bezier(.34,1.62,.46,1)` | BottomNav | 탭 전환 젤리 |
| Map conveyor delay | 520 | FeedExplorer | nav settle 후 지도 slide |
| Map slide | 380 | FeedExplorer | |
| Route cover morph | 320 | `globals.css` | View Transition |
| SegPager snap | ~280 | SegPager | 세그먼트 스와이프 |
| Global press | 200ms spring | `globals.css` | `:active` scale |

### 5.2 전환 패턴

| 패턴 | 구현 |
|------|------|
| Card → detail | `ViewTransition` `share="route-cover-morph"` |
| Tab segment | `SlidingSegments` indicator `translateX` |
| Explore ↔ map | conveyor `translate-x` (URL `?mode=map`) |
| Drawer open | off-screen → 0, exit reverse (CSS transition) |
| Sheet | `useSheetTransition` — backdrop fade + slide up |

### 5.3 Reduced motion

- CSS: `@media (prefers-reduced-motion: reduce)` — animation none / instant snap
- JS: SegPager, BottomNav 등에서 `matchMedia` 체크 후 snap

---

## 6. 패턴별 레시피

### 6.1 새 sticky 헤더

```tsx
<header className="sticky top-0 z-20 flex h-[calc(env(safe-area-inset-top)+3.5rem)] items-center gap-2 bg-paper/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur">
```

히어로 위: `glass` BackButton + `GlassCircle tone="hero"`

### 6.2 필터/정렬 칩 (active)

```tsx
// active
className="bg-ink text-paper ..."
// idle
className="bg-muted text-ink-soft ..."
```

### 6.3 Primary CTA 버튼

```tsx
className="rounded-full bg-sunset px-5 py-3 text-[15px] font-semibold text-white shadow-[var(--shadow-brand)]"
```

### 6.4 카드

```tsx
className="overflow-hidden rounded-[var(--radius-card)] bg-card ring-1 ring-line/60"
// shadow-card는 radius-card @layer base에서 자동
```

### 6.5 새 edge overlay

`SlideDrawer` 재사용 — timing 상수 export (`SLIDE_DRAWER_MS`) 변경 시 전체 drawer에 반영됨.

---

## 7. 접근성

| 항목 | 규칙 |
|------|------|
| 터치 target | 최소 44×44pt (`h-11 w-11`) |
| Icon-only | `aria-label` 필수 |
| Sheet | `role="dialog"`, `aria-label` |
| Segment | `aria-pressed` on toggles |
| Focus inputs | 16px on coarse pointer |
| Pinch zoom | viewport `maximumScale` 제거 유지 |
| Reduced motion | 애니메이션 skip |

---

## 8. 하지 말 것

- ❌ 임의 hex — 토큰 없으면 `globals.css`에 추가 후 문서 갱신
- ❌ 필터 active에 `bg-sunset`(레드) — **ink neutral**이 표준  
- ❌ 에러 메시지를 `bg-sunset-wash`로 — **`bg-error-soft text-error`**
- ❌ 카드·지도 peek에서 전이 프루프 없을 때 ♥ 폴백 — 슬롯을 비우거나 추천/난이도만
- ❌ 브랜드를 다시 그린으로 하드코딩 — CTA/FAB/내비는 레드 토큰 (`--sunset` / `--brand-primary`)
- ❌ window scroll 가정 sticky — 탭은 **MobileFrame shell 내부 스크롤**
- ❌ body에 portal하는 sheet — `#app-shell` portal (`ActionBottomSheet` 패턴)
- ❌ `tracking-tight` on 한글 large title — `-0.01em` 사용
- ❌ intercept route로 soft drawer — 깜빡임; **client SlideDrawer** 패턴 (`FeedExplorer`)

---

## 9. 문서·코드 동기화

```
디자인 변경
  1. src/app/globals.css  (토큰·전역·키프레임)
  2. docs/DESIGN-SYSTEM.md  (이 파일 — 규칙·카탈로그)
  3. docs/HANDOFF.md §7     (버전·맥락·검증)
  4. 컴포넌트 JSDoc          (비표준 동작만)
```

Figma 파일 없음 — **스크린샷 + HANDOFF 작업 로그**가 변경 이력.

---

## 10. 관련 파일

| 파일 | 내용 |
|------|------|
| `src/app/globals.css` | 토큰·애니메이션·전역 press |
| `src/app/layout.tsx` | 폰트·theme init·viewport |
| `src/app/manifest.ts` | PWA `#ffffff` theme |
| `src/lib/jelly-tap.ts` | 젤리 press WAAPI |
| `src/lib/use-sheet-transition.ts` | sheet/drawer lifecycle |
| `docs/HANDOFF.md` | 버전별 UI 결정 이력 |
