# UX · UI · GUI 검수 (2026-08-12)

페르소나 시나리오 · `COURSE-UX-DESIGN` · 프론트 디자인 규칙 기준으로 HOME/MAP/DET/CREATE/AUTH/LIBRARY/PROFILE/NOTIF를 검수하고, P0·P1 핫픽스를 **v0.3.21-mvp**에 반영했다.

## 이미 양호

- 전이(따라감/다녀옴) > 좋아요 프루프, 콜드「첫 따라가기」, SpecLine 패리티
- 보관함「구독 코스」IA, AuthGate 따라가기 카피, create→detail `replace`
- 알림 transfer/social 분리

## 이번 핫픽스 (P0 / P1)

| 이슈 | 조치 |
|------|------|
| 지도 peek이 검색 헤더를 가림 | `peekPx` 74→108 · BottomSheet 헤더 패딩 밀집 |
| 게스트 브랜드 약함 | 홈·loading `BrandWordmark` 30→38 |
| 지도 선택 카드 primary가「상세 보기」 | primary「따라가기」+ secondary「상세」 |
| ♥ AuthGate가 저장 카피 재사용 | `LIKE_AUTH` 분리 |
| FollowToggle「팔로잉」vs 구독 IA |「팔로우 중」· following 페이지 타이틀 동기 |
| FollowProgressBar 미완주「후기」어휘 |「원본에서 다녀왔어요」 |
| FollowingRail 빈 CTA `bg-ink` | `bg-sunset` |
| 내 책장 빈 상태 CTA 오착지 | `isMe` →「코스 만들기」· 팔로우 중 스탯 링크 |

## 잔여 (P2 · 후속)

- 작성/수정 X 이탈 시 dirty confirm
- 정렬 칩 밀도·게스트 브랜드 추가 강화
- 지도 핀 토큰 `#ef4444` vs brand sunset 정합
- 디바이스 실기기 QA (ops)

## 검증

- `pnpm lint` · `pnpm build`
- 수동: `/?mode=map` 핀 탭 →「따라가기」sunset · 게스트 ♥ 카피 · 프로필「팔로우 중」
