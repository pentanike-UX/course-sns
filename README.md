# 코스 (course-sns)

코스를 **기록하고 공유**하는 모바일 우선 SNS. routdiary 코드베이스 MVP fork.

- **GitHub**: [pentanike-UX/course-sns](https://github.com/pentanike-UX/course-sns)
- **프로덕션**: https://course-sns.vercel.app
- **Supabase**: `pbyxnvtgsrwmsvxnynif` (routdiary와 분리)
- **현재 버전**: `v0.3.0-mvp` (`src/lib/version.ts`)
- **개발·운영 가이드**: https://course-sns.vercel.app/deliverables (로컬 `/deliverables`)
- **배포·인프라 체크리스트**: [`docs/MVP-SETUP.md`](docs/MVP-SETUP.md)
- **상세 인수인계·IA·함정**: [`docs/HANDOFF.md`](docs/HANDOFF.md)

## 기술 스택

Next.js 16 (App Router) · React 19 · Tailwind 4 · TypeScript · Supabase · Naver Maps · pnpm

## 빠른 시작

```bash
cd ~/Documents/course-sns
pnpm install
cp .env.example .env.local   # 새 Supabase 프로젝트 값 채우기 — MVP-SETUP.md 참고
pnpm dev                     # http://localhost:3000
```

## 검증

```bash
pnpm lint
pnpm build
pnpm test:e2e    # Playwright 스모크 (데모 계정, 읽기 전용)
```

## 문서

| 위치 | 내용 |
|------|------|
| [`/deliverables`](https://course-sns.vercel.app/deliverables) | **공식 개발·운영 가이드** (기획·화면·DB·API·현황·이력) |
| [`docs/MVP-SETUP.md`](docs/MVP-SETUP.md) | Supabase migration, Vercel env, 네이버 Maps URL 등록 |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | 제품 IA, Supabase/OAuth, 완료·TODO, 함정 |
| [`docs/COURSE-UX-DESIGN.md`](docs/COURSE-UX-DESIGN.md) | 코스 포지션·페르소나 UX 적용 설계 (Phase 0–3) |
| [`docs/UX-PERSONA-PAINPOINTS.md`](docs/UX-PERSONA-PAINPOINTS.md) | 페르소나 재채점·잔여 페인포인트·Wave E |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | UI 스타일 가이드 |
| [`.env.example`](.env.example) | 환경변수 템플릿 |

**브랜드 아이콘:** `public/icons/icon.svg` (정본) → PNG/apple-touch · `src/app/favicon.ico` · OG/Twitter `src/app/opengraph-image.png`

## 원본

[routdiary](https://github.com/pentanike-UX/routdiary) — 여행 루트 일기 SNS (별도 Supabase·Vercel·도메인)
