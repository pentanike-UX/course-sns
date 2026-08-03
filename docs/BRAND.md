# Coursee Brand Guide (BI · BX)

> 최종 업데이트: 2026-08-03 · course-sns MVP · 웹 가이드: `/deliverables/brand`  
> 시각 토큰·UI 규칙은 [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) · UX 루프는 [`COURSE-UX-DESIGN.md`](COURSE-UX-DESIGN.md)

이 문서는 **브랜드 아이덴티티(BI)** 와 **브랜드 경험(BX)** 의 정본입니다.  
로고 파일·파비콘·OG 경로는 개발 가이드 `/deliverables/development` 와 동기화합니다.

---

## 0. 문서 역할 (어떻게 쓸지)

| 층 | 질문 | 이 문서에서의 위치 | 연계 |
|----|------|-------------------|------|
| **BI Identity** | 우리는 누구인가? | §1 개요 · §2 메시지 · §3 철학 · §4 포지셔닝 | 기획 카피·온보딩 |
| **BI Visual** | 어떻게 보이는가? | §5 로고 시스템 | `public/icons/*`, Design System 컬러 |
| **BX Touchpoints** | 어디에서 느껴지는가? | §6 앱 경험 지점 | 스플래시·헤더·레일·OG |
| **Rules** | 무엇을 지키나? | §7 Do / Don’t | 에이전트·디자인 검수 |

표준 BI 가이드(개요→메시지→철학→포지셔닝→로고)에 **BX 터치포인트**를 붙여, 앱 제품 가이드(`/deliverables`) 안에서 한 번에 읽히게 구성합니다.

---

## 1. 브랜드 개요

| 항목 | 내용 |
|------|------|
| **브랜드명** | Coursee |
| **워드마크** | `coursee` (소문자 고정) |
| **발음** | 코르시 |
| **표기** | 번역하지 않음. UI·문서·마케팅에서 **Coursee / coursee** 유지 |
| **어원** | **Cours + See** |
| | **Course** — 목적·성취·변화에 이르는 *과정* |
| | **See** — 타인의 과정을 보고, 발견하고, 이해하는 *경험* |

### 브랜드 정의

목적지만 보여주는 기존 SNS와 달리, **목적지에 이르는 과정**을 기록·공유하는 소셜 플랫폼.  
결과 한 컷이 아니라 **단계·변화·실패·우회**를 하나의 연결된 이야기로 보여 준다.

제품 도메인 언어(코스·스팟·따라가기)와의 관계:

- **브랜드명** = Coursee (서비스·앱 아이덴티티)
- **콘텐츠 단위** = 코스 (따라갈 수 있는 동선 기록) — UI 카피에 유지

---

## 2. 브랜드 메시지

| 구분 | 영문 | 한국어 해석 (내부용) |
|------|------|---------------------|
| **Brand Message** | Share your course. See how others get there. | 내 과정을 나누고, 타인이 어떻게 도착했는지 본다 |
| **Tagline** | See how they got there. | 그들이 어떻게 도착했는지 보라 |
| **Brand Statement** | Every destination has a course. | 모든 목적지에는 과정이 있다 |
| **Campaign** | Don’t just see the result. See the course. | 결과만 보지 말고, 과정을 보라 |

카피 우선순위: 마케팅·OG·온보딩에는 Tagline / Statement를 쓰고, 제품 UI는 짧은 행동 언어(따라가기·다녀왔어요)를 우선한다.

---

## 3. 브랜드 철학

| 기존 SNS가 보여주는 것 | Coursee가 보여주는 것 |
|------------------------|----------------------|
| 완성된 결과 | 시작한 이유 |
| 성공한 순간 | 거친 단계 |
| 골라낸 한 장면 | 시행착오·변화 |
| 지금 상태 | 현재 진행 |
| 반응·인기 | 결과에 이른 *방법* |

**핵심 가치:** 목적지와 시간축을 기준으로, 흩어진 경험을 **하나의 과정**으로 연결한다.

---

## 4. 브랜드 포지셔닝

| 항목 | 내용 |
|------|------|
| **카테고리** | ① Journey-based social platform ② 현실 과정의 소셜 플랫폼 |
| **주의** | “Journey/여행”만 강조하면 여행 앱과 혼동 → **course · steps · progress**를 함께 쓴다 |
| **Positioning** | Coursee is a social platform where people document, share, and follow the real steps behind every destination, achievement, and change. |
| **차별점** | 목표에 이르는 *실제 과정*을 구조화해 공유하는 과정 지향 소셜 |

