import { Code, DocTable, H2, Note, P, PageHeader, Ul } from "../_components/ui";

export default function ArchitecturePage() {
  return (
    <>
      <PageHeader
        title="아키텍처"
        description="Next.js · Supabase · 네이버 지도로 구성된 기술 구조와 핵심 설계 결정을 정리합니다."
      />

      <H2>스택</H2>
      <DocTable
        headers={["계층", "기술"]}
        rows={[
          ["앱", "Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · pnpm"],
          ["백엔드", "Supabase (Postgres · Auth · Storage · RLS)"],
          ["지도", "네이버 Maps JS v3 · Directions · (선택) TMAP 보행"],
          ["배포", "Vercel Production — course-sns.vercel.app"],
          ["품질", "ESLint · Playwright 스모크 (읽기 전용)"],
        ]}
      />

      <H2>앱 구조</H2>
      <Ul>
        <li>
          <Code>src/app/(tabs)/</Code> — 홈·보관함·프로필 셸 + <Code>MobileFrame</Code> +{" "}
          <Code>BottomNav</Code>
        </li>
        <li>
          <Code>src/app/routes/</Code> — 상세·작성·수정 (상세는 immersive 셸)
        </li>
        <li>
          <Code>src/proxy.ts</Code> — Next 16 세션·보호 라우트 (구 middleware)
        </li>
        <li>
          <Code>src/lib/data.ts</Code> — 서버 데이터 접근 정본
        </li>
        <li>
          <Code>src/components/</Code> — 공용 UI (드로어·시트·카드·AuthGate)
        </li>
      </Ul>

      <H2>핵심 설계 결정</H2>
      <DocTable
        headers={["결정", "이유"]}
        rows={[
          ["게스트 열람 + AuthGate", "둘러보기 장벽↓, 쓰기만 로그인"],
          ["전이 > 좋아요 위계", "북스타 루프를 UI로 가르침"],
          ["드로어 클라 스택", "soft nav 깜빡임·애니메이션 자산 보호"],
          ["MobileFrame shell", "모바일 우선 + PC 브랜드 레일"],
          ["routdiary fork 분리", "DB/Vercel/도메인 완전 분리, URL명 routes 유지"],
          ["토큰 = globals.css", "디자인 변경 시 CSS → DESIGN-SYSTEM → HANDOFF §7"],
        ]}
      />

      <H2>인증·세션</H2>
      <P>
        Supabase Auth (이메일 + Google OAuth). SSR 세션은{" "}
        <Code>updateSession</Code>이 proxy에서 갱신. 클라이언트 쓰기는{" "}
        <Code>AuthGateProvider</Code>가 가로챕니다.
      </P>

      <H2>미디어</H2>
      <P>
        Storage 버킷 <Code>route-photos</Code>. 업로드는 서명 URL → 클라이언트 PUT.{" "}
        <Code>next.config</Code> remotePatterns에 Supabase 호스트 등록.
      </P>

      <Note>
        함정: PostgREST FK 힌트 필수(spots/legs 임베드), <Code>useSearchParams</Code>는 Suspense,
        build는 lint를 돌리지 않음 → 검증 시 <Code>pnpm lint</Code> 별도.
      </Note>
    </>
  );
}
