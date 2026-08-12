# UX · UI · GUI 전체 화면·플로우 검수 (2026-08-12)

페르소나 시나리오 · `COURSE-UX-DESIGN` · 프론트 디자인 규칙 기준으로 **전 화면·핵심 플로우**를 재검수하고, P0·P1 핫픽스를 **v0.3.22-mvp**에 반영했다.  
이전 라운드: [`UX-UI-GUI-AUDIT-2026-08.md`](UX-UI-GUI-AUDIT-2026-08.md) (v0.3.21).

## 검수 범위 (플로우)

| 플로우 | 화면 |
|--------|------|
| 발견 | HOME `/` · MAP `/?mode=map` · 필터/검색 |
| 따라가기 | 지도 peek/상세 시트 · DET `/routes/[id]` · AuthGate |
| 보관·완주 | LIBRARY · FollowProgressBar · Complete |
| 작성 | FAB → CREATE/EDIT · 공개 게이트 · dirty 이탈 |
| 인증 | `/login` · OAuth callback · 설정 AuthGate |
| 소셜 | PROFILE `/u` · 팔로우 · NOTIF · 구독 레일 |

## 이미 양호 (v0.3.21 포함)

- 전이 > 좋아요 ·「첫 따라가기」· SpecLine ·「구독 코스」IA
- 지도 선택 카드 primary「따라가기」· LIKE_AUTH 분리 ·「팔로우 중」
- create→detail `replace` · OAuth history replace · FollowProgressBar 실데이터

## 이번 핫픽스 (v0.3.22)

| ID | 이슈 | 조치 |
|----|------|------|
| AUTH-01/03 | OAuth 실패·로그인 좌초 | `error=auth` 알림 ·「로그인 없이 둘러보기」 |
| CREATE-01/03 | 작성/수정 X 즉시 이탈 | dirty confirm (플래너와 동일 패턴) |
| MAP-05 | 지도 상세 시트 CTA 매장 | 메타 직후 `CopyRouteButton` |
| DET-scroll | 상세 스크롤 ≠ §2.3 | proof → CTA → summary · H2「스팟 동선」 |
| MAP-04 | 필터 칩 + peek 클립 | `peekPx` 148 when filters · 칩 `bg-sunset` |
| MAP-kind | 지도에서 kinds 숨김 | `showKind` 지도도 노출 |
| AUTH-02 | 설정 AuthGate 제네릭 | 설정 전용 카피 |
| CREATE-02 | 세션 만료 `redirect(/login)` | `?next=` 보존 |
| LIB-CTA | 저장 카드 따라가기 outline | `primary` sunset |
| COPY | 「여행자」잔상 |「메이커」/「나」· 닉네임 placeholder |
| HOME-rail | 빈 레일 `href="/"` noop | primary「메이커 찾아보기」 |
| NOTIF | 빈 알림 CTA 없음 | sunset「코스 둘러보기」 |
| MAP-pin | `#ef4444` vs brand | `#dc2626` (--sunset) |

## 잔여 (P2 · 후속)

- 로그인 후 설정 드로어 자동 재오픈 (`?settings=1` 등)
- 정렬 칩 밀도 · 게스트 브랜드 추가 강화
- 히어로 theme/mood 칩 demote · 댓글/완주 블록 위치
- 실기기 QA · ops (HANDOFF §4)

## 검증

- `pnpm lint` · `pnpm build`
- 수동: `/login?error=auth` · 작성 X dirty · 지도 상세 CTA 상단 · DET proof→CTA · 저장 카드 따라가기 sunset