---

## 5. 로고 시스템

### 5.1 구성

| 요소 | 파일 | 용도 |
|------|------|------|
| **심볼 (Mark)** | `logo-mark-light.svg` / `logo-mark-dark.svg` | favicon, PWA, 스플래시 마크, 가이드 아이콘 |
| **풀 락업** | `logo-full-light.svg` / `logo-full-dark.svg` | 헤더, 로그인, 데스크톱 레일, OG |
| **래스터** | `icon-192/512.png`, `favicon.png`, `opengraph-image.png` | `node scripts/build-brand-assets.mjs` |

라이트: 그레이 원 + 블랙 C·워드마크 · 다크: 화이트 원·워드마크.  
컴포넌트: `BrandMark` · `BrandLockup` (`src/components/BrandMark.tsx`).

### 5.2 심볼 의미 (설계 의도)

심볼은 세 레이어로 읽는다.

1. **열린 C (Open C)**  
   - Course의 C. 아직 닫히지 않은 과정, 새 방향으로 열린 가능성.  
   - *The open C represents a course still being shaped.*

2. **빨간 이동점 (Red moving point)**  
   - 사람 · 현재 위치 · 다음 한 걸음 · 목적지를 향한 진행.  
   - *The moving point represents every step toward what comes next.*  
   - 컬러 정본: `#FF0000` (브랜드 포인트). 앱 CTA 레드와 계열을 맞춤.

3. **연한 잔상 (Light afterimage)**  
   - 이미 지난 걸음, 기록된 과정, 시간의 축적.  
   - 모션 도트 트레일(`#FF756D` → `#FFC8C5`)로 표현.

### 5.3 사용 규칙 (요약)

- 심볼만: 작은 면(favicon·탭·아바타형 슬롯).  
- 풀 락업: 브랜드가 주인공인 면(스플래시·로그인·OG·레일).  
- 워드마크 글자를 임의 폰트로 다시 치지 말 것 — SVG 락업 사용.  
- 배경 대비: 라이트 면→ light 락업, 다크/블랙 면→ dark 락업.  
- 심볼 비율·여백을 찌그러뜨리거나 재채색하지 말 것 (잔상·이동점 색 고정).

---

## 6. BX — 앱에서의 브랜드 경험

| 터치포인트 | 경험 의도 | 구현 |
|------------|-----------|------|
| 첫 스플래시 | “과정 SNS” 진입 순간 — 다크 락업 | `AppSplash` + `BrandLockup theme="dark"` |
| 헤더 | 일상 탐색 중 브랜드 앵커 | `BrandWordmark` / 락업 |
| 로그인 | 신뢰·시작 — 라이트 락업 | `/login` |
| PC 브랜드 레일 | 데스크톱에서 브랜드 서사 | `MobileFrame` BrandRail |
| favicon / PWA | 탭·홈 화면에서 심볼 인지 | `favicon.png`, `icon-*` |
| OG / Twitter | 링크 공유 시 Tagline 세계관 | dark 락업 on black |
| 카피·빈 상태 | Statement/철학과 충돌하지 않는 행동 언어 | 「결과」보다 「과정·따라가기」 |

---

## 7. Do / Don’t

**Do**

- 브랜드명 Coursee, 워드마크 `coursee` 소문자 유지  
- 심볼 = 열린 과정 + 이동점 + 잔상 의미 유지  
- 라이트/다크 공식 SVG만 사용  
- 제품 언어「코스」와 브랜드명 Coursee를 층위로 구분

**Don’t**

- 그린/보라 등 타 테마로 리브랜드  
- 이동점·잔상을 장식용 점으로만 쓰고 의미를 무시  
- “여행 앱”으로만 포지셔닝 (course/steps/progress 병기)  
- 결과·좋아요 중심 카피로 철학과 충돌

---

## 8. 변경 시 체크리스트

1. SVG 정본 수정 → `node scripts/build-brand-assets.mjs`  
2. 스플래시·헤더·로그인·레일·가이드 헤더 동일 에셋 확인  
3. `APP_VERSION` · HANDOFF §7 · `/deliverables/changelog` · 이 문서 날짜 갱신  
4. Design System의 브랜드 레드 토큰과 이동점 `#FF0000` 계열 정합 확인  
