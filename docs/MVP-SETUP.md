# course-sns MVP 배포 체크리스트

> **course-sns**는 [routdiary](https://github.com/pentanike-UX/routdiary) v1.14.21을 복제한 MVP fork입니다.  
> DB 스키마·URL(`/routes`)·컴포넌트명은 그대로 두고, Supabase / Vercel / 도메인 / 브랜딩만 분리합니다.

## 1. Supabase ✅ (완료)

- 프로젝트: **course-sns** · ref `pbyxnvtgsrwmsvxnynif` · 리전 `ap-northeast-2`
- migration `0001`–`0009` 적용 완료 (`supabase db push`)

수동 확인:
   - Site URL: `https://YOUR-VERCEL-DOMAIN.vercel.app` (배포 후 확정)
   - Redirect URLs: `https://YOUR-VERCEL-DOMAIN.vercel.app/**`, `http://localhost:3000/**`

5. **Google OAuth** (선택, routdiary와 동일 패턴)
   - Google Cloud Console → 승인된 리디렉션 URI에 `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` 추가
   - Supabase → Auth → Providers → Google 활성화

6. **Storage**: migration에 bucket 정책 포함. `route-photos` bucket 생성 여부 확인

7. **데모 계정** (E2E용, 선택): Auth에서 `demo@course-sns.app` / `demo1234` 생성 후 시드 데이터 삽입

## 2. 로컬 `.env.local`

`.env.example`을 복사해 새 Supabase·네이버 키를 채웁니다.

```bash
cp .env.example .env.local
```

| 변수 | 필수 | 출처 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://pbyxnvtgsrwmsvxnynif.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 동일 (server-only, 노출 금지) |
| `NEXT_PUBLIC_NAVER_MAP_KEY` | ✅ | NCP Maps Client ID |
| `NAVER_MAP_CLIENT_SECRET` | ✅ | NCP Maps Client Secret |
| `NAVER_SEARCH_CLIENT_ID/SECRET` | ⬜ | 네이버 검색 OpenAPI (없으면 장소 검색 UI 숨김) |
| `TMAP_APP_KEY` | ⬜ | 보행 경로 (없으면 driving fallback) |
| `NEXT_PUBLIC_SITE_URL` | ⬜ | 프로덕션 OG URL (Vercel 도메인) |
| `E2E_DEMO_EMAIL/PASSWORD` | ⬜ | E2E 데모 계정 (기본값 `.env.example` 참고) |

## 3. Vercel (새 프로젝트)

1. [Vercel Dashboard](https://vercel.com) → **Add New Project**
2. GitHub `pentanike-UX/course-sns` 연결
3. Framework: **Next.js**, Build: `pnpm build`, Install: `pnpm install`
4. **Environment Variables**: 위 `.env.local`과 동일 키를 Production·Preview·Development에 등록
5. 배포 후 **Supabase Site URL / Redirect URLs**를 실제 Vercel URL로 갱신

## 4. 네이버 Maps / Search URL 등록

[NCP Console](https://console.ncloud.com) → AI·NAVER API → Application:

| 서비스 | 등록 URL |
|--------|----------|
| Maps (Web) | `http://localhost:3000`, `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| Search (선택) | 동일 |

> Preview 배포 URL은 매번 달라지므로, 프리뷰에서 지도 테스트 시 해당 URL을 추가하거나 Production만 등록합니다.

## 5. 로컬 검증

```bash
pnpm install
pnpm lint
pnpm build
pnpm test:e2e   # .env.local + 데모 계정·공개 루트 시드 필요
```

## 6. 배포 URL 확인

- Vercel 프로젝트 → **Deployments** → Production URL
- 또는 `vercel ls` / GitHub Actions 배포 상태
- 앱 스플래시·로그인 화면에 **코스** 브랜드, 버전 `v0.1.0-mvp` 표시 확인

## routdiary와 공유하지 않는 것

- Supabase 프로젝트 (DB·Auth·Storage 완전 분리)
- Vercel 프로젝트·도메인
- `.env.local` / Vercel env (키 재사용 가능하나 **Supabase URL·키는 반드시 새 프로젝트**)

## 나중에 (MVP 이후)

- `routes` → `courses` URL·DB rename
- monorepo / 공통 패키지
- routdiary 전용 카피·기능 분리
