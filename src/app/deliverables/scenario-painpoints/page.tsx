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
  Warn,
} from "../_components/ui";

/**
 * Scenario walkthrough UX audit — paired with /deliverables/scenarios.
 * Full detail: docs/PERSONA-SCENARIO-PAINPOINTS.md
 */
export default function ScenarioPainpointsPage() {
  return (
    <>
      <PageHeader
        title="시나리오 페인포인트"
        description="페르소나 시나리오대로 화면을 따라갈 때, UX/UI 완성도 때문에 생기는 불쾌감·이해도 저하·사용 실패를 코드 기준으로 점검한 결과입니다."
      />

      <Note>
        기준 시나리오:{" "}
        <Link
          href="/deliverables/scenarios"
          className="font-semibold text-sunset-ink hover:underline"
        >
          페르소나 시나리오
        </Link>
        · 정본 <Code>docs/PERSONA-SCENARIO-PAINPOINTS.md</Code> (2026-08-11)
      </Note>

      <Warn>
        심각도 <strong className="font-semibold">P0</strong> = 사용 막힘 ·{" "}
        <strong className="font-semibold">P1</strong> = 높은 마찰 · P2 = 혼란·불쾌 · P3 =
        폴리시
      </Warn>

      <H2>우선순위 Top 8</H2>
      <DocTable
        headers={["ID", "페르소나", "한 줄", "심각도", "유형"]}
        rows={[
          ["MAP-01", "G/P1", "✅ 지도 필터 전 패싯 재조회 (v0.3.11)", "fixed", "사용실패"],
          ["MAP-02", "G/P1", "✅ 시트 따라가기 CTA (v0.3.11)", "fixed", "사용실패"],
          ["DET-01", "G/P1", "✅ 콜드 전이 슬롯 (v0.3.11)", "fixed", "이해도저하"],
          ["LIB-01", "P2", "✅ 이동 확인=실데이터 (v0.3.12)", "fixed", "이해도저하"],
          ["PUB-01", "P3", "✅ edit visibility seed (v0.3.13)", "fixed", "사용실패"],
          ["STAT-01", "P3", "✅ 팔로워·나 (v0.3.13)", "fixed", "이해도저하"],
          ["FOL-01", "P4", "✅ 구독 코스·팔로우 관리 demote (v0.3.14)", "fixed", "이해도저하"],
          ["FOL-02", "P4", "✅ 레일→ tab=subscribed (v0.3.14)", "fixed", "사용실패"],
        ]}
      />

      <H2>G · P1 — 게스트 / 탐색러</H2>
      <H3>사용실패</H3>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">MAP-01 (P0)</strong> —{" "}
          <Code>FeedMap</Code> <Code>filterSig</Code>에 purposes·difficulties 누락 → 지도
          필터가 안 먹음
        </li>
        <li>
          <strong className="font-semibold text-ink">MAP-02 (P1)</strong> —{" "}
          <Code>RouteDetailSheet</Code> CTA가「전체 페이지에서 보기」뿐 → 따라가기 경로 단절
        </li>
        <li>
          <strong className="font-semibold text-ink">HOME-03 (✅ v0.3.16)</strong> — 「가까운」위치
          거부 시 최신순 복귀 + 안내 배너
        </li>
      </Ul>
      <H3>이해도저하</H3>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">DET-01 (P1)</strong> — 전이 0이면 ♥·저장만
          노출 → 좋아요 SNS로 오인
        </li>
        <li>
          <strong className="font-semibold text-ink">CARD-01 (✅ v0.3.16)</strong> — 콜드
          TransferPill「첫 따라가기」고정
        </li>
        <li>
          <strong className="font-semibold text-ink">HOME-01 (✅ v0.3.16)</strong> — 게스트 홈
          BrandWordmark
        </li>
        <li>
          <strong className="font-semibold text-ink">HOME-02 (✅ v0.3.16) / MAP-03</strong> — 정렬
          라벨·레이아웃 오버플로·테마 접기 · peek↔시트 콜드(G1)
        </li>
      </Ul>
      <H3>불쾌감</H3>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">DET-02 (✅ v0.3.16)</strong> — 좋아요·저장
          아이콘 demote
        </li>
      </Ul>

      <H2>P2 — 따라가이</H2>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">LIB-01 (P1 · 이해도저하)</strong> —{" "}
          <Code>FollowProgressBar</Code>가 status로「이동 확인」을 가짜 완료 처리
        </li>
        <li>
          <strong className="font-semibold text-ink">CTA-01 (P1 · 이해도저하)</strong> — 「후기
          수정」과「내 초안 다시 보기」톤이 같아 다음 행동 불명
        </li>
        <li>
          <strong className="font-semibold text-ink">LIB-04 (P1 · 이해도저하)</strong> — 저장
          카드가 따라가는 중과 유사 · 하트 잔상
        </li>
        <li>
          <strong className="font-semibold text-ink">LIB-02 / LIB-03 (P2)</strong> — 뱃지「기록
          중」· 완료 후 next가 초안만
        </li>
      </Ul>

      <H2>P3 — 코스 메이커</H2>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">PUB-01 (P1 · 사용실패)</strong> — edit마다
          공개 게이트 재강제 (<Code>visibilityChosen</Code>)
        </li>
        <li>
          <strong className="font-semibold text-ink">STAT-01 (P1 · 이해도저하)</strong> —{" "}
          <Code>ProfileDrawerBody</Code> 통계에「저장」· fallback「여행자」
        </li>
        <li>
          <strong className="font-semibold text-ink">PUB-02 / PUB-03 / STAT-02 (P2)</strong> —
          성공 토스트 모호 · 준비도 soft만 · 전이 통계 하단
        </li>
      </Ul>

      <H2>P4 — 영향력 구독자</H2>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">FOL-01 (✅ v0.3.14)</strong> —
          탭「구독 코스」·「팔로우 관리」demote
        </li>
        <li>
          <strong className="font-semibold text-ink">FOL-02 (✅ v0.3.14)</strong> —{" "}
          <Code>FollowingRail</Code> 「전체 보기」→ <Code>/library?tab=subscribed</Code>
        </li>
        <li>
          <strong className="font-semibold text-ink">FOL-03 (✅ v0.3.14)</strong> — 책장 empty
          CTA · 알림 배지 풀네임 · 소셜 demoted
        </li>
      </Ul>

      <H2>권장 수정 Wave</H2>
      <DocTable
        headers={["Wave", "이슈", "효과"]}
        rows={[
          ["G1 발견", "✅ MAP-01 · MAP-02 · MAP-03 · DET-01 (v0.3.11)", "발견→따라가기 막힘 해소"],
          ["G2 완주", "✅ LIB-01 · LIB-03 · CTA-01 · LIB-04 (v0.3.12)", "Copy→Completion"],
          ["G3 메이커", "✅ PUB-01 · STAT-01 · PUB-02 · PUB-03 · STAT-02 (v0.3.13)", "게시·영향력 루프"],
          ["G4 구독", "✅ FOL-01 · FOL-02 · FOL-03 (v0.3.14)", "팔로우→따라가기"],
          ["G5 폴리시", "✅ HOME · CARD-01 · DET-02 · 댓글 AuthGate (v0.3.16)", "첫인상·P2"],
        ]}
      />

      <H2>이미 양호한 점</H2>
      <Ul>
        <li>리스트/지도 peek에서 ♥를 전이 프루프로 쓰지 않는 방향</li>
        <li>상세 Primary「이 코스 따라가기」위계</li>
        <li>
          <Code>CopyRouteButton</Code> AuthGate 「따라가려면 로그인이 필요해요」
        </li>
        <li>보관함 탭 아이콘이 스택형(하트 아님)</li>
      </Ul>

      <P>
        상세 표·시나리오 단계 매핑은 저장소{" "}
        <Code>docs/PERSONA-SCENARIO-PAINPOINTS.md</Code>. 이전 컬러 중심 분석은{" "}
        <Code>docs/UX-PERSONA-PAINPOINTS.md</Code>.
      </P>
    </>
  );
}
