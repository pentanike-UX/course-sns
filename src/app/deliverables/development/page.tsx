import { Code, DocTable, H2, H3, Note, P, PageHeader, Ul, Warn } from "../_components/ui";
import { PROD_URL } from "../_components/nav";
import { APP_VERSION } from "@/lib/version";

export default function DevelopmentPage() {
  return (
    <>
      <PageHeader
        title="개발"
        description="로컬 실행, 환경변수, 배포, 테스트, 디자인 시스템 참조를 정리합니다."
      />

      <H2>빠른 시작</H2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-ink px-4 py-4 text-[12px] leading-relaxed text-paper">
{`pnpm install
cp .env.example .env.local   # Supabase·네이버 키
pnpm dev                     # http://localhost:3000
# 가이드: http://localhost:3000/deliverables`}
      </pre>

      <H2>환경변수</H2>
      <DocTable
        headers={["변수", "필수", "용도"]}
        rows={[
          ["NEXT_PUBLIC_SUPABASE_URL", "✅", "Supabase API URL"],
          ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "✅", "클라이언트·SSR anon"],
          ["SUPABASE_SERVICE_ROLE_KEY", "✅", "서명 URL·계정 삭제 (server-only)"],
          ["NEXT_PUBLIC_NAVER_MAP_KEY", "✅", "Maps JS ncpKeyId"],
          ["NAVER_MAP_CLIENT_SECRET", "✅", "Directions driving"],
          ["NAVER_SEARCH_CLIENT_ID/SECRET", "⬜", "장소 검색 (없으면 UI 숨김)"],
          ["TMAP_APP_KEY", "⬜", "보행 실도로"],
          ["NEXT_PUBLIC_SITE_URL", "⬜", "OG 절대 URL"],
          ["E2E_DEMO_EMAIL/PASSWORD", "⬜", "Playwright (기본 데모)"],
        ]}
      />

      <H2>데모 계정</H2>
      <P>
        <Code>demo@course-sns.app</Code> / <Code>demo1234</Code> — email_confirmed, 시드 코스
        포함.
      </P>
      <Warn>
        E2E는 읽기 전용입니다. 실제 DB에 쓰기 테스트를 하지 마세요. Google OAuth 실유저 데이터가
        있으면 정리 시 주의하세요.
      </Warn>

      <H2>배포</H2>
      <Ul>
        <li>
          프로덕션:{" "}
          <a href={PROD_URL} className="font-semibold text-sunset-ink hover:underline">
            {PROD_URL}
          </a>
        </li>
        <li>GitHub main push → Vercel 자동 배포</li>
        <li>필수 env: Supabase 3 + Naver 2</li>
        <li>현재 앱 버전: <Code>{APP_VERSION}</Code></li>
      </Ul>

      <H2>Supabase·지도 체크</H2>
      <Ul>
        <li>
          마이그레이션: <Code>supabase db push</Code> — 특히 <Code>0014</Code>
        </li>
        <li>Auth URL: Site URL + Redirect URLs</li>
        <li>Storage: <Code>route-photos</Code></li>
        <li>
          NCP Maps Web URL: <Code>localhost:3000</Code> + {PROD_URL}
        </li>
      </Ul>

      <H2>검증</H2>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-ink px-4 py-4 text-[12px] leading-relaxed text-paper">
{`pnpm lint          # ESLint (build는 lint 미실행)
pnpm build         # 프로덕션 빌드
pnpm test:e2e      # 스모크 — 읽기 전용`}
      </pre>
      <P>실기기: iOS Safari · Android Chrome에서 드로어·스와이프 감각 확인 권장.</P>

      <H2>디자인 시스템</H2>
      <P>
        정본: <Code>docs/DESIGN-SYSTEM.md</Code> · 토큰: <Code>src/app/globals.css</Code>
      </P>
      <Ul>
        <li>브랜드 레드 = CTA · FAB · 내비 active</li>
        <li>ink = 선택·필터 active</li>
        <li>success = teal · error ≠ brand (#b91c1c)</li>
        <li>동기화: globals.css → DESIGN-SYSTEM → HANDOFF §7</li>
      </Ul>

      <H2>브랜드 아이콘·메타</H2>
      <Ul>
        <li>
          마크 정본: <Code>public/icons/icon.svg</Code> (C + 레드 스트로크)
        </li>
        <li>
          앱 아이콘: <Code>icon-192.png</Code> · <Code>icon-512.png</Code> · apple-touch
        </li>
        <li>
          Favicon: <Code>src/app/favicon.ico</Code> (+ <Code>public/favicon.ico</Code>)
        </li>
        <li>
          OG/Twitter: <Code>src/app/opengraph-image.png</Code> ·{" "}
          <Code>twitter-image.png</Code>
        </li>
      </Ul>
      <Note>
        아이콘을 바꾸면 SVG를 수정한 뒤 PNG·ICO·OG를 다시 생성하고, 스플래시·레일·가이드 헤더가
        같은 파일을 쓰는지 확인하세요.
      </Note>

      <H2>알려진 함정</H2>
      <Ul>
        <li>PostgREST 임베드 FK 힌트 누락 → 쿼리 실패</li>
        <li>드로어 slide 스택 리라이트 금지</li>
        <li>좋아요를 북스타 KPI로 쓰지 말 것</li>
        <li>브랜드를 그린/보라 테마로 되돌리지 말 것</li>
      </Ul>

      <H3>관련 저장소 문서</H3>
      <Ul>
        <li>
          <Code>docs/MVP-SETUP.md</Code> — 인프라 체크리스트
        </li>
        <li>
          <Code>docs/HANDOFF.md</Code> — IA·함정·작업 로그
        </li>
        <li>
          <Code>docs/COURSE-UX-DESIGN.md</Code> — UX Phase·Wave
        </li>
      </Ul>
    </>
  );
}
