import Link from "next/link";
import BrandMark, { BrandLockup } from "@/components/BrandMark";
import {
  Code,
  DocTable,
  H2,
  H3,
  Note,
  P,
  PageHeader,
  Ul,
  Warn,
} from "../_components/ui";

/**
 * BI · BX guide — structured like a standard brand book:
 * Identity → Message → Philosophy → Positioning → Logo system → BX touchpoints → Rules.
 * Source of truth (repo): docs/BRAND.md
 */
export default function BrandGuidePage() {
  return (
    <>
      <PageHeader
        title="브랜드 (BI · BX)"
        description="Coursee의 브랜드 아이덴티티와 로고·심볼 설계 의도, 앱에서의 브랜드 경험(BX)을 정리한 가이드입니다. 기획 카피·디자인·개발이 같은 정의를 쓰도록 한곳에 모았습니다."
      />

      <div className="rounded-2xl bg-muted/50 px-5 py-6 ring-1 ring-line">
        <BrandLockup height={44} theme="light" alt="coursee" />
        <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-ink-soft">
          Share your course. See how others get there.
        </p>
      </div>

      <H2>이 문서의 읽는 법</H2>
      <P>
        일반적인 BI 가이드(개요→메시지→철학→포지셔닝→로고)에, 제품 가이드에 필요한{" "}
        <strong className="font-semibold text-ink">BX 터치포인트</strong>와{" "}
        <strong className="font-semibold text-ink">사용 규칙</strong>을 붙였습니다.
      </P>
      <DocTable
        headers={["층", "질문", "이 페이지", "같이 볼 문서"]}
        rows={[
          ["BI Identity", "우리는 누구인가?", "개요 · 메시지 · 철학 · 포지셔닝", "기획"],
          ["BI Visual", "어떻게 보이는가?", "로고 시스템", "docs/BRAND.md · 개발(에셋)"],
          ["BX", "어디에서 느껴지는가?", "앱 경험 지점", "DESIGN-SYSTEM · 화면"],
          ["Rules", "무엇을 지키나?", "Do / Don’t", "현황 체크리스트"],
        ]}
      />
      <Note>
        저장소 정본: <Code>docs/BRAND.md</Code>. 시각 토큰·컴포넌트 규칙은{" "}
        <Code>docs/DESIGN-SYSTEM.md</Code>.
      </Note>

      <H2>1. 브랜드 개요</H2>
      <DocTable
        headers={["항목", "내용"]}
        rows={[
          ["브랜드명", "Coursee"],
          ["워드마크", "coursee (소문자)"],
          ["발음", "코르시"],
          ["표기", "번역하지 않음 — UI·문서·마케팅에서 Coursee / coursee 유지"],
          [
            "어원",
            "Cours + See — Course(과정) · See(타인의 과정을 보고 이해)",
          ],
        ]}
      />
      <H3>브랜드 정의</H3>
      <P>
        목적지만 보여주는 기존 SNS와 달리,{" "}
        <strong className="font-semibold text-ink">목적지에 이르는 과정</strong>을 기록·공유하는
        소셜 플랫폼입니다. 결과 한 컷이 아니라 단계·변화·실패·우회를{" "}
        <strong className="font-semibold text-ink">하나의 연결된 이야기</strong>로 보여 줍니다.
      </P>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">브랜드명</strong> = Coursee (서비스 아이덴티티)
        </li>
        <li>
          <strong className="font-semibold text-ink">콘텐츠 단위</strong> = 코스 (따라갈 수 있는
          동선) — 제품 UI 카피에 유지
        </li>
      </Ul>

      <H2>2. 브랜드 메시지</H2>
      <DocTable
        headers={["구분", "영문", "쓰임"]}
        rows={[
          [
            "Brand Message",
            "Share your course. See how others get there.",
            "소개·온보딩 본문",
          ],
          ["Tagline", "See how they got there.", "짧은 훅 · 캠페인"],
          ["Brand Statement", "Every destination has a course.", "브랜드 선언 · OG 보조"],
          [
            "Campaign",
            "Don’t just see the result. See the course.",
            "대비 메시지 (결과 vs 과정)",
          ],
        ]}
      />
      <Note>
        제품 UI는 행동 언어(따라가기 · 다녀왔어요)를 우선하고, 마케팅·공유 카드에는 Tagline /
        Statement를 씁니다.
      </Note>

      <H2>3. 브랜드 철학</H2>
      <DocTable
        headers={["기존 SNS가 보여주는 것", "Coursee가 보여주는 것"]}
        rows={[
          ["완성된 결과", "시작한 이유"],
          ["성공한 순간", "거친 단계"],
          ["골라낸 한 장면", "시행착오 · 변화"],
          ["지금 상태", "현재 진행"],
          ["반응 · 인기", "결과에 이른 방법"],
        ]}
      />
      <P>
        <strong className="font-semibold text-ink">핵심 가치:</strong> 목적지와 시간축을 기준으로
        흩어진 경험을 하나의 과정으로 연결한다.
      </P>

      <H2>4. 브랜드 포지셔닝</H2>
      <DocTable
        headers={["항목", "내용"]}
        rows={[
          [
            "카테고리",
            "① Journey-based social platform · ② 현실 과정의 소셜 플랫폼",
          ],
          [
            "주의",
            "「여행」만 강조하면 여행 앱과 혼동 → course · steps · progress를 함께 사용",
          ],
          [
            "Positioning",
            "Coursee is a social platform where people document, share, and follow the real steps behind every destination, achievement, and change.",
          ],
          [
            "차별점",
            "목표에 이르는 실제 과정을 구조화해 공유하는 과정 지향 소셜",
          ],
        ]}
      />

      <H2>5. 로고 시스템</H2>
      <P>
        심볼(마크)과 워드마크를 조합한 락업이 정본입니다. 라이트/다크 두 세트를 공식 SVG로
        제공합니다.
      </P>

      <H3>5.1 라이트 / 다크 락업</H3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <figure className="flex flex-col items-center justify-center rounded-2xl bg-paper px-4 py-8 ring-1 ring-line">
          <BrandLockup height={40} theme="light" alt="coursee light" />
          <figcaption className="mt-4 text-[12px] font-medium text-ink-faint">
            Light — <Code>logo-full-light.svg</Code>
          </figcaption>
        </figure>
        <figure className="flex flex-col items-center justify-center rounded-2xl bg-black px-4 py-8">
          <BrandLockup height={40} theme="dark" alt="coursee dark" />
          <figcaption className="mt-4 text-[12px] font-medium text-white/50">
            Dark — <Code>logo-full-dark.svg</Code>
          </figcaption>
        </figure>
      </div>

      <H3>5.2 심볼 (Mark)</H3>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <figure className="text-center">
          <BrandMark size={72} theme="light" alt="" />
          <figcaption className="mt-2 text-[12px] text-ink-faint">Light mark</figcaption>
        </figure>
        <figure className="rounded-2xl bg-black p-4 text-center">
          <BrandMark size={72} theme="dark" alt="" />
          <figcaption className="mt-2 text-[12px] text-white/50">Dark mark</figcaption>
        </figure>
      </div>
      <P>
        favicon · PWA · 작은 슬롯에는 심볼만. 헤더·로그인·OG·스플래시처럼 브랜드가 주인공인
        면에는 풀 락업을 씁니다.
      </P>

      <H3>5.3 심볼 설계 의도</H3>
      <P>심볼은 세 레이어로 읽습니다. 장식이 아니라 브랜드 철학의 축약입니다.</P>
      <DocTable
        headers={["요소", "의미", "영문 캡션"]}
        rows={[
          [
            "열린 C (Open C)",
            "Course의 C. 아직 닫히지 않은 과정, 새 방향으로 열린 가능성",
            "The open C represents a course still being shaped.",
          ],
          [
            "빨간 이동점",
            "사람 · 현재 위치 · 다음 한 걸음 · 목적지를 향한 진행. 컬러 #FF0000",
            "The moving point represents every step toward what comes next.",
          ],
          [
            "연한 잔상",
            "이미 지난 걸음, 기록된 과정, 시간의 축적 (모션 도트 트레일)",
            "Afterimage of steps already taken.",
          ],
        ]}
      />

      <H3>5.4 에셋 경로</H3>
      <DocTable
        headers={["용도", "파일"]}
        rows={[
          ["심볼 SVG", "public/icons/logo-mark-light/dark.svg"],
          ["풀 락업 SVG", "public/icons/logo-full-light/dark.svg"],
          ["favicon", "public/favicon.png · src/app/icon.png"],
          ["PWA", "icon-192.png · icon-512.png"],
          ["OG / Twitter", "src/app/opengraph-image.png"],
          ["컴포넌트", "BrandMark · BrandLockup"],
          ["재생성", "node scripts/build-brand-assets.mjs"],
        ]}
      />

      <H2>6. BX — 앱에서의 브랜드 경험</H2>
      <DocTable
        headers={["터치포인트", "의도", "구현"]}
        rows={[
          ["스플래시", "과정 SNS 진입 — 다크 락업", "AppSplash"],
          ["헤더", "탐색 중 브랜드 앵커", "BrandWordmark"],
          ["로그인", "신뢰·시작 — 라이트 락업", "/login"],
          ["PC 브랜드 레일", "데스크톱 브랜드 서사", "MobileFrame"],
          ["favicon / PWA", "탭·홈 화면 심볼 인지", "icon · favicon"],
          ["OG 공유", "링크 미리보기에 세계관", "dark lockup on black"],
          ["빈 상태·카피", "결과보다 과정·따라가기", "기획 · UX 카피"],
        ]}
      />

      <H2>7. Do / Don’t</H2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl ring-1 ring-line px-4 py-3">
          <p className="text-[13px] font-bold text-ink">Do</p>
          <Ul>
            <li>워드마크 <Code>coursee</Code> 소문자 유지</li>
            <li>공식 light/dark SVG만 사용</li>
            <li>열린 C + 이동점 + 잔상 의미 유지</li>
            <li>브랜드명 Coursee ≠ 콘텐츠「코스」층위 구분</li>
          </Ul>
        </div>
        <div className="rounded-2xl ring-1 ring-line px-4 py-3">
          <p className="text-[13px] font-bold text-ink">Don’t</p>
          <Ul>
            <li>그린·보라 등으로 리브랜드</li>
            <li>워드마크를 임의 폰트로 다시 치기</li>
            <li>「여행 앱」으로만 포지셔닝</li>
            <li>결과·좋아요 중심 카피로 철학과 충돌</li>
          </Ul>
        </div>
      </div>
      <Warn>
        로고를 바꾸면 SVG 수정 → <Code>node scripts/build-brand-assets.mjs</Code> →
        스플래시·헤더·로그인·레일·OG가 같은 파일을 쓰는지 확인하세요.
      </Warn>

      <H2>관련 문서</H2>
      <Ul>
        <li>
          <Link href="/deliverables/planning" className="font-semibold text-sunset-ink hover:underline">
            기획
          </Link>
          — 제품 루프·용어
        </li>
        <li>
          <Link
            href="/deliverables/development"
            className="font-semibold text-sunset-ink hover:underline"
          >
            개발
          </Link>
          — 디자인 시스템 토큰 · 아이콘 빌드
        </li>
        <li>
          <Code>docs/BRAND.md</Code> · <Code>docs/DESIGN-SYSTEM.md</Code> ·{" "}
          <Code>docs/COURSE-UX-DESIGN.md</Code>
        </li>
      </Ul>
    </>
  );
}
