# UX · UI · GUI 전체화면 재검수 (2026-08-12)

v0.3.22 이후 잔여·신규 이슈를 전 화면 기준으로 재검수하고 **v0.3.23-mvp**에 반영했다.  
이전: [`UX-UI-GUI-AUDIT-FULL-FLOW-2026-08.md`](UX-UI-GUI-AUDIT-FULL-FLOW-2026-08.md).

## 이번 핫픽스

| ID | 이슈 | 조치 |
|----|------|------|
| CREATE-back | 시스템/제스처 뒤로가기 시 dirty 무시 | `history` 가드 + confirm |
| AUTH-settings | 설정 로그인 후 드로어 미재개 | `?settings=1` → openProfile |
| DET-order | 후기/댓글이 작성자 뒤 | `socialProofSlot` before author |
| DET-hero | 히어로 theme/mood 칩 | 히어로 제거 →「코스 정보」 |
| HOME-sort | 정렬 칩 밀도 |「따라간」「다녀온」+ 작은 칩 |
| HOME-empty | 검색/콜드 empty CTA | sunset「검색 지우기」「코스 만들기」 |
| MAP-empty | 지도 시트 빈 상태 |「목록으로 보기」 |
| AUTH-copy | 댓글/완주 AuthGate 제네릭 | 전이 카피 통일 |
| PROFILE-edit | 프로필 편집 dirty | confirm on X |
| BRAND-guest | 게스트 브랜드 약함 | 워드마크 아래 한 줄 루프 |
| DOC-IA | screens「팔로잉」 |「팔로우 중」 |
| MAP-sheet | 상세 시트 칩 상단 | 스팟 아래로 demote |

## 잔여 P2

- 실기기 peek/safe-area QA
- 검색 오버레이 empty CTA
- 주석/히스토리 문서의「팔로잉」표기(제품 UI 아님)

## 검증

- `pnpm lint` · `pnpm build`
- 수동: 작성 중 OS back → confirm · `/?settings=1` 로그인 후 설정 · DET 후기→작성자 · 정렬 칩 밀도
