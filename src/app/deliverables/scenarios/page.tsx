import Link from "next/link";
import {
  Code,
  DocTable,
  H2,
  H3,
  Note,
  P,
  PageHeader,
  Ul,
} from "../_components/ui";

/**
 * Persona scenarios grounded in the shipped product (north-star loop).
 * Full detail: docs/PERSONA-SCENARIOS.md
 */
export default function ScenariosPage() {
  return (
    <>
      <PageHeader
        title="페르소나 시나리오"
        description="현재 배포된 coursee로 실제로 밟을 수 있는 P1–P4·게스트 시나리오입니다. 데모·QA·온보딩 스크립트로 쓰세요."
      />

      <Note>
        북스타: <strong className="font-semibold text-ink">발견 → 따라가기 → 다녀왔어요 → 영향력</strong>
        . 정본: <Code>docs/PERSONA-SCENARIOS.md</Code>. 시나리오대로 밟을 때 막히는 점 →{" "}
        <Link
          href="/deliverables/scenario-painpoints"
          className="font-semibold text-sunset-ink hover:underline"
        >
          시나리오 페인포인트
        </Link>
        .
      </Note>

      <H2>페르소나 한눈에</H2>
      <DocTable
        headers={["ID", "이름", "한 줄 목표", "주 화면", "성공 신호"]}
        rows={[
          ["P1", "탐색러", "따라갈 코스를 고른다", "홈 · 지도 · 상세", "상세 → 따라가기"],
          ["P2", "따라가이", "초안을 다듬고 다녀온다", "보관함 따라가는 중", "다녀왔어요"],
          ["P3", "코스 메이커", "남이 따라갈 동선을 공개", "FAB · 작성 · 책장", "공개 + 전이 지표"],
          ["P4", "영향력 구독자", "믿을 메이커 신작을 받는다", "책장 · 구독 코스", "팔로우 → 따라가기"],
          ["G", "게스트", "가입 전 가치를 확인", "홈 · 상세 · 책장", "열람 후 AuthGate"],
        ]}
      />

      <H2>G — 게스트 첫 방문</H2>
      <P>가입 없이 “따라가는 앱”인지 확인한 뒤, 쓰기 직전에만 로그인한다.</P>
      <DocTable
        headers={["단계", "행동", "화면", "기대"]}
        rows={[
          ["G1", "랜딩", "/", "공개 코스 쇼핑 · coursee 브랜드"],
          ["G2", "필터·정렬", "홈", "지역·누구와·난이도 / 전이 정렬"],
          ["G3", "상세", "/routes/[id]", "스펙·따라감/다녀옴 우선"],
          ["G4", "지도", "/?mode=map", "peek = 스펙+전이"],
          ["G5", "책장", "/u/[handle]", "공개 코스·팔로우 노출"],
          ["G6", "따라가기 시도", "CTA", "AuthGate"],
        ]}
      />

      <H2>P1 — 탐색러 (발견 → 따라가기)</H2>
      <P>순서·이동·난이도가 있는 동선을 고르고 내 초안으로 가져온다.</P>
      <DocTable
        headers={["단계", "행동", "기대"]}
        rows={[
          ["1", "홈에서 코스 쇼핑", "스펙 + 따라감/다녀옴 카드"],
          ["2", "필터: 지역 → 누구와 → 난이도", "실행 조건이 감정·테마보다 위"],
          ["3", "정렬「많이 따라간/다녀온」", "전이로 신뢰도 확인"],
          ["4", "(선택) 지도 peek", "♥가 아닌 스펙+전이"],
          ["5", "상세 스캔", "Primary = 따라가기"],
          ["6", "따라가기 → 계획", "비공개 초안 생성"],
          ["7", "next-step", "보관함「따라가는 중」으로 연결"],
        ]}
      />
      <H3>변형</H3>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">P1-a</strong> 저장만 → 보관함「저장」→ 나중에
          따라가기
        </li>
        <li>
          <strong className="font-semibold text-ink">P1-b</strong> 홈「구독 중인 새 코스」레일 → 상세 →
          따라가기
        </li>
        <li>
          <strong className="font-semibold text-ink">P1-c</strong> 전이 0 코스 — 좋아요 폴백이 아니라
          전이 카피
        </li>
      </Ul>
      <P>
        지표: Discovery→Detail, Detail→Copy
      </P>

      <H2>P2 — 따라가이 (복제 → 다듬기 → 다녀왔어요)</H2>
      <P>초안을 일정에 맞게 고치고, 다녀온 뒤 다음 사람을 위한 팁을 남긴다.</P>
      <DocTable
        headers={["단계", "행동", "기대"]}
        rows={[
          ["1", "/library 「따라가는 중」", "진행 중 코스 목록"],
          ["2", "카드·체크리스트", "스팟 · 이동 · 다녀왔어요"],
          ["3", "초안 편집", "스팟·이동 조정"],
          ["4", "상세「다녀왔어요」", "CTA 톤 사다리"],
          ["5", "별점 + 한 줄 팁", "원본 프루프 증가"],
          ["6", "(선택) 후기 수정", "neutral 톤"],
        ]}
      />
      <H3>변형</H3>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">P2-a</strong> 다듬지 않고 바로 완주
        </li>
        <li>
          <strong className="font-semibold text-ink">P2-b</strong> 이탈 후 보관함 체크리스트로 재진입
        </li>
        <li>
          <strong className="font-semibold text-ink">P2-c</strong> 저장 카드「따라가기」로 P2 합류
        </li>
      </Ul>
      <P>지표: Copy→Completion</P>

      <H2>P3 — 코스 메이커 (작성 → 공개 → 영향력)</H2>
      <P>남이 따라갈 수 있게 동선을 구조화해 올리고, 전이 지표로 반응을 확인한다.</P>
      <DocTable
        headers={["단계", "행동", "기대"]}
        rows={[
          ["1", "FAB → 기록/계획", "/routes/new"],
          ["2", "스팟·이동·추천·난이도", "따라갈 동선 채움"],
          ["3", "따라가기 준비도 soft hint", "미충족 시 ink 힌트"],
          ["4", "공개/비공개 명시", "공개 게이트"],
          ["5", "책장·내 코스", "공개 코스 노출"],
          ["6", "/profile/stats · 알림", "따라감·다녀옴 중심"],
        ]}
      />
      <H3>변형</H3>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">P3-a</strong> 비공개만 보관
        </li>
        <li>
          <strong className="font-semibold text-ink">P3-b</strong> 따라가기 알림·통계로 동기 부여
        </li>
        <li>
          <strong className="font-semibold text-ink">P3-c</strong> 다녀옴 후기 유입
        </li>
      </Ul>
      <P>지표: 코스당 copy_count · completions per copy</P>

      <H2>P4 — 영향력 구독자 (팔로우 → 스트림 → 따라가기)</H2>
      <P>신뢰하는 메이커의 새 코스를 구독해 받고, 필요할 때 따라간다.</P>
      <DocTable
        headers={["단계", "행동", "기대"]}
        rows={[
          ["1", "작성자 책장", "/u/[handle]"],
          ["2", "팔로우", "맞팔 라벨 가능"],
          ["3", "보관함「구독 코스」", "새 코스 스트림 우선"],
          ["4", "(또는) 홈 구독 레일", "데이터 있을 때"],
          ["5", "알림 전이·구독 그룹", "좋아요·댓글보다 위"],
          ["6", "상세 → 따라가기", "P4 → P2 전환"],
        ]}
      />
      <P>지표: Follow→Copy</P>

      <H2>북스타 end-to-end (데모용)</H2>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">P3</strong> FAB로 공개 코스 작성
        </li>
        <li>
          <strong className="font-semibold text-ink">P4</strong> 책장 팔로우
        </li>
        <li>
          <strong className="font-semibold text-ink">P1</strong> 홈/스트림에서 발견 · 따라가기
        </li>
        <li>
          <strong className="font-semibold text-ink">P2</strong> 보관함에서 다듬기 · 다녀왔어요
        </li>
        <li>
          <strong className="font-semibold text-ink">P3</strong> 알림·통계에서 전이 확인
        </li>
      </Ul>
      <Note>
        짧은 QA: 게스트 AuthGate → P1 따라가기 → P2 완주 → P3 작성·통계 → P4 팔로우·스트림
        (익숙한 기준 10–15분). 데모 계정은{" "}
        <Link href="/deliverables" className="font-semibold text-sunset-ink hover:underline">
          시작하기
        </Link>
        참고.
      </Note>

      <H2>역할 전환</H2>
      <DocTable
        headers={["From → To", "트리거"]}
        rows={[
          ["G → P1", "로그인 후 쇼핑 계속"],
          ["P1 → P2", "따라가기 성공"],
          ["P2 → P3", "FAB로 내 코스 작성"],
          ["P1/P2 → P4", "메이커 팔로우"],
          ["P4 → P2", "구독 코스 따라가기"],
        ]}
      />
      <P>한 계정이 여러 페르소나를 순차 수행하는 것이 정상입니다. 화면마다 주인공은 하나.</P>

      <H2>관련 문서</H2>
      <Ul>
        <li>
          <Link href="/deliverables/planning" className="font-semibold text-sunset-ink hover:underline">
            기획
          </Link>
          — 제품 정의·기능 목록
        </li>
        <li>
          <Link href="/deliverables/screens" className="font-semibold text-sunset-ink hover:underline">
            화면
          </Link>
          — 주소·로그인 요구
        </li>
        <li>
          <Link href="/deliverables/brand" className="font-semibold text-sunset-ink hover:underline">
            브랜드
          </Link>
          — 메시지·톤
        </li>
        <li>
          <Link
            href="/deliverables/scenario-painpoints"
            className="font-semibold text-sunset-ink hover:underline"
          >
            시나리오 페인포인트
          </Link>
          · <Code>docs/PERSONA-SCENARIO-PAINPOINTS.md</Code>
        </li>
        <li>
          <Code>docs/PERSONA-SCENARIOS.md</Code> · <Code>docs/COURSE-UX-DESIGN.md</Code> ·{" "}
          <Code>docs/UX-PERSONA-PAINPOINTS.md</Code>
        </li>
      </Ul>
    </>
  );
}
