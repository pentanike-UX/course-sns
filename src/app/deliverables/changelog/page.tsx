import { Code, DocTable, H2, Note, P, PageHeader, Ul } from "../_components/ui";
import { APP_VERSION } from "@/lib/version";

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        title="이력"
        description="버전별 주요 변경입니다. 상세 작업 로그는 docs/HANDOFF.md §7에 누적합니다."
      />

      <P>
        현재 버전: <Code>{APP_VERSION}</Code>
      </P>

      <H2>v0.3.22-mvp — 전체 화면·플로우 검수</H2>
      <Ul>
        <li>로그인 실패/탈출 · 작성·수정 dirty confirm · 지도/상세 CTA 위계</li>
        <li>필터 peek · kinds on map · 저장 카드·알림 empty CTA ·「여행자」제거</li>
        <li>
          정본 <Code>docs/UX-UI-GUI-AUDIT-FULL-FLOW-2026-08.md</Code>
        </li>
      </Ul>

      <H2>v0.3.21-mvp — UX/UI/GUI 검수 핫픽스</H2>
      <Ul>
        <li>지도 peek·선택 카드 primary「따라가기」· 시트 헤더 패딩</li>
        <li>게스트 브랜드 · 팔로우 중 IA · 좋아요 AuthGate · 진척/빈 상태 CTA</li>
        <li>
          검수 정본 <Code>docs/UX-UI-GUI-AUDIT-2026-08.md</Code>
        </li>
      </Ul>

      <H2>v0.3.20-mvp — 지도 kinds · plan 뒤로가기</H2>
      <Ul>
        <li>지도: 코스 기록/계획(kinds) 필터 서버 적용</li>
        <li>계획 작성 종료 → 보관함「따라가는 중」· help/screens IA 정정</li>
      </Ul>

      <H2>v0.3.19-mvp — e2e · 운영 체크리스트</H2>
      <Ul>
        <li>스모크: 보관함「구독 코스」· 따라가기 시트 카피 동기화</li>
        <li>
          <Code>/deliverables/status</Code> 인수 후 운영 항목 · HANDOFF §4 정리
        </li>
      </Ul>

      <H2>v0.3.18-mvp — IA 마감 · 리뷰 준비</H2>
      <Ul>
        <li>홈 loading 스켈레톤을 현재 피드(브랜드·정렬 칩)에 맞춤</li>
        <li>COURSE-UX / 시나리오 문서「구독 코스」정합 · HANDOFF §4 운영만 남김</li>
      </Ul>

      <H2>v0.3.17-mvp — Wave G6 (잔여 정합)</H2>
      <Ul>
        <li>지도 viewport fetch 키에 전 필터 · 게스트 <Code>/api/map-points</Code> 허용</li>
        <li>「구독 코스」카피·구독 스트림 작성자 표시 · liked 보관함 경로 제거</li>
      </Ul>

      <H2>v0.3.16-mvp — Wave G5 (P2 폴리시)</H2>
      <Ul>
        <li>게스트 홈 BrandWordmark · 정렬 라벨 · 레이아웃 오버플로 · 테마 접기</li>
        <li>「가까운」위치 거부 안내 · TransferPill「첫 따라가기」고정</li>
        <li>상세 좋아요·저장 아이콘 demote · 댓글 AuthGate</li>
      </Ul>

      <H2>v0.3.15-mvp — 로그인→작성 뒤로가기 스택</H2>
      <Ul>
        <li>Google/이메일 로그인 후 <Code>replace</Code>로 인증 화면을 히스토리에서 제거</li>
        <li>OAuth callback <Code>location.replace</Code> · 생성 직후 헤더 Back→홈</li>
        <li>의도: 더하기 직전 화면(또는 홈) ↔ 상세. 로그인으로 Back 금지</li>
      </Ul>

      <H2>v0.3.14-mvp — Wave G4 (구독 IA)</H2>
      <Ul>
        <li>보관함 탭「구독 코스」· 팔로우 관리 demote (FOL-01)</li>
        <li>홈 레일「전체 보기」→ <Code>?tab=subscribed</Code> (FOL-02)</li>
        <li>책장 empty CTA · 알림 배지 풀네임 · 소셜 mute (FOL-03)</li>
      </Ul>

      <H2>v0.3.13-mvp — Wave G3 (메이커)</H2>
      <Ul>
        <li>수정 시 공개 게이트 재선택 제거 · 공개 준비도 경고 강화</li>
        <li>저장 토스트 공개/비공개 분기 + 책장·통계 링크</li>
        <li>드로어 통계「팔로워」· 통계 페이지 전이 섹션 상단</li>
      </Ul>

      <H2>v0.3.12-mvp — Wave G2 (완주 루프)</H2>
      <Ul>
        <li>체크리스트: 이동 확인 실데이터만 · 완료 후「후기 수정」→ 원본</li>
        <li>CTA: 「후기 수정」ink solid · 초안 링크 soft · 시트「후기 저장」</li>
        <li>저장 카드: footer 바로 따라가는 중과 구분</li>
      </Ul>

      <H2>v0.3.11-mvp — Wave G1 (발견→따라가기)</H2>
      <Ul>
        <li>지도 필터: 누구와·난이도 등 전 패싯 재조회 (MAP-01)</li>
        <li>지도 시트: 「이 코스 따라가기」primary + 콜드「첫 따라가기」메타</li>
        <li>상세: 공개 코스 전이 슬롯 상시 (콜드「첫 따라가기」)</li>
      </Ul>

      <H2>v0.3.10-mvp — 시나리오 페인포인트 점검</H2>
      <Ul>
        <li>
          <Code>/deliverables/scenario-painpoints</Code> — 단계별 사용실패·이해도저하·불쾌감
        </li>
        <li>
          정본 <Code>docs/PERSONA-SCENARIO-PAINPOINTS.md</Code> · Top8 · Wave G1–G4
        </li>
      </Ul>

      <H2>v0.3.9-mvp — 페르소나 시나리오</H2>
      <Ul>
        <li>
          <Code>/deliverables/scenarios</Code> — P1–P4·게스트 happy path·변형·E2E 데모
        </li>
        <li>
          정본 <Code>docs/PERSONA-SCENARIOS.md</Code> · 기획·시작하기 연결
        </li>
      </Ul>

      <H2>v0.3.8-mvp — 브랜드(BI·BX) 가이드</H2>
      <Ul>
        <li>
          <Code>/deliverables/brand</Code> — 개요·메시지·철학·포지셔닝·로고 시스템·BX
        </li>
        <li>
          저장소 정본 <Code>docs/BRAND.md</Code> · 시작하기·내비·개발 페이지 연결
        </li>
      </Ul>

      <H2>v0.3.7-mvp — favicon·OG 공식 로고</H2>
      <Ul>
        <li>
          favicon: <Code>public/favicon.png</Code> · <Code>src/app/icon.png</Code> (공식 light
          심볼)
        </li>
        <li>
          OG/Twitter: 블랙 배경 + 공식 dark 락업 (<Code>opengraph-image.png</Code>)
        </li>
      </Ul>

      <H2>v0.3.6-mvp — OG/Twitter 공식 락업 동기화</H2>
      <Ul>
        <li>
          <Code>opengraph-image.png</Code> · <Code>twitter-image.png</Code>를 공식 light
          락업으로 갱신
        </li>
      </Ul>

      <H2>v0.3.5-mvp — 공식 SVG 라이트/다크 락업</H2>
      <Ul>
        <li>
          공식 락업: <Code>logo-full-light/dark.svg</Code> · 심볼{" "}
          <Code>logo-mark-light/dark.svg</Code>
        </li>
        <li>
          <Code>BrandLockup</Code>이 테마 전환 · 스플래시(다크)·로그인(라이트) 강제
        </li>
        <li>
          래스터 재생성: <Code>node scripts/build-brand-assets.mjs</Code> (favicon·OG 포함)
        </li>
      </Ul>

      <H2>v0.3.4-mvp — coursee 브랜드 로고</H2>
      <Ul>
        <li>심볼만: favicon · 앱아이콘 · apple-touch · 스플래시/헤더 마크</li>
        <li>풀 로고: OG/Twitter · <Code>logo-full.png</Code> · 워드마크 coursee</li>
        <li>
          (v0.3.5에서 공식 SVG로 대체) 초기 소스 <Code>public/brand/</Code>
        </li>
      </Ul>

      <H2>v0.3.3-mvp — Wave F (페르소나 후속)</H2>
      <Ul>
        <li>지도 타일 실패 배너·다시 시도 (`FeedMap`)</li>
        <li>홈 팔로잉 레일 empty 슬롯 · 보관함 팔로잉 empty CTA</li>
        <li>데모 루프 시드 migration <Code>0015</Code></li>
        <li>여행→코스 카피 · 비활성 CTA muted · 카드 스크림 · 정렬 칩 단축</li>
        <li>
          <Code>/profile</Code> 풀페이지 · 작성「사진 없이 다음」·FollowReadyHint 대표 사진
        </li>
      </Ul>

      <H2>v0.3.2-mvp — 버전·작업기록 필수 규칙</H2>
      <Ul>
        <li>
          <Code>AGENTS.md</Code>: 사소한 수정이라도 <Code>APP_VERSION</Code> 상승 +
          HANDOFF §7 + changelog 기록 (예외 없음)
        </li>
        <li>HANDOFF §6 기록 패턴·에이전트 체크리스트와 동기화</li>
      </Ul>

      <H2>v0.3.1-mvp — 업로드 사진 엑박 수정</H2>
      <Ul>
        <li>
          <Code>next/image</Code> <Code>remotePatterns</Code>에 course-sns Supabase
          호스트 허용 (포크 원본 호스트만 있던 문제)
        </li>
        <li>Storage 업로드·지도 핀은 정상이었고, 최적화 프록시만 400이던 케이스</li>
      </Ul>

      <H2>v0.3.0-mvp — Wave E</H2>
      <Ul>
        <li>상세 전이 CTA를 좋아요/저장보다 위</li>
        <li>콜드 카드·지도 peek SpecLine 패리티 · `첫 따라가기`</li>
        <li>FollowProgressBar 실데이터 · 저장함 뱃지 차별</li>
        <li>알림 `copy` · `course_publish` (0014) · 홈 팔로잉 레일</li>
        <li>`--error` brand와 분리 · 통계 타이틀 코스 통계</li>
      </Ul>

      <H2>v0.2.0-mvp — Waves A–D · 공개 게이트</H2>
      <Ul>
        <li>A: 보관함 스택 아이콘 · peek/카드 전이 프루프 · error-soft</li>
        <li>B: CTA 톤 사다리 · 저장「따라가기」· AuthGate 전이 카피 · popular 퇴장</li>
        <li>C: success teal · 플래너 레드 예산 · walk slate</li>
        <li>D: 프로필 전이 지표 · 알림 그룹 · FollowReadyHint</li>
        <li>공개/비공개 명시 선택 (`visibilityChosen`)</li>
      </Ul>

      <H2>v0.1.0-mvp — fork 초기</H2>
      <Ul>
        <li>routdiary v1.14.21 fork · 인프라 분리</li>
        <li>브랜드 레드 + 뉴트럴 · 코스 카피·IA Phase 0–3</li>
        <li>따라가기·완주·보관함 IA</li>
      </Ul>

      <H2>문서·브랜드</H2>
      <DocTable
        headers={["항목", "내용"]}
        rows={[
          ["/deliverables", "개발·운영 가이드 (이 사이트)"],
          ["아이콘·favicon·OG", "코스 C 마크 통일 (그린 routdiary 잔상 제거)"],
          ["정본 docs", "HANDOFF · DESIGN-SYSTEM · COURSE-UX · UX-PERSONA"],
        ]}
      />

      <Note>
        SemVer는 <Code>src/lib/version.ts</Code>의 <Code>APP_VERSION</Code>이 단일 출처입니다.
        에이전트 규칙(<Code>AGENTS.md</Code>): 사소한 수정이라도 버전을 올리고 HANDOFF §7에
        작업 내용을 남깁니다.
      </Note>
    </>
  );
}
