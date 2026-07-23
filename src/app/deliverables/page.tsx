import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import {
  Code,
  DocCard,
  DocTable,
  H2,
  Note,
  P,
  PageHeader,
  StatusPill,
  Ul,
} from "./_components/ui";
import { PROD_URL } from "./_components/nav";

export default function DeliverablesHomePage() {
  return (
    <>
      <PageHeader
        title="코스 개발 가이드"
        description="이 문서는 코스(course-sns)의 공식 개발·운영 가이드입니다. 기획·운영은 서비스가 무엇인지·어디까지 완성됐는지 파악하고, 개발은 같은 맥락 위에서 정석대로 이어서 작업할 수 있도록 제품 정의와 기술 명세를 한곳에 모았습니다."
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span>
          실서비스:{" "}
          <a href={PROD_URL} className="font-semibold text-sunset-ink underline-offset-2 hover:underline">
            {PROD_URL}
          </a>
        </span>
        <span className="text-ink-faint">·</span>
        <span>
          현재 버전: <Code>{APP_VERSION}</Code>
        </span>
      </div>

      <H2>이 서비스는 무엇인가요?</H2>
      <P>
        <strong className="font-semibold text-ink">코스</strong>는 따라갈 수 있는{" "}
        <strong className="font-semibold text-ink">이동 코스</strong>를 발견·복제·완주·구독하는
        모바일 우선 웹 커뮤니티입니다. 북스타 루프는{" "}
        <strong className="font-semibold text-ink">발견 → 따라가기 → 다녀왔어요 → 영향력</strong>
        이며, 좋아요는 보조 신호입니다.
      </P>
      <P>
        routdiary(여행 일기) 코드베이스를 fork한 MVP로, Supabase·Vercel·도메인은 완전 분리되어
        있습니다. DB URL 이름(<Code>routes</Code>)은 유지하되 사용자 노출 언어는 코스입니다.
      </P>

      <H2>누가 무엇을 읽으면 되나요?</H2>
      <DocTable
        headers={["역할", "읽는 순서", "이 가이드로 할 수 있는 일"]}
        rows={[
          [
            "기획·PM·운영",
            "시작하기 → 기획 → 현황 → 이력",
            "서비스 정의, 기능 범위·변경 이력, 운영 이슈 점검",
          ],
          [
            "프론트·풀스택",
            "시작하기 → 기획 → 화면 → 아키텍처 → 개발",
            "로컬 실행, 화면·기능 수정, 배포 전 검증",
          ],
          ["백엔드·DB", "DB → API → 개발", "스키마·권한, API 연동, 마이그레이션"],
          ["디자인", "기획 → 개발(디자인 시스템) → 화면", "UI 원칙·토큰·화면 목록 준수"],
        ]}
      />

      <H2>공식 문서 구성</H2>
      <P>아래는 현재 운영 앱 기준 정본입니다. 기능 추가·수정 시 문서와 코드를 함께 맞춥니다.</P>

      <H3Label>제품·운영</H3Label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DocCard href="/deliverables/planning" title="기획" badge="제품">
          서비스 목적, 핵심 기능, 화면 구성, 사용자 이용 흐름
        </DocCard>
        <DocCard href="/deliverables/status" title="현황" badge="운영">
          지금 제공 중인 기능, 남은 과제, 인수 후 체크리스트
        </DocCard>
        <DocCard href="/deliverables/changelog" title="이력" badge="운영">
          버전별 변경 내역 — Wave A–E · 공개 게이트
        </DocCard>
      </div>

      <H3Label>개발</H3Label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DocCard href="/deliverables/screens" title="화면" badge="개발">
          화면 주소, 로그인 요구, 이동 구조
        </DocCard>
        <DocCard href="/deliverables/architecture" title="아키텍처" badge="개발">
          Next.js · Supabase · 네이버 지도 · AuthGate
        </DocCard>
        <DocCard href="/deliverables/database" title="DB" badge="개발">
          테이블, RLS, 마이그레이션 이력
        </DocCard>
        <DocCard href="/deliverables/api" title="API" badge="개발">
          REST API와 Server Actions
        </DocCard>
        <DocCard href="/deliverables/development" title="개발" badge="개발">
          로컬 실행, env, 배포, 테스트, 디자인 시스템
        </DocCard>
      </div>

      <H2>이어받은 뒤 — 이렇게 시작하세요</H2>
      <H3Label>기획·운영</H3Label>
      <Ul>
        <li>실서비스에서 둘러보기 → 따라가기 → 다녀왔어요 → 팔로우 루프를 직접 체험</li>
        <li>
          <Link href="/deliverables/planning" className="font-semibold text-sunset-ink hover:underline">
            기획
          </Link>
          으로 제품 정의 확인
        </li>
        <li>
          <Link href="/deliverables/status" className="font-semibold text-sunset-ink hover:underline">
            현황
          </Link>
          으로 잔여 운영 과제 확인
        </li>
        <li>
          데모 계정 <Code>demo@course-sns.app</Code> / <Code>demo1234</Code>
        </li>
      </Ul>
      <H3Label>개발</H3Label>
      <Ul>
        <li>
          <Link href="/deliverables/development" className="font-semibold text-sunset-ink hover:underline">
            개발
          </Link>
          의 빠른 시작으로 로컬 실행
        </li>
        <li>기획 + 화면으로 맥락·IA 파악</li>
        <li>아키텍처 + DB + API로 수정 위치 확인</li>
        <li>
          저장소 정본: <Code>docs/HANDOFF.md</Code>, <Code>docs/DESIGN-SYSTEM.md</Code>,{" "}
          <Code>docs/COURSE-UX-DESIGN.md</Code>
        </li>
        <li>
          변경 후 <Code>pnpm lint</Code> → <Code>pnpm build</Code> → <Code>pnpm test:e2e</Code>
        </li>
      </Ul>

      <H2>서비스 한눈에 보기</H2>
      <DocTable
        headers={["구분", "내용"]}
        rows={[
          ["서비스 형태", "모바일 우선 웹앱 (~430px). PC는 폰 UI + 좌측 브랜드 레일"],
          ["언어", "한국어 UI"],
          ["로그인", "이메일·비밀번호, Google OAuth"],
          ["비로그인", "공개 코스·상세·프로필 열람 가능 (쓰기는 AuthGate)"],
          ["핵심 콘텐츠", "코스 = 스팟 순서 + 이동(Leg) + 사진·추천·난이도"],
          ["북스타 지표", "따라감 · 다녀옴 · 팔로우 (좋아요는 보조)"],
          ["수익·결제", "미구현 (무료 MVP)"],
        ]}
      />

      <H2>가이드 접속 주소</H2>
      <DocTable
        headers={["환경", "URL"]}
        rows={[
          ["실서비스", `${PROD_URL}/deliverables`],
          ["로컬 개발", "http://localhost:3000/deliverables"],
        ]}
      />
      <Note>
        각 섹션은 독립 URL이라 팀 내 공유·북마크가 가능합니다. 앱과 같은 배포에 포함되며,
        검색엔진에는 <Code>noindex</Code>입니다.
      </Note>

      <H2>지금 상태 요약</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="ok">코스 발견·지도 — 제공 중</StatusPill>
        <StatusPill tone="ok">따라가기·다녀왔어요 — 제공 중</StatusPill>
        <StatusPill tone="ok">팔로우·알림·보관함 — 제공 중</StatusPill>
        <StatusPill tone="ok">기록·계획 작성 — 제공 중</StatusPill>
        <StatusPill tone="ok">실서비스 배포 — 완료</StatusPill>
        <StatusPill tone="warn">0014 알림 마이그레이션 — 적용 확인 필요</StatusPill>
      </div>
      <P>
        상세는{" "}
        <Link href="/deliverables/status" className="font-semibold text-sunset-ink hover:underline">
          현황
        </Link>
        , 변경 이력은{" "}
        <Link href="/deliverables/changelog" className="font-semibold text-sunset-ink hover:underline">
          이력
        </Link>
        을 참고하세요.
      </P>
    </>
  );
}

function H3Label({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-sm font-semibold text-ink">{children}</h3>;
}
