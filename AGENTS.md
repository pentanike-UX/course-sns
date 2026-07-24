<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# course-sns 에이전트 필수 규칙

## 버전·작업 기록 (필수 — 예외 없음)

**사소한 수정 하나라도** 코드를 바꾸면 아래를 **같은 작업/PR에서 반드시** 수행한다. “문서만”, “한 줄”, “설정만”도 예외가 아니다.

1. **`APP_VERSION` 올리기** — 단일 출처: `src/lib/version.ts`
   - 버그·핫픽스·문서·설정·카피·작은 UI → **PATCH** (`v0.x.Y-mvp`, Y+1)
   - 기능 묶음·UX Wave → **MINOR** (`v0.X.0-mvp`)
   - 호환 깨지는 대형 전환만 **MAJOR**
2. **작업 내용 항시 기록** — `docs/HANDOFF.md` §7에 항목 추가
   - 버전 번호 · 무엇을/왜 · 주요 파일 · 검증 방법
3. **사용자용 이력** — `src/app/deliverables/changelog/page.tsx`에 해당 버전 섹션 추가
4. **표기 동기화** — 최소한 `README.md`의 현재 버전. 관련되면 DESIGN-SYSTEM / COURSE-UX / MVP-SETUP / UX-PERSONA 헤더·표도 맞춤
5. **커밋 완료 조건** — 버전·HANDOFF·changelog 없이 “기능만” 커밋·푸시하지 말 것

PR/머지 전 체크리스트: `version.ts` 변경됨 · HANDOFF §7 새 항목 · changelog 반영 · README 버전 일치.
