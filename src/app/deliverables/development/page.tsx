import Link from "next/link";
import { Code, DocTable, H2, H3, Note, P, PageHeader, Ul, Warn } from "../_components/ui";
import { PROD_URL } from "../_components/nav";
import { APP_VERSION } from "@/lib/version";

export default function DevelopmentPage() {
  return (
    <>
      <PageHeader
        title="개발"
        description="로컬 실행, 환경변수, 배포, 테스트, 지도 경로(도보·대중교통), 디자인 시스템 참조를 정리합니다."
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
          ["TMAP_APP_KEY", "⬜", "보행 실도로. 없으면 도보 선이 자동차 도로로 폴백"],
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
        <li>
          도보 지도 선: <Code>TMAP_APP_KEY</Code>가 없으면 자동차 도로로 그려짐 — 아래 「스팟
          이동 경로」
        </li>
      </Ul>

      <H2>스팟 이동 경로 (지도)</H2>
      <P>
        조사일 2026-08-19. <strong className="font-semibold text-ink">구현하지 않음.</strong>{" "}
        정본 마크다운: <Code>docs/MAP-ROUTING.md</Code>.
      </P>
      <P>
        타일은 네이버 Maps JS v3를 유지한다. 레그에서 도보를 골라도 지도 선이 자동차 도로를 따르는
        이유는, 네이버 Directions가 <strong className="font-semibold text-ink">자동차 길찾기만</strong>{" "}
        주기 때문이다. 도보·자전거·지하철 API는 없다.
      </P>
      <Warn>
        코드는 도보·자전거를 TMAP 보행 API로 받도록 이미 분기돼 있다 (
        <Code>getWalkingPath</Code>). 키가 없으면 네이버 driving으로 폴백한다. 운영{" "}
        <Code>TMAP_APP_KEY</Code>는 아직 비어 있어, 도보를 눌러도 차도가 그려진다.
      </Warn>
      <H3>지금 코드가 그리는 선</H3>
      <DocTable
        headers={["수단", "지금 동작"]}
        rows={[
          ["자가용·택시", "네이버 Directions driving"],
          ["버스·기차", "마찬가지로 driving (도로). 노선이 아님"],
          ["도보·자전거", "TMAP 보행 → 키 없으면 driving 폴백"],
          ["지하철", "경로 API 없음. 점선 커넥터"],
        ]}
      />
      <H3>수단별 길을 이을 수 있는지</H3>
      <P>
        타일=네이버, 선만 다른 API 좌표(WGS84)를 올리는 방식은 가능하다. 이미{" "}
        <Code>RouteMap</Code>이 그 구조다.
      </P>
      <DocTable
        headers={["수단", "네이버", "TMAP 공개", "그 외"]}
        rows={[
          ["도보", "불가", "가능. 코드 있음", "카카오 도보 API는 제휴"],
          ["자전거", "불가", "전용 라우터 없음. 보행 근사", "카카오 자전거는 제휴"],
          ["자가용·택시", "가능 (현재)", "가능", "바꿀 이득 적음"],
          ["버스·지하철·기차", "불가", "Transit API", "ODsay 길찾기+노선 그래픽. 카카오는 제휴"],
        ]}
      />
      <P>
        대중교통은 점과 점을 한 줄로 잇는 게 아니라 걸어가기 → 탑승 → 환승 → 걷기다.
      </P>
      <H3>가능한 방향 (다음 구현 시)</H3>
      <DocTable
        headers={["안", "내용", "맞추는 증상"]}
        rows={[
          [
            "A",
            "Vercel에 TMAP_APP_KEY만 넣기. getWalkingPath가 이미 있음",
            "도보=차도. 최소",
          ],
          [
            "B",
            "TMAP 보행 + TMAP Transit. 공급자 하나. 자전거는 보행 근사",
            "도보 + 버스·지하철·기차",
          ],
          [
            "C",
            "TMAP 보행 + ODsay(searchPubTransPathT · loadLane). 네이버 위에 노선 그리기 예시가 공식 가이드에 있음",
            "지하철·버스 실제 노선 모양",
          ],
          ["D", "카카오 모빌리티 제휴 (도보·자전거·대중교통 세트)", "자전거 전용 도로까지"],
          [
            "E",
            "키를 안 넣을 거면 지하철·기차는 점선 커넥터가 정직. 기차 driving이 더 어색함",
            "가짜 차도 제거",
          ],
        ]}
      />
      <Note>
        하지 않는 편: 지도 엔진을 카카오로 교체, 구글 길찾기, 네이버에 도보 API가 생기길 기다리기.
        우선순위는 지금 증상 → <strong className="font-semibold text-ink">A</strong>,
        노선까지 → <strong className="font-semibold text-ink">B 또는 C</strong>.
      </Note>

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
      <P>
        BI·메시지·심볼 의미는{" "}
        <Link href="/deliverables/brand" className="font-semibold text-sunset-ink hover:underline">
          브랜드 (BI · BX)
        </Link>
        · 저장소 <Code>docs/BRAND.md</Code>가 정본입니다. 아래는 구현·빌드 경로입니다.
      </P>
      <Ul>
        <li>
          마크 정본: <Code>public/icons/logo-mark-*.svg</Code> · <Code>icon.svg</Code> (열린 C +
          이동점 + 잔상)
        </li>
        <li>
          앱 아이콘(심볼): <Code>logo-mark-*.svg</Code> → <Code>icon-192/512.png</Code> ·
          풀 로고 <Code>logo-full-light/dark.svg</Code>
        </li>
        <li>
          Favicon: <Code>public/favicon.png</Code> · <Code>src/app/icon.png</Code> ·{" "}
          <Code>public/icons/icon.svg</Code>
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
        <li>
          <Code>TMAP_APP_KEY</Code> 없으면 도보 레그가 자동차 도로로 그려짐 (
          <Code>docs/MAP-ROUTING.md</Code>)
        </li>
        <li>PostgREST 임베드 FK 힌트 누락 → 쿼리 실패</li>
        <li>드로어 slide 스택 리라이트 금지</li>
        <li>좋아요를 북스타 KPI로 쓰지 말 것</li>
        <li>브랜드를 그린/보라 테마로 되돌리지 말 것</li>
      </Ul>

      <H3>관련 저장소 문서</H3>
      <Ul>
        <li>
          <Code>docs/BRAND.md</Code> — BI·BX·로고 (
          <Link href="/deliverables/brand" className="font-semibold text-sunset-ink hover:underline">
            웹 가이드
          </Link>
          )
        </li>
        <li>
          <Code>docs/MVP-SETUP.md</Code> — 인프라 체크리스트
        </li>
        <li>
          <Code>docs/HANDOFF.md</Code> — IA·함정·작업 로그
        </li>
        <li>
          <Code>docs/COURSE-UX-DESIGN.md</Code> — UX Phase·Wave
        </li>
        <li>
          <Code>docs/PHOTO-FIRST-CREATE.md</Code> — 기록 작성 photo-first 4화면 (Wave G)
        </li>
        <li>
          <Code>docs/MAP-ROUTING.md</Code> — 스팟 이동 경로(도보·대중교통) 조사
        </li>
      </Ul>
    </>
  );
}
